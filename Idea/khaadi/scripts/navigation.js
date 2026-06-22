const { chromium } = require('playwright');
const fs = require('fs');

const navData = JSON.parse(fs.readFileSync('khaadi/output/navigation_v2.json'));
const tempData = JSON.parse(fs.readFileSync('khaadi/output/navigation_v3.json'));

(async () => {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    await page.route('**/*', route => {
        if (route.request().resourceType() === 'image') {
            route.abort();
        } else {
            route.continue();
        }
    });

    // Initial URLs
    const startUrls = Object.values(navData).map(v => v.url);
    // const allUrls = await crawl(page, startUrls);
    // console.log([...allUrls]);
    await browser.close();

    //MERGE NAV DATA WITH CRAWLED URLS
    // let res = [...allUrls].map(url => {
    //     let key = url.split('/').slice(3).slice(0, -1).join('/').replace(/-/g, '_');
    //     let label = key.split('/').pop().replace(/_/g, ' ').toUpperCase();
        
    //     return {[key]:{"label": label, "url": url, product_url: []}};
    // });
    // const mergedRes = Object.assign({}, ...res);
    // fs.writeFileSync("khaadi/output/navigation_v3.json", JSON.stringify({ ...navData, ...mergedRes }, null, 2));


    //temp
    console.log(Object.entries(tempData).length);
    
    
})();

async function crawl(page, startUrls) {
    const visited = new Set();
    const results = new Set();
    const seedSet = new Set(startUrls);
    const queue = [...startUrls];

    while (queue.length > 0) {
        const currentUrl = queue.shift();

        if (visited.has(currentUrl)) continue;

        visited.add(currentUrl);

        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 300000 });

        const newUrls = await extractUrls(page);

        for (const url of newUrls) {
            if (!visited.has(url)) {
                queue.push(url);
            }

            if (!seedSet.has(url)) {
                results.add(url);
            }
        }
    }

    return results;
}


async function extractUrls(page) {
    return await page.evaluate(() => {
        const urls = [];

        const elements = document.querySelectorAll(".slick-slide a[href]");

        for (const el of elements) {
            urls.push(el.href);
        }

        return urls;
    });
}