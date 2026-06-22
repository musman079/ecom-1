const fs = require('fs');

let inputFilePath = './maria_b/output/details.json';
let fabricsFilePath = './maria_b/output/fabrics.json';
let normalizedFilePath = './maria_b/output/normalized.json';

let data = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));
let seasonFabrics = JSON.parse(fs.readFileSync(fabricsFilePath, 'utf-8'));

let normalizedProducts = {
    count: 0,
    created_at: new Date().toLocaleString(),
    products: [],
};

(async => {
    let skuOccurances = new Map();

    for (const [key, section] of Object.entries(data)) {
        for (const product of section.products) {
            if (!skuOccurances.has(product.sku)) {
                skuOccurances.set(product.sku, [])
            }
            else {
                console.log(`Duplicate SKU found: ${product.sku}`);
                continue;
            }

            //if same path product exist then dont add it agian to ensure uniqueness
            // let occurancePaths = skuOccurances.get(product.sku)?.map(p => p.path);
            // if (occurancePaths?.includes(product.path)) {
            //     continue;
            // }


            skuOccurances.get(product.sku).push({
                ...product,
                // path: key,
                mapped_categories: section.mapped_categories || [],
                mapped_occasions: section.mapped_occasions || []
            })

        }
        // console.dir(skuOccurances, {depth: null});
        // process.exit();
    }


    console.log(`Total unique SKUs: ${skuOccurances.size}`);

    for (const [sku, product] of skuOccurances.entries()) {
        let fabric = null;
        let design_type = null;
        let pieces = null;
        let stitch_type = null;
        let seasons = null;
        // let categories = null;  //could run the search for cateogires on descriptoin in future

        if (product.length > 1) {
            console.log('duplicate product in skuOccurances found');
            process.exit();
        }
        
        product[0].fabric = decideFabric(product[0]);
        product[0].seasons = decideSeason(product[0]);
        product[0].design_type = decideDesignType(product[0]);
        product[0].stitch_type = decideStitchType(product[0]);
        product[0].pieces = decidePieces(product[0]);
        product[0].images = product[0].images.map(img => img.replace(/^\/\//, 'https://'));

        normalizedProducts.products.push(product[0]);
        normalizedProducts.count++;
        // console.log(product[0]);
        // process.exit();

    }

    fs.writeFileSync(normalizedFilePath, JSON.stringify(normalizedProducts, null, 2), 'utf-8');

})();

function decideFabric(product) {
    let description = product.description || '';
    let title = product.title.toLowerCase() || '';
    let fabric = description.match(/fabric:\s*([^<]+)/i);
    if (fabric) {
        return fabric[1].toLowerCase();
    }

    //if no fabric in description then find it form title
    let fabric2 = "";
    for (const [season, fabrics] of Object.entries(seasonFabrics)) {
        let innerfabrics = fabrics.map(f => f.toLowerCase());
        for (const fabric of innerfabrics) {
            if (title.includes(fabric)) {
                fabric2 = `${fabric2} ${fabric}`;
            }
        }
    }
    return fabric2 ? fabric2.toLowerCase().trim() : null;
}

function decideSeason(product) {
    let scores = { summer: 0, winter: 0 };
    let extractedFabricsStr = [...product.description.matchAll(/fabric:\s*([^<]+)/ig)].map(m => m[1].toLowerCase()).join(" ");

    if (!extractedFabricsStr) {
        extractedFabricsStr = [...product.description.matchAll(/[^:]*fabric[^:]*:\s*(?:<\/?strong>\s*)?([^<]+)/ig)].map(m => m[1].toLowerCase().trim()).join(" ");
    }
    if (!extractedFabricsStr && product.fabric) {
        extractedFabricsStr = product.fabric.toLowerCase();
    }

    for (const [season, fabrics] of Object.entries(seasonFabrics)) {
        let innerfabrics = fabrics.map(f => f.toLowerCase());
        for (const fabric of innerfabrics) {
            if (!extractedFabricsStr.includes(fabric)) {
                continue;
            }

            let appearanceCount = 0;
            if (seasonFabrics.summer.map(f => f.toLowerCase()).includes(fabric)) appearanceCount++;
            if (seasonFabrics.winter.map(f => f.toLowerCase()).includes(fabric)) appearanceCount++;
            let points = (appearanceCount === 1) ? 10 : 1;
            scores[season] += points;
        };
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return [];
    return Object.keys(scores).filter(s => scores[s] === maxScore);
}


function decideDesignType(product) {
    const title = product.title.toLowerCase();
    const types = ['printed', 'embroidered', 'embellished'];

    for (const type of types) {
        if (title.includes(type)) {
            return type;
        }
    }
    return null;
}

function decideStitchType(product) {
    const title = product.title.toLowerCase();
    let type = 'stitched';
    if (title.includes('stitched')) {
        type = 'stitched';
    }
    if (title.includes('unstitched')) {
        type = 'unstitched';
    }
    return type;
}

function decidePieces(product) {
    const title = product.title.toLowerCase();
    let pieces = null;
    if (title.includes('2 piece')) {
        pieces = '2 piece';
    }
    if (title.includes('3 piece') || title.includes('saree')) {
        pieces = '3 piece';
    }
    return pieces;
}
