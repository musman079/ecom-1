const { chromium } = require('playwright');
const fs = require('fs');

/**
 * needs handeling: 
 * embroided or printed may not exist on some products
 * primary and related products may have differnet fabric type
 * if new skus/products are added to the some category product_urls, we should be able to scrape them without rescraping all and breaking the existing data (resume safe)
 * if we do above we should also make the order of the scraped products and the product_urls same becaseue concurrent scrapiong chagnes order, to show the new products fisrt on based order secquence.
 * keep the classes of description li element to know if it has desription related to multiple sub products.
 */


const INPUT_FILE = 'khaadi/output/list.json';
const OUTPUT_FILE = 'khaadi/output/details_v2.json';

const DEBUG = false;
const DEPTH = 4;

let GLOBAL_PRODUCT_ID = 1;

(async () => {

    const CONCURRENCY = 4;

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();

    await context.route('**/*', route => {
        const type = route.request().resourceType();
        if (['image', 'font', 'stylesheet', 'media'].includes(type)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    const pages = await Promise.all(
        Array.from({ length: CONCURRENCY }, () => context.newPage())
    );

    // 🔁 LOAD OR INIT OUTPUT (resume safe)
    const data = fs.existsSync(OUTPUT_FILE)
        ? JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
        : (() => {
            const input = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
            fs.writeFileSync(OUTPUT_FILE, JSON.stringify(input, null, 2));
            return input;
        })();

    // 🔁 Build global SKU map (resume safe)
    const GLOBAL_SKU_MAP = new Map();

    for (const category of Object.values(data)) {
        if (!Array.isArray(category.products)) continue;

        for (const product of category.products) {
            GLOBAL_SKU_MAP.set(product.sku, product);
            GLOBAL_PRODUCT_ID = Math.max(GLOBAL_PRODUCT_ID, product.id + 1);
        }
    }

    // 🔄 Iterate flat structure
    for (const [key, category] of Object.entries(data)) {

        if (!Array.isArray(category.product_urls) || !category.product_urls.length)
            continue;

        console.log(`\n▶ Processing category: ${key}`);

        await scrapeProductUrls(category, pages, data, GLOBAL_SKU_MAP);

        if (!DEBUG) delete category.product_urls;

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    }

    await browser.close();
})();


async function scrapeProductUrls(category, pages, data, GLOBAL_SKU_MAP) {

    const existingUrls = new Set(
        (category.products || []).map(p => p.url)
    );
    category.products ||= [];

    const urls = DEBUG
        ? category.product_urls.slice(0, DEPTH)
        : category.product_urls;

    let index = 0;
    let fatalError = null;

    async function worker(page) {
        while (true) {

            if (fatalError) return;

            const url = urls[index++];
            if (!url) return;

            const cleanUrl = url.split("|")[0];

            const skuFromUrl = cleanUrl.match(/\/([^\/]+?)-VG_MULTI\.html/)?.[1];

            if (existingUrls.has(cleanUrl)) {
                console.log(`⏭ Skipping already scraped: ${cleanUrl}`);
                continue;
            }

            // 🔁 SKU already scraped
            if (skuFromUrl && GLOBAL_SKU_MAP.has(skuFromUrl)) {

                console.log(`↺ Reusing SKU: ${skuFromUrl}`);

                const existing = GLOBAL_SKU_MAP.get(skuFromUrl);

                const { id: _, url: __, ...rest } = existing;

                category.products.push({
                    id: GLOBAL_PRODUCT_ID++,
                    url: cleanUrl,
                    ...rest
                });
                existingUrls.add(cleanUrl);

                continue;
            }

            try {

                console.log(`Scraping: ${cleanUrl}`);

                await page.goto(cleanUrl, {
                    waitUntil: 'domcontentloaded',
                    timeout: 300000
                });

                const product = await extractProductDetails(page);

                const newProduct = {
                    id: GLOBAL_PRODUCT_ID++,
                    url: cleanUrl,
                    ...product
                };

                category.products.push(newProduct);
                existingUrls.add(cleanUrl);

                if (product.sku) {
                    GLOBAL_SKU_MAP.set(product.sku, product);
                }

            } catch (err) {

                console.error(`❌ Failed: ${cleanUrl}`);
                fatalError = err;

                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
                throw err;
            }
        }
    }

    await Promise.all(pages.map(worker));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

    if (fatalError) throw fatalError;
}



async function extractProductDetails(page) {
    return await page.evaluate(() => {

        const text = el => el ? el.innerText.trim() : '';

        const cleanNode = (node) => {
            if (!node) return '';
            const clone = node.cloneNode(true);
            clone.querySelectorAll('*').forEach(el => {
                if (el.classList.contains('spec-list-title')) {
                    el.className = 'spec-list-title';
                } else {
                    el.removeAttribute('class');
                }
            });
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
        function extractProductCard(container, related = false) {
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

            let product = {
                title,
                sku,
                url,
                ...extractPrice(container)
            }
            if (related) {
                const imageSrc = container.querySelector('.bundled-image-wrapper img').src;
                product.image = imageSrc ?? null;
            }
            return product;
        }

        /* ---------- MAIN PDP ---------- */
        const main = extractProductCard(document);

        const cloth_type = text(document.querySelector('.product-brand'));

        const images = [...new Set(
            Array.from(document.querySelectorAll(
                '.slider-pdp .inner a[href*="/dw/image/"] img[src*="/dw/image/"]'
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
                    const related = extractProductCard(block, true);
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
