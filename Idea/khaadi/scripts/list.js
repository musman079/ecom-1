const { chromium } = require('playwright');
const fs = require('fs');

/**
 * needs handeling:
 * resume logic needed
 * should be able to renew product_urls of specific nav option while preserving the maped occasions and categoreis.
 * (optional) we could scrape the cloth type, right here at this point to handle the issue of primary and related products having different fabric type so later on when scraping the product we can also track the related sku as scraped and resuing its data.
 */

DEBUG = false;
DEPTH = 2;
const PAGE_SIZE = 20;

function initializeData(inputPath, outputPath) {

    // If file does not exist → fresh
    if (!fs.existsSync(outputPath)) {
        const fresh = JSON.parse(fs.readFileSync(inputPath));
        fs.writeFileSync(outputPath, JSON.stringify(fresh, null, 2));
        return { data: fresh, mode: 'fresh' };
    }

    const raw = fs.readFileSync(outputPath, 'utf8').trim();

    // If file exists but empty → fresh
    if (!raw) {
        const fresh = JSON.parse(fs.readFileSync(inputPath));
        fs.writeFileSync(outputPath, JSON.stringify(fresh, null, 2));
        return { data: fresh, mode: 'fresh' };
    }

    let existing;

    try {
        existing = JSON.parse(raw);
    } catch (err) {
        // If corrupted JSON → reset fresh
        const fresh = JSON.parse(fs.readFileSync(inputPath));
        fs.writeFileSync(outputPath, JSON.stringify(fresh, null, 2));
        return { data: fresh, mode: 'fresh' };
    }

    const values = Object.values(existing);

    const allHaveData = values.every(v =>
        Array.isArray(v.product_urls) && v.product_urls.length > 0
    );

    const allEmpty = values.every(v =>
        !Array.isArray(v.product_urls) || v.product_urls.length === 0
    );

    if (allHaveData || allEmpty) {
        const fresh = JSON.parse(fs.readFileSync(inputPath));
        fs.writeFileSync(outputPath, JSON.stringify(fresh, null, 2));
        return { data: fresh, mode: 'fresh' };
    }

    return { data: existing, mode: 'resume' };
}

function getCategoriesToProcess(navData) {
    return Object.entries(navData).filter(([_, category]) =>
        !Array.isArray(category.product_urls) ||
        category.product_urls.length === 0
    );
}

function saveProgress(outputPath, navData) {
    fs.writeFileSync(outputPath, JSON.stringify(navData, null, 2));
}

async function getProducts(page) {
    return await page.evaluate(() => {
        return [...document.querySelectorAll('.product-grid .product')].map(tile => {
            const link = tile.querySelector('.pdp-link a');
            const pid = tile.dataset.pid;

            if (link && link.href) return link.href;

            return `MISSING|${pid}`;
        });
    });
}


function repairUrls(productUrls) {
    return productUrls.map((url, index) => {
        if (!url.startsWith("MISSING|")) return url;
        const pid = url.split("|")[1];
        let prevIndex = index - 1;

        while (prevIndex >= 0) {
            const prevUrl = productUrls[prevIndex];
            if (!prevUrl.startsWith("MISSING|")) {
                const repaired = prevUrl.replace(/\/([^\/]+?)-VG_MULTI\.html/, (_, oldSku) => `/${pid}-VG_MULTI.html`);
                return `${repaired}|REPAIRED`;
            }
            prevIndex--;
        }
        return url;
    });
}


(async () => {

    const INPUT_PATH = 'khaadi/output/navigation_v4.json';
    const OUTPUT_PATH = 'khaadi/output/list.json';

    const { data: navData, mode } = initializeData(INPUT_PATH, OUTPUT_PATH);

    console.log(`Mode: ${mode.toUpperCase()}`);

    let browser = await chromium.launch({ headless: false });
    let page = await browser.newPage({ viewport: null });

    await page.route('**/*', route => {
        const type = route.request().resourceType();
        if (type === 'image') route.abort();
        else route.continue();
    });

    const categoriesToProcess = getCategoriesToProcess(navData);

    for (const [key, category] of categoriesToProcess) {

        const size = DEBUG ? PAGE_SIZE : 99999999;
        const url = `${category.url}?start=0&sz=${size}`;

        console.log(`Scraping: ${url}`);

        try {

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 300000 });

            await page.waitForSelector('.tile .tile-body .pdp-link a', {
                timeout: 20000
            });

            let product_urls = await getProducts(page);
            product_urls = repairUrls(product_urls);

            if (DEBUG) {
                product_urls = product_urls.slice(0, DEPTH);
            }

            category.product_urls = product_urls;
            category.products_count = product_urls.length;

        } catch (err) {

            console.log(`⚠ No products found for: ${category.url}`);
            category.product_urls = [];
            category.products_count = 0;
        }

        // 🔥 save after each category (critical for resume)
        saveProgress(OUTPUT_PATH, navData);
    }

    await browser.close();
})();
