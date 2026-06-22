//remove the sku extraction here put it in the details because in products list urls might have somethign extra at the end that is not present in actual sku

const { chromium } = require('playwright');
const fs = require('fs');

// fiels path
const navigation = './maria_b/output/navigation_v2.json';
const outputPath = './maria_b/output/list.json';


(async () => {
    let browser = await chromium.launch({ headless: false });
    let page = await browser.newPage({ viewport: null });
    // page.on('console', msg => console.log('BROWSER:', msg.text()));
    await page.route('**/*', route => {
        const type = route.request().resourceType();
        if (type === 'image') route.abort();
        else route.continue();
    });
    let data = initializeOutputFile();

    let navItemToScrap = Object.values(data).filter((item) => { return !item.product_urls || item.product_urls.length === 0 });

    try {
        for (const [key, item] of Object.entries(navItemToScrap)) {
            console.log(`Processing item: ${item.label}`);
            await page.goto(item.url, { waitUntil: "domcontentloaded", timeout: 300000 });
            console.log(`Rendering all pages in ${item.label}`);
            await RenderAllPages(page);
            console.log(`Done loading all pages in ${item.label}`);

            console.log(`Now getting all products url for ${item.label}`);
            let productsUrlsObj = await GetProductUrls(page);
            console.log(`Done getting all products url for ${item.label}`);

            item.product_urls = productsUrlsObj;
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            console.log(`Saved ${item.label}`);

        }
    } catch (error) {
        console.error("An error occurred:", error);
    }


    browser.close();
})();

function initializeOutputFile() {
    let data;
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
        // output doesn't exist or is empty → copy from input
        const navData = JSON.parse(fs.readFileSync(navigation, 'utf-8'));

        fs.writeFileSync(outputPath, JSON.stringify(navData, null, 2));

        data = navData;
    } else {
        // output exists → use it
        data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    }

    return data;
}

async function RenderAllPages(page) {
    await page.evaluate(async () => {

        // helper: safe delay
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // helper: XHR fetch (bypasses Shopify fetch wrappers)
        function fetchHTML(url) {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.onload = () => resolve(xhr.responseText);
                xhr.onerror = reject;
                xhr.send();
            });
        }

        const mainGrid = document.querySelector('.main-product-grid');

        let nextPageURL = document.querySelector('.infinite__scroll--button-wrap')?.querySelector('#ajaxcall')?.getAttribute('href');

        // make absolute URL if needed
        if (nextPageURL) {
            nextPageURL = new URL(nextPageURL, location.origin).href;
        }

        let visited = new Set();
        let isLoading = false;
        while (nextPageURL && !visited.has(nextPageURL)) {
            visited.add(nextPageURL);

            if (isLoading) break;
            isLoading = true;

            try {
                // small delay to avoid rate limits
                await sleep(300);
                const text = await fetchHTML(nextPageURL);

                const parsedHTML = new DOMParser().parseFromString(text, 'text/html');

                const productGrid = parsedHTML.querySelector('.main-product-grid');
                const nextUrl = parsedHTML.querySelector('#ajaxcall');

                // update next URL
                if (!nextUrl) {
                    nextPageURL = null;
                } else {
                    nextPageURL = new URL(nextUrl.getAttribute('href'), location.origin).href;
                }

                // append products
                if (productGrid && mainGrid) {
                    mainGrid.insertAdjacentHTML('beforeend', productGrid.innerHTML);
                }

            } catch (err) {
                console.error("Fetch error:", err);
                break;
            }

            isLoading = false;
        }

    });
}

async function GetProductUrls(page) {
    let products = await page.evaluate(() => {
        let products = [...document.querySelectorAll('.grid__item.scroll-trigger.animate--slide-in')].filter((e) => { return !e.classList.contains('footer-block') });

        return products.map((product, index) => {
            try {
                const link = product.querySelector('a.card__content').href;
                const sku = link.split('/').filter(Boolean).pop();
                if (sku.startsWith('mks') || sku.startsWith('mkd') || sku.startsWith('mbg')) {
                    return null
                }
                const title = product.querySelector('.card__information .card__heading a').innerText.trim();
                const priceDiv = product.querySelector('.card__information .price .price__container');
                // const price = priceDiv.querySelector('.price__regular').lastElementChild.innerText.trim().split('.').pop().replace(/,/g, '');
                const price = priceDiv.querySelector('.price-item--sale')?.innerText?.replace(/[^\d]/g, '') || priceDiv.querySelector('.price__regular') ?.lastElementChild?.innerText?.replace(/[^\d]/g, '');
                const discount_price = priceDiv.querySelector('.price__sale span:nth-child(2)')?.innerText?.trim().split('.')?.[1] == '0' ? null
                        : priceDiv.querySelector('.price__sale span:nth-child(4)')?.innerText?.trim().split('.')?.[1]?.replace(/,/g, '') || null;
                const is_new_tag_text = product.querySelector('.card__badge.top.left')?.innerText.trim();
                let is_new = false;
                if(is_new == 'New' || is_new == 'PRE ORDER'){
                    is_new = true;
                }
                return { link, sku, title, price, discount_price, is_new };
            } catch (error) {
                console.log(`Error processing product at index ${index}:`, error);
                throw error;

            }

        }).filter(Boolean);
    });

    return products;
}
