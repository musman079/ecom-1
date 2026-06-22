const fs = require('fs');

const INPUT_FILE = 'khaadi/output/details_v2.json';
const OUTPUT_FILE = 'khaadi/output/normalized.json';
const REPORT_FILE = 'khaadi/output/normalize_report.json';
const FABRIC_SEASONS = JSON.parse(fs.readFileSync('khaadi/output/fabrics.json', 'utf8'));

// ---------------- SAFE LOAD ----------------
let rawData;
try {
  rawData = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
} catch (e) {
  console.error('❌ INVALID JSON IN details.json');
  throw e;
}

// ---------------- GLOBAL VOCABULARY ----------------

const STITCH_MAP = {
  stitched: ['tailored', 'stitched', 'ready to wear', 'ready-to-wear', 'rtw'],
  unstitched: ['fabric', 'fabrics', 'unstitched']
};

const PIECES_PRIORITY = ['2 piece', '3 piece', 'tops', 'bottoms', 'dupatta'];

const PIECES_MAP = {
  '2 piece': ['2 piece', 'two piece'],
  '3 piece': ['3 piece', 'three piece'],
  tops: ['kurta', 'kameez', 'shirt', 'top', 'blouse', 'tunic'],
  bottoms: ['pant', 'pants', 'shalwar', 'trouser'],
  dupatta: ['dupatta', 'shawl', 'stole', 'cape']
};

// ---------------- STATE ----------------

const groups = [];
const references = [];
const referenceSetGlobal = new Set();

const report = {
  missing_primary: [],
  stitch_conflict: [],
  piece_conflict: [],
  price_missing: [],
  conflicting_relation: []
};

let PRODUCT_GROUP_ID = 1;

const processedSkus = new Set();
const skuOccurrences = new Map();

// ---------------- HELPERS ----------------

const norm = s => (s || '').toLowerCase();

function parseClothType(clothType, sku, report) {
  if (!clothType || !clothType.trim()) {
    report.missing_cloth_type ??= [];
    report.missing_cloth_type.push(sku);
    return {
      fabric: null,
      design_type: null
    };
  }

  const parts = clothType.split('|').map(p => p.trim()).filter(Boolean);

  if (parts.length === 2) {
    return {
      design_type: parts[0].toLowerCase(),
      fabric: parts[1] || null
    };
  }

  return {
    design_type: null,
    fabric: parts[0] || null
  };
}

// ---------------- DECISION METHODS ----------------

function decideGroupSeasons(group) {
  // 1️⃣ If group contains TOPS → use that fabric
  const topProduct = group.products.find(p => p.pieces === 'tops');

  const fabricToCheck = topProduct
    ? topProduct.fabric
    : group.products[0]?.fabric;

  if (!fabricToCheck || fabricToCheck === null) {
    return [];
  }

  const normalized = fabricToCheck
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matched = new Set();

  for (const season in FABRIC_SEASONS) {

    for (const fabric of FABRIC_SEASONS[season]) {

      const known = fabric
        .toLowerCase()
        .replace(/[-_/]/g, ' ')
        .trim();

      const regex = new RegExp(`\\b${known}\\b`, 'i');

      if (regex.test(normalized)) {
        matched.add(season);
      }
    }
  }

  return Array.from(matched);
}

function decideStitchType(product) {
  const title = norm(product.title);

  for (const stitchType in STITCH_MAP) {
    for (const word of STITCH_MAP[stitchType]) {
      if (title.includes(word)) return stitchType;
    }
  }

  return 'stitched';
}

function decidePieces(product) {
  const title = norm(product.title);

  for (const priorityKey of PIECES_PRIORITY) {
    for (const word of PIECES_MAP[priorityKey]) {
      if (title.includes(word)) return priorityKey;
    }
  }

  return null;
}

// ---------------- COLLECT SKU OCCURRENCES ----------------

for (const [categoryKey, category] of Object.entries(rawData)) {
  if (!Array.isArray(category.products)) continue;

  const pathParts = categoryKey.split('/').map(norm);
  let is_new = pathParts.includes("new_in");
  
  category.products.forEach(product => {
    if (!skuOccurrences.has(product.sku)) {
      skuOccurrences.set(product.sku, []);
    }

    product.is_new = is_new;
    skuOccurrences.get(product.sku).push({
      product,
      mapped_categories: category.mapped_categories || [],
      mapped_occasions: category.mapped_occasions || []
    });
  });
}

