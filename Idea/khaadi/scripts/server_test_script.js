const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'khaadi/output/list.json';
const OUTPUT_FILE = 'khaadi/output/details.json';


const DEBUG = false;
const DEPTH = 2;

let GLOBAL_PRODUCT_ID = 1;

/* ---------------- VPN WAIT ---------------- */
async function waitForVPN(context) {
    const check = await context.newPage();

    for (let i = 0; i < 10; i++) {
        await check.goto('https://ifconfig.me', { waitUntil: 'domcontentloaded' });
        const body = await check.textContent('body');

        console.log('VPN IP check:', body.trim());

        if (!body.includes('United Arab Emirates')) {
            console.log('✅ VPN is active');
            await check.close();
            return;
        }

        await new Promise(r => setTimeout(r, 3000));
    }

    throw new Error('❌ VPN never became active');
}


(async () => {
    const EXTENSION_PATH = path.resolve(__dirname, '../../nordvpn-extension');
    const USER_DATA_DIR = path.resolve(__dirname, '../../pw-profile');

    const CONCURRENCY = 2;

    const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
        headless: false,
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
            '--disable-blink-features=AutomationControlled',
            '--start-maximized',
            '--enable-features=ExtensionsToolbarMenu'
        ],
        viewport: null
    });

    await waitForVPN(context);

    await context.route('**/*', route => {
        const type = route.request().resourceType();
        if (
            type === 'image' ||
            type === 'font' ||
            type === 'stylesheet' ||
            type === 'media'
        ) {
            route.abort();
        } else {
            route.continue();
        }
    });

    // Warm-up
    const warmup = await context.newPage();
    try {
        await warmup.goto('https://pk.khaadi.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
    } catch (e) {
        console.warn('⚠️ Warm-up failed, continuing anyway...');
    }
    await warmup.waitForTimeout(2000);
    await warmup.close();


    const pages = await Promise.all(
        Array.from({ length: CONCURRENCY }, () => context.newPage())
    );

    // 🔁 LOAD OR INIT OUTPUT
    const data = fs.existsSync(OUTPUT_FILE)
        ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
        : (() => {
            const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(input, null, 2));
            return input;
        })();

    // const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    for (const navItem of data.nav) {
        await traverseNav(navItem, pages, data);
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

    await browser.close();
})();



async function traverseNav(node, pages, data) {
    const hasProducts = Array.isArray(node.product_urls) && node.product_urls.length > 0;

    const hasChildren = Array.isArray(node.sub_nav) && node.sub_nav.length > 0;

    // CASE 1: scrape products at this node
    if (hasProducts) {
        console.log('▶ Products found, scraping...');

        await scrapeProductUrls(node.product_urls, pages, node, data);

        // mark node complete
        if (!DEBUG) delete node.product_urls;

        // save structural progress
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
        return;
    }

    // CASE 2: go deeper
    if (hasChildren) {
        for (const child of node.sub_nav) {
            await traverseNav(child, pages, data);
        }
        return;
    }

    // CASE 3: nothing here
    return;
}


async function scrapeProductUrls(urls, pages, node, data) {
    node.products ||= [];

    const scrapedUrls = new Set(node.products.map(p => p.url));
    const urlsToScrape = DEBUG ? urls.slice(0, DEPTH) : urls;

    let index = 0;
    let fatalError = null;

    // resume-safe global ID
    if (node.products.at(-1)?.id > 1) {
        GLOBAL_PRODUCT_ID = node.products.at(-1).id + 1;
    }

    async function worker(page) {
        while (true) {
            if (fatalError) return;

            const url = urlsToScrape[index++];
            if (!url) return;
            if (scrapedUrls.has(url)){
              console.log(`⏭ Skipping already scraped: ${url}`);  
              continue;
            } 

            try {
                console.log(`Scraping: ${url}`);
                await page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30000
                });

                const product = await extractProductDetails(page);

                node.products.push({
                    id: GLOBAL_PRODUCT_ID++,
                    url,
                    ...product
                });

            } catch (err) {
                console.error(`❌ Failed: ${url}`);
                fatalError = err;

                // TEMP behavior: save & stop
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
                throw err;
            }
        }
    }

    await Promise.all(pages.map(worker));

    // Save once after category
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

    if (fatalError) {
        throw fatalError; // stops traversal if you want
    }
}



async function extractProductDetails(page) {
    return await page.evaluate(() => {

        const text = el => el ? el.innerText.trim() : '';

        const cleanNode = (node) => {
            if (!node) return '';
            const clone = node.cloneNode(true);
            clone.querySelectorAll('*').forEach(el => el.removeAttribute('class'));
            return clone.innerHTML.replace(/\n+/g, '').replace(/\s{2,}/g, ' ').replace(/>\s+</g, '><').trim();
        };

        /* ---------- PRICE HELPER ---------- */
        function extractPrice() {
            let price = null;
            let discount_price = null;
            let inStock = true;

            let salePrice = null;
            let listPrice = null;

            for (const script of document.scripts) {
                const t = script.textContent;
                if (!t) continue;

                if (t.includes('Product-Show')) {
                    const saleMatches = [...t.matchAll(/(?:^|[^\w])salePrice\s*=\s*([\d.]+)/g)];
                    const listMatches = [...t.matchAll(/(?:^|[^\w])listPrice\s*=\s*([\d.]+)/g)];

                    salePrice = saleMatches.length ? saleMatches[saleMatches.length - 1][1] : null;

                    listPrice = listMatches.length ? listMatches[listMatches.length - 1][1] : null;

                    break;
                }
            }

            // ❌ Out of stock
            if (!salePrice && !listPrice) {
                inStock = false;
                return { price, discount_price, inStock };
            }

            // ✅ Discounted
            if (listPrice) {
                price = listPrice;
                discount_price = salePrice;
                return { price, discount_price, inStock };
            }

            // ✅ Regular
            price = salePrice;
            return { price, discount_price, inStock };
        }


        /* ---------- PRODUCT CARD HELPER ---------- */
        function extractProductCard(container) {
            const title =
                text(container.querySelector('h2.product-name, h1.product-name')) ||
                text(container.querySelector('.product-name a'));

            const sku =
                container.querySelector('.product-number span:not(.product-id)')?.innerText.trim() ||
                container.getAttribute('data-pid') ||
                '';

            const urlEl = container.querySelector('.product-name a[href]');
            const url = urlEl
                ? new URL(urlEl.getAttribute('href'), location.origin).href
                : null;

            return {
                title,
                sku,
                url,
                ...extractPrice(container)
            };
        }

        /* ---------- MAIN PDP ---------- */
        const main = extractProductCard(document);

        const cloth_type = text(document.querySelector('.product-brand'));

        const images = [...new Set(
            Array.from(document.querySelectorAll(
                'a[href*="/dw/image/"], img[src*="/dw/image/"]'
            ))
                .map(el => el.getAttribute('href') || el.getAttribute('src'))
                .filter(Boolean)
        )];

        const detailsNode = document.querySelector('ul.spec-list');
        const details_html = detailsNode ? cleanNode(detailsNode) : '';

        /* ---------- RELATED PRODUCTS ---------- */
        const related_products = [];
        const currentSku = main.sku;

        const bundleContainer = document.querySelector(
            '.products-listing .set-items.bundled-product-listing'
        );

        if (bundleContainer) {
            bundleContainer
                .querySelectorAll('.product-detail.set-item.inner')
                .forEach(block => {
                    const related = extractProductCard(block);
                    if (related.sku && related.sku !== currentSku) {
                        related_products.push(related);
                    }
                });
        }

        return {
            title: main.title,
            sku: main.sku,
            cloth_type,
            price: main.price,
            discount_price: main.discount_price,
            inStock: main.inStock,
            images,
            details_html,
            related_products
        };
    });
}



