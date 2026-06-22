const { chromium } = require('playwright');
const fs = require('fs');


const INPUT_FILE = '../output/list.json';
const OUTPUT_FILE = '../output/details.json';
const ERROR_LOG = '../output/failed_links.log';


const DEBUG = true;       
const DEPTH = 1;           
const MAX_RETRIES = 3;     


let FULL_DATA_TREE = null;
let GLOBAL_PRODUCT_ID = 1;


const GLOBAL_CACHE = new Map();


let SAVE_COUNTER = 0;

function saveProgress(force = false) {
    SAVE_COUNTER++;
    if (force || SAVE_COUNTER % 20 === 0) {
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(FULL_DATA_TREE, null, 2));
        console.log('💾 Progress saved');
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    const page = await context.newPage();

    
    await page.route('**/*', route => {
        const type = route.request().resourceType();
        if (['font', 'media', 'stylesheet'].includes(type)) route.abort();
        else route.continue();
    });

    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`Error: ${INPUT_FILE} not found.`);
        process.exit(1);
    }
    const inputData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));

    
    FULL_DATA_TREE = loadOrInitializeOutput(inputData);
    
    
    syncGlobalIDAndCache(FULL_DATA_TREE);

    console.log("🚀 Starting Product Detail Scraping...");
    console.log(`ℹ️  Mode: ${DEBUG ? 'DEBUG (Fast Test)' : 'PRODUCTION (Full Scrape)'}`);

    
    if (inputData.nav && FULL_DATA_TREE.nav) {
        await traverseNav(inputData.nav, FULL_DATA_TREE.nav, page);
    }

    
    saveProgress(true);

    console.log("\n🎉 Scraping Complete! File saved.");
    await browser.close();
})();



function loadOrInitializeOutput(inputData) {
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
            if (content.trim()) {
                console.log('🔄 Resuming from existing sapphire_details.json...');
                return JSON.parse(content);
            }
        } catch (e) {
            console.log('⚠️  Output file corrupt. Starting fresh.');
        }
    }

    console.log('✨ Creating fresh output structure...');
    const cleanData = JSON.parse(JSON.stringify(inputData));
    prepareStructure(cleanData.nav);
    return cleanData;
}

function prepareStructure(nodes) {
    if (!nodes) return;
    for (const node of nodes) {
        if (node.product_urls) delete node.product_urls;
        if (!node.products) node.products = [];
        if (node.sub_nav) prepareStructure(node.sub_nav);
    }
}

function syncGlobalIDAndCache(root) {
    function traverse(nodes) {
        if (!nodes) return;
        for (const node of nodes) {
            if (node.products) {
                node.products.forEach(p => {
                    if (p.id >= GLOBAL_PRODUCT_ID) GLOBAL_PRODUCT_ID = p.id + 1;
                    if (p.url) GLOBAL_CACHE.set(p.url, p);
                });
            }
            if (node.sub_nav) traverse(node.sub_nav);
        }
    }
    traverse(root.nav);
    console.log(`ℹ️  Global ID synced. Next ID: ${GLOBAL_PRODUCT_ID}`);
    console.log(`ℹ️  Cache pre-filled with ${GLOBAL_CACHE.size} items.`);
}

async function traverseNav(inputNodes, outputNodes, page) {
    if (!inputNodes || !outputNodes) return;

    for (let i = 0; i < inputNodes.length; i++) {
        const inputNode = inputNodes[i];
        const outputNode = outputNodes[i];

        if (inputNode.product_urls && inputNode.product_urls.length > 0) {
            console.log(`\n📂 Category: ${inputNode.name}`);
            await scrapeCategory(inputNode, outputNode, page);
        }

        if (inputNode.sub_nav && outputNode.sub_nav) {
            await traverseNav(inputNode.sub_nav, outputNode.sub_nav, page);
        }
    }
}

