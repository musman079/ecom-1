const { chromium } = require('playwright');
const fs = require('fs');
const { JSDOM } = require("jsdom");

// file paths
let inputFilePath = './maria_b/output/list.json';
let outputFilePath = './maria_b/output/details.json';


(async () => {
    let browser = await chromium.launch({ headless: false });
    let page = await browser.newPage({ viewport: null });
    let data = initiateOutputFile();

    let GLOBAL_SKU_MAP = new Map();

    //Calculating Global products map
    for (const [key, section] of Object.entries(data)) {
        if (!section.products) {
            continue;
        }
        else {
            (section.products).forEach(product => {
                GLOBAL_SKU_MAP.set(product.sku, product);
            });
        }
    }
    //Done making gloabl products map

    for (const [key, section] of Object.entries(data)) {
        if (!section.product_urls || section.product_urls.length == 0) {
            continue;
        }
        let sectionProuducts = [];
        let saveCount = 0;
        for (const product of section.product_urls) {
            if (GLOBAL_SKU_MAP.has(product.sku)) {
                console.log(`skipping sku ${product.sku}`);
                sectionProuducts.push(GLOBAL_SKU_MAP.get(product.sku));
                continue;
            }

            console.log(`processing sku ${product.sku}`);
            let res = await fetch(product.link);
            let html = await res.text();
            const dom = new JSDOM(html).window.document;
            let desc = dom.querySelector('.product__accordion .custom-fields-parent .accordion__content')?.innerHTML?.trim();
            let in_stock = dom.querySelector('.product__title .product__badge span')?.textContent?.trim() == 'Sold out' ? false : true;
            let images = [...dom.querySelectorAll('.main-product-media-container .swiper-wrapper .swiper-slidenew')].map(img => img.querySelector('img')?.src).filter(Boolean);
            // product.images = images;
            // product.description = desc;
            // product.in_stock = in_stock;
            let final_product = { ...product, 'images': images, 'description': desc, 'in_stock': in_stock };
            sectionProuducts.push(final_product);
            GLOBAL_SKU_MAP.set(product.sku, final_product);
            console.log(`done scraping ${product.sku}`);

            saveCount++;
            if (saveCount == 100) {
                saveIncompleteProgress(data, sectionProuducts, key);
                sectionProuducts = [];
                saveCount = 0;
            }
        }

        //save the sectionProduct
        // data[key].products = sectionProuducts;
        saveIncompleteProgress(data, sectionProuducts, key);
        console.log(`${key} section complete and saved continuing`);
    }

    sortProducts(data);
    saveProgress(data);

    console.log(`Completed, Total sections produceed: ${Object.keys(data).length}`);
    browser.close();
})();


function initiateOutputFile() {
    let data;
    let productsListFile = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    //if file don't exit
    if (fs.accessSync(inputFilePath) != undefined || fs.statSync(inputFilePath).size == 0) {
        fs.writeFileSync(outputFilePath, JSON.stringify(productsListFile, null, 2));
        data = productsListFile;
        return data;
    }

    //if file already exists and have data, get new product form list.json if present into deatils.json and initiate data
    let products_urls = [];
    data = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    for (const [key, section] of Object.entries(productsListFile)) {
        if (data[key].products && data[key].products.length > 0) {
            let new_product_urls = section.product_urls.filter(product => {
                return data[key].products.find(p => p.sku === product.sku) == undefined;
            })
            data[key].product_urls = new_product_urls;
        }
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2))

    return data;
}

function saveIncompleteProgress(data, sectionProuducts, key) {
    if (!data[key].products) {
        data[key].products = [];
    }
    data[key].products.push(...sectionProuducts);
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
}

function saveProgress(data) {
    fs.writeFileSync(outputFilePath, JSON.stringify(data, null, 2));
}

function sortProducts(data) {
    const input = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    for (const [key, section] of Object.entries(data)) {

        const inputSection = input[key];
        if (!inputSection?.product_urls || !section.products) continue;

        const result = [];
        const remaining = [...section.products];

        for (const p of inputSection.product_urls) {
            const i = remaining.findIndex(r => r.sku === p.sku);
            if (i !== -1) {
                result.push(remaining[i]);
                remaining.splice(i, 1);
            }
        }

        section.products = result.concat(remaining);
    }
}