// ---------------- NORMALIZATION ----------------

for (const [primarySku, occurrences] of skuOccurrences.entries()) {
  if (processedSkus.has(primarySku)) continue;

  const primary = occurrences[0].product;

  const groupSkus = new Set([primarySku]);

  (primary.related_products || []).forEach(r => {
    if (r.sku && !processedSkus.has(r.sku)) {
      groupSkus.add(r.sku);
    } else if (r.sku) {
      report.conflicting_relation.push({
        from: primarySku,
        to: r.sku
      });
    }
  });

  const group = {
    id: PRODUCT_GROUP_ID++,
    images: primary.images ?? [],
    products: []
  };

  const groupCategories = new Set();
  const groupOccasions = new Set();

  for (const sku of groupSkus) {

    const contexts = skuOccurrences.get(sku);
    const referenceSet = new Set();

    let price = null;
    let discount = null;
    let stock = null;
    let details = null;
    let productForDecision = null;
    let url = null;
    let title = null;
    let clothTypeSource = null;
    let image = null;
    let is_new = false;

    if (contexts) {
      contexts.forEach(ctx => {
        const { product, mapped_categories, mapped_occasions } = ctx;
        mapped_categories.forEach(c => groupCategories.add(c));
        mapped_occasions.forEach(o => groupOccasions.add(o));

        productForDecision ||= product;

        price = product.price ?? null;
        discount = product.discount_price ?? null;
        stock = product.inStock ?? null;
        details = product.details_html || null;
        url = product.url || null;
        title = product.title || null;
        clothTypeSource = product.cloth_type;
        image = product.image;
        is_new = is_new || product.is_new;


        // path.forEach(p => {
        //   if (
        //     !Object.values(STITCH_MAP).flat().some(k => p.includes(k)) &&
        //     !Object.values(PIECES_MAP).flat().some(k => p.includes(k))
        //   ) {
        //     referenceSet.add(p);
        //   }
        // });
      });

    } else {
      const rel = (primary.related_products || []).find(r => r.sku === sku);

      if (rel) {
        productForDecision = rel;
        price = rel.price || null;
        discount = rel.discount_price || null;
        stock = rel.inStock ?? true;
        title = rel.title || null;
        image = rel.image || null;
        url = rel.url || null;
        is_new = primary.is_new;
      }

      clothTypeSource = null; // no cloth_type available
      report.missing_primary.push(sku);
    }

    if (!price) {
      report.price_missing.push(sku);
      // price = 'UNKNOWN';
    }

    const stitchType = decideStitchType(productForDecision || primary);
    const pieceType = decidePieces(productForDecision || primary);

    let fabric = null;
    let design_type = null;
    if (clothTypeSource?.trim()) {
      ({ fabric, design_type } = parseClothType(clothTypeSource));
    } else {
      (report.missing_cloth_type ??= []).push(sku);
    }

    const productObj = {
      sku,
      title,
      url,
      image: image || null,
      fabric: fabric,
      design_type: design_type,
      stitch_type: stitchType,
      pieces: pieceType,
      price,
      discount_price: discount,
      in_stock: stock ?? true,
      is_new: is_new,
      details_html: details ?? null,
      // references: []
    };

    // referenceSet.forEach(name => {
    //   productObj.references.push(name);

    //   if (!referenceSetGlobal.has(name)) {
    //     referenceSetGlobal.add(name);
    //     references.push(name);
    //   }
    // });

    group.products.push(productObj);
    processedSkus.add(sku);
  }

  group.seasons = decideGroupSeasons(group);
  group.categories = Array.from(groupCategories);
  group.occasions = Array.from(groupOccasions);

  groups.push(group);
}

// ---------------- OUTPUT ----------------

fs.writeFileSync(
  OUTPUT_FILE,
  JSON.stringify(
    {
      groups,
      // references
    },
    null,
    2
  )
);

fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

console.log('✅ NORMALIZATION COMPLETE');
console.log('⚠️ Review normalize_report.json for edge cases');