async function scrapeCategory(inputNode, outputNode, page) {
    const urlsToScrape = DEBUG ? inputNode.product_urls.slice(0, DEPTH) : inputNode.product_urls;
    const currentCategoryUrls = new Set(outputNode.products.map(p => p.url));

    let scrapedCountForThisCategory = 0;

    for (const url of urlsToScrape) {
        if (DEBUG && scrapedCountForThisCategory >= DEPTH) break;
        if (currentCategoryUrls.has(url)) continue;

        if (GLOBAL_CACHE.has(url)) {
            const cachedProduct = GLOBAL_CACHE.get(url);
            const productCopy = {
                ...cachedProduct,
                id: GLOBAL_PRODUCT_ID++
            };

            console.log(`  ⚡ Cache Hit (Copying): ${url}`);
            outputNode.products.push(productCopy);
            outputNode.products_count = outputNode.products.length;
            scrapedCountForThisCategory++;

            saveProgress();
            continue;
        }

        console.log(`  Trying: ${url}`);

        let success = false;
        let attempts = 0;
        let data = null;

        while (attempts < MAX_RETRIES && !success) {
            try {
                attempts++;
                await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
                data = await extractDetails(page);
                success = true;
            } catch (err) {
                if (attempts < MAX_RETRIES) await page.waitForTimeout(2000);
            }
        }

        if (success && data) {
            const finalProduct = {
                id: GLOBAL_PRODUCT_ID++,
                url: url,
                ...data
            };

            outputNode.products.push(finalProduct);
            outputNode.products_count = outputNode.products.length;
            GLOBAL_CACHE.set(url, finalProduct);

            scrapedCountForThisCategory++;
            console.log(`    ✅ Scraped: ${data.sku} | ${data.title.substring(0, 25)}...`);

            saveProgress();
        } else {
            console.error(`    ❌ Failed to scrape ${url}`);
            fs.appendFileSync(ERROR_LOG, `${url}\n`);
        }
    }
}

 
async function extractDetails(page) {
    return await page.evaluate(() => {
        const getText = (sel) => document.querySelector(sel)?.innerText.trim() || '';

        const title = getText('.product-name');
        const sku = getText('.product-id');

        let price = '';
        let discount_price = null;

        const oldPriceEl = document.querySelector('.price del .value, .price .strike-through .value');
        const currentPriceEl = document.querySelector('.price .sales .value');

        if (oldPriceEl && currentPriceEl) {
            price = oldPriceEl.innerText.trim();
            discount_price = currentPriceEl.innerText.trim();
        } else if (currentPriceEl) {
            price = currentPriceEl.innerText.trim();
        }

        let inStock = true;
        const sizeItems = document.querySelectorAll('.pdp-sizes .size-item');

        if (sizeItems.length > 0) {
            const allDisabled = Array.from(sizeItems).every(item =>
                item.classList.contains('availableDisabled') ||
                item.classList.contains('disabled')
            );
            if (allDisabled) inStock = false;
        } else {
            const btn = document.querySelector('button.add-to-cart');
            if (btn && btn.hasAttribute('disabled')) {
                const btnText = btn.innerText.toLowerCase();
                if (btnText.includes('sold out') || btnText.includes('out of stock')) {
                    inStock = false;
                }
            }
        }

        const images = Array.from(document.querySelectorAll('img.pdp-image'))
            .map(img => img.getAttribute('data-high-src') || img.src)
            .filter(src => src && !src.includes('base64'));

        const uniqueImages = [...new Set(images)];

        let details_html = '';
        ['#nav-details .value.content', '#nav-description .value.content', '#nav-size .value.content']
            .forEach(selector => {
                const el = document.querySelector(selector);
                if (el && el.innerHTML.trim() !== '') details_html += el.innerHTML.trim();
            });

        let cloth_type = 'Unknown';
        const detailsTextNode = document.querySelector('#nav-details .value.content');
        if (detailsTextNode) {
            const match = detailsTextNode.innerText.match(/Fabric:\s*(.*?)(\n|$)/i);
            if (match && match[1]) cloth_type = match[1].trim();
        }

        const related_products = [];
        document.querySelectorAll('.shopthelook-product').forEach(item => {
            const linkEl = item.querySelector('a.shopthelook-product-item-name');
            const priceEl = item.querySelector('.shopthelook-product-item-price');
            const imgEl = item.querySelector('img.product-tile-component-image');
            const inputEl = item.querySelector('input.shopthelook-product-item-option');

            if (linkEl) {
                related_products.push({
                    title: linkEl.innerText.trim(),
                    url: linkEl.href,
                    price: priceEl ? priceEl.innerText.trim() : '',
                    sku: inputEl ? inputEl.getAttribute('data-product-id') : '',
                    image: imgEl ? (imgEl.getAttribute('data-src') || imgEl.src) : ''
                });
            }
        });

        return {
            title,
            sku,
            cloth_type,
            price,
            discount_price,
            inStock,
            images: uniqueImages,
            details_html,
            related_products
        };
    });
}
