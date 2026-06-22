const { chromium } = require('playwright'); 
const fs = require('fs');

const INPUT_FILE = '../output/navigation.json';
const OUTPUT_FILE = '../output/list.json';

const MAX_RETRIES = 4;
const SCROLL_DELAY = 800;

// This will enable first 3 products of each category
const DEBUG = true;
const DEPTH = 3;

// This will enable only first category with all products
const ONLY_FIRST_CATEGORY = false;


function saveProgress(navData) {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(navData, null, 2));
    console.log('💾 Progress saved (category level)');
}

async function autoScrollAndCollect(page, urlSet) {
    console.log("    ↳ Fast scrolling started...");

    let lastCount = 0;
    let stableRounds = 0;

    while (stableRounds < MAX_RETRIES) {

        await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
        });

        try {
            await page.waitForFunction(
                prev => document.querySelectorAll('.product').length > prev,
                lastCount,
                { timeout: 3000 }
            );
        } catch {
            stableRounds++;
        }

        const links = await page.evaluate(() => {
            return [...document.querySelectorAll('.product .pdp-link a.link')]
                .map(a => a.href);
        });

        links.forEach(link => urlSet.add(link));

        if (urlSet.size === lastCount) {
            stableRounds++;
        } else {
            stableRounds = 0;
            lastCount = urlSet.size;
            process.stdout.write(`    ↳ Loaded ~${lastCount} items...\r`);
        }

        await page.waitForTimeout(SCROLL_DELAY);
    }

    console.log("");
}

async function processNodesRecursive(nodes, page, navData) {

    let processedCount = 0;

    for (const node of nodes) {

        if (ONLY_FIRST_CATEGORY && processedCount > 0) return;

        if (node.url && node.url.trim() !== "") {
            processedCount++;

            console.log(`\n📂 Category: ${node.name.toUpperCase()}`);
            console.log(`   Link: ${node.url}`);

            try {
                await page.goto(node.url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 60000
                });

                const productUrlSet = new Set();

                if (!DEBUG) {
                    await autoScrollAndCollect(page, productUrlSet);
                } else {
                    await page.waitForTimeout(1500);

                    const debugLinks = await page.evaluate((depth) => {
                        return [...document.querySelectorAll('.product .pdp-link a.link')]
                            .slice(0, depth)
                            .map(a => a.href);
                    }, DEPTH);

                    debugLinks.forEach(link => productUrlSet.add(link));
                }

                node.product_urls = [...productUrlSet];
                node.products_count = node.product_urls.length;

                console.log(`   ✅ Found: ${node.products_count} products`);

                
                saveProgress(navData);

            } catch (err) {
                console.error(`   ❌ Error: ${err.message}`);
                node.product_urls = [];
                node.products_count = 0;
                node.error = err.message;

                
                saveProgress(navData);
            }
        }
        
        if (node.sub_nav && node.sub_nav.length > 0) {
            await processNodesRecursive(node.sub_nav, page, navData);
        }
    }
}

(async () => {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
        userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    await page.route('**/*', route => {
        const type = route.request().resourceType();
        if (['image', 'font', 'media'].includes(type)) {
            route.abort();
        } else {
            route.continue();
        }
    });

    const navData = JSON.parse(fs.readFileSync(INPUT_FILE));

    console.log("🚀 Starting Hierarchical Scraping...");
    console.log(`DEBUG MODE: ${DEBUG}`);
    console.log(`FIRST CATEGORY ONLY: ${ONLY_FIRST_CATEGORY}\n`);

    await processNodesRecursive(navData.nav, page, navData);

   
    saveProgress(navData);

    console.log(`\n🎉 Scraping complete! Data saved to ${OUTPUT_FILE}`);

    await browser.close();
})();
