const fs = require('fs');
const mysql = require('mysql2/promise');
const he = require('he');

const currentEnv = 'local';
const DATA_FILE = './maria_b/output/normalized.json';
const BRAND_ID = 2;

// ---------------- DB -----------------

async function getDb() {
  const environments = {
    local: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'suit_dekho',
    },

    live: {
      host: 'srv2218.hstgr.io',
      user: 'u366310750_suit_dekho',
      password: '',
      database: 'u366310750_suit_dekho',
    }
  };
  return await mysql.createConnection(environments[currentEnv]);
}



// ---------------- LOAD DATA ----------------

const raw = JSON.parse(
  fs.readFileSync(DATA_FILE, 'utf8')
);

const products = raw.products || [];

// ---------------- HELPERS ----------------

function normalize(value = '') {

  return value
    .toString()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function unique(arr = []) {
  return [...new Set(arr.filter(Boolean))];
}

// ---------------- COLOR EXTRACTION ----------------

function extractColors(description = '') {

  const matches = [
    ...description.matchAll(
      /[^:]*color[^:]*:\s*(?:<\/?strong>\s*)?([^<]+)/ig
    )
  ];

  return matches
    .map(m => he.decode(m[1] || ''))
    .map(c => c.toLowerCase().trim())
    .filter(Boolean);
}

// ---------------- BUILD COLOR VOCAB ----------------

const learnedColors = new Set();

for (const product of products) {

  const extracted = extractColors(
    product.description || ''
  );

  for (const color of extracted) {

    const normalized = normalize(color);

    if (!normalized) {
      continue;
    }

    if (normalized.length < 3) {
      continue;
    }

    if (/^\d+$/.test(normalized)) {
      continue;
    }

    if (
      normalized.includes('dry-clean') ||
      normalized.includes('lawn') ||
      normalized.includes('note') ||
      normalized.includes('embroidery') ||
      normalized.includes('thread') ||
      normalized.includes('border') ||
      normalized.includes('spray') ||
      normalized.includes('fabric') ||
      normalized.includes('sequin') ||
      normalized.includes('style') ||
      normalized.includes('model') ||
      normalized.includes('wearing') ||
      normalized.includes('only') ||
      normalized.includes('detail')
    ) {
      continue;
    }

    learnedColors.add(normalized);
  }
}

// longest first
const COLOR_VOCABULARY = [...learnedColors]
  .sort((a, b) => b.length - a.length);

console.log(
  `🎨 Learned ${COLOR_VOCABULARY.length} colors`
);

// ---------------- GROUP KEY ----------------

function generateGroupKey(product) {

  const sku = normalize(product.sku);

  if (!sku) {
    return null;
  }

  const matches = [];

  for (const color of COLOR_VOCABULARY) {

    if (
      sku.endsWith(`-${color}`)
    ) {
      matches.push(color);
    }
  }

  if (!matches.length) {
    return sku;
  }

  const matchedColor = matches[0];

  const suffix = `-${matchedColor}`;

  return sku.slice(
    0,
    -suffix.length
  );
}

// ---------------- BUILD GROUPS ----------------

const groupsMap = new Map();

for (const product of products) {

  if (!product?.sku) {
    continue;
  }

  const key = generateGroupKey(product);

  if (!groupsMap.has(key)) {

    groupsMap.set(key, {
      products: [],
      categories: [],
      occasions: [],
      seasons: []
    });
  }

  const group = groupsMap.get(key);

  group.products.push(product);

  group.categories.push(
    ...(product.mapped_categories || [])
  );

  group.occasions.push(
    ...(product.mapped_occasions || [])
  );

  group.seasons.push(
    ...(product.seasons || [])
  );
}

// ---------------- DEBUG GROUPS ----------------

console.log(
  `📦 Generated ${groupsMap.size} groups`
);

// ---------------- SYNC ----------------

(async () => {

  const db = await getDb();

  await db.beginTransaction();

  try {

    const incomingSkus = new Set();

    // =========================
    // PRELOAD MASTER TABLES
    // =========================

    const seasonMap = new Map();
    const categoryMap = new Map();
    const occasionMap = new Map();

    const [seasons] = await db.execute(
      `SELECT id,name FROM seasons`
    );

    seasons.forEach(s => {
      seasonMap.set(s.name, s.id);
    });

    const [categories] = await db.execute(
      `SELECT id,name FROM categories`
    );

    categories.forEach(c => {
      categoryMap.set(c.name, c.id);
    });

    const [occasions] = await db.execute(
      `SELECT id,name FROM occasions`
    );

    occasions.forEach(o => {
      occasionMap.set(o.name, o.id);
    });

    // =========================
    // PROCESS GROUPS
    // =========================

    for (const [, group] of groupsMap.entries()) {

      let productGroupId;

      const primarySku =
        group.products[0].sku;

      // find existing group
      const [existingGroup] = await db.execute(
        `SELECT product_group_id
         FROM products
         WHERE sku=? LIMIT 1`,
        [primarySku]
      );

      if (existingGroup.length) {

        productGroupId =
          existingGroup[0].product_group_id;

      } else {

        const [res] = await db.execute(
          `INSERT INTO product_groups (brand_id)
           VALUES (?)`,
          [BRAND_ID]
        );

        productGroupId = res.insertId;
      }

      // =========================
      // PRODUCT SYNC
      // =========================

      for (const p of group.products) {

        incomingSkus.add(p.sku);

        const updatePayload = [
          productGroupId ?? null,
          p.title ?? null,
          p.link ?? null,
          p.stitch_type ?? null,
          p.pieces ?? null,
          p.design_type ?? null,
          p.fabric ?? null,
          p.price ?? null,
          p.discount_price ?? null,
          p.in_stock ?? null,
          p.is_new ?? false,
          p.description ?? null,
          p.sku ?? null
        ];

        const [updateResult] = await db.execute(
          `UPDATE products
           SET product_group_id=?,
               title=?,
               source_url=?,
               stitch_type=?,
               pieces=?,
               design_type=?,
               fabric=?,
               price=?,
               discount_price=?,
               in_stock=?,
               is_new=?,
               description=?,
               deleted_at=NULL
           WHERE sku=?`,
          updatePayload
        );

        // CREATE
        if (updateResult.affectedRows === 0) {

          const insertPayload = [
            productGroupId ?? null,
            p.sku ?? null,
            p.title ?? null,
            p.link ?? null,
            p.stitch_type ?? null,
            p.pieces ?? null,
            p.design_type ?? null,
            p.fabric ?? null,
            p.price ?? null,
            p.discount_price ?? null,
            p.in_stock ?? null,
            p.is_new ?? false,
            p.description ?? null
          ];

          await db.execute(
            `INSERT INTO products
             (
               product_group_id,
               sku,
               title,
               source_url,
               stitch_type,
               pieces,
               design_type,
               fabric,
               price,
               discount_price,
               in_stock,
               is_new,
               description
             )
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            insertPayload
          );
        }

        console.log(`✅ Synced ${p.sku}`);
      }

      // =========================
      // IMAGE SYNC
      // =========================

      for (const p of group.products) {

        const [productRows] = await db.execute(
          `SELECT id
           FROM products
           WHERE sku=? LIMIT 1`,
          [p.sku]
        );

        if (!productRows.length) {
          continue;
        }

        const productId =
          productRows[0].id;

        const incomingImages =
          unique(p.images || []);

        const [dbImages] = await db.execute(
          `SELECT i.id,i.url
           FROM images i
           JOIN image_product ip
             ON ip.image_id=i.id
           WHERE ip.product_id=?`,
          [productId]
        );

        // INSERT NEW
        for (const img of incomingImages) {

          let imageId;

          const [existingImage] =
            await db.execute(
              `SELECT id
               FROM images
               WHERE url=?
               LIMIT 1`,
              [img]
            );

          if (existingImage.length) {

            imageId =
              existingImage[0].id;

          } else {

            const [imgRes] =
              await db.execute(
                `INSERT INTO images (url)
                 VALUES (?)`,
                [img]
              );

            imageId = imgRes.insertId;
          }

          await db.execute(
            `INSERT IGNORE INTO image_product
             (image_id,product_id)
             VALUES (?,?)`,
            [imageId, productId]
          );
        }

        // DELETE STALE
        for (const dbImg of dbImages) {

          if (
            !incomingImages.includes(
              dbImg.url
            )
          ) {

            await db.execute(
              `DELETE FROM image_product
               WHERE image_id=?
               AND product_id=?`,
              [dbImg.id, productId]
            );

            // cleanup orphan images
            const [stillUsed] =
              await db.execute(
                `SELECT 1
                 FROM image_product
                 WHERE image_id=?
                 LIMIT 1`,
                [dbImg.id]
              );

            if (!stillUsed.length) {

              await db.execute(
                `DELETE FROM images
                 WHERE id=?`,
                [dbImg.id]
              );
            }
          }
        }
      }

      // =========================
      // RELATION SYNC
      // =========================

      async function syncRelation({
        junctionTable,
        relationColumn,
        masterTable,
        incomingNames,
        masterMap
      }) {

        incomingNames =
          unique(incomingNames);

        const incomingIds = [];

        for (const name of incomingNames) {

          let id =
            masterMap.get(name);

          if (!id) {

            const [res] = await db.execute(
              `INSERT INTO ${masterTable}
               (name,slug,is_active)
               VALUES(?,?,1)`,
              [
                name,
                normalize(name)
              ]
            );

            id = res.insertId;

            masterMap.set(name, id);
          }

          incomingIds.push(id);
        }

        const [existing] = await db.execute(
          `SELECT ${relationColumn}
           FROM ${junctionTable}
           WHERE product_group_id=?`,
          [productGroupId]
        );

        const existingIds =
          existing.map(
            e => e[relationColumn]
          );

        // INSERT MISSING
        for (const id of incomingIds) {

          if (
            !existingIds.includes(id)
          ) {

            await db.execute(
              `INSERT INTO ${junctionTable}
               (product_group_id,${relationColumn})
               VALUES(?,?)`,
              [productGroupId, id]
            );
          }
        }

        // DELETE STALE
        for (const id of existingIds) {

          if (
            !incomingIds.includes(id)
          ) {

            await db.execute(
              `DELETE FROM ${junctionTable}
               WHERE product_group_id=?
               AND ${relationColumn}=?`,
              [productGroupId, id]
            );
          }
        }
      }

      // =========================
      // SEASONS
      // =========================

      if (group.seasons.length) {

        await syncRelation({
          junctionTable:
            'product_group_season',

          relationColumn:
            'season_id',

          masterTable:
            'seasons',

          incomingNames:
            group.seasons,

          masterMap:
            seasonMap
        });
      }

      // =========================
      // CATEGORIES
      // =========================

      if (group.categories.length) {

        await syncRelation({
          junctionTable:
            'product_group_category',

          relationColumn:
            'category_id',

          masterTable:
            'categories',

          incomingNames:
            group.categories,

          masterMap:
            categoryMap
        });
      }

      // =========================
      // OCCASIONS
      // =========================

      if (group.occasions.length) {

        await syncRelation({
          junctionTable:
            'product_group_occasion',

          relationColumn:
            'occasion_id',

          masterTable:
            'occasions',

          incomingNames:
            group.occasions,

          masterMap:
            occasionMap
        });
      }
    }

    // =========================
    // SOFT DELETE MISSING
    // =========================

    const [brandProducts] =
      await db.execute(
        `SELECT p.id,p.sku
         FROM products p
         JOIN product_groups pg
           ON pg.id=p.product_group_id
         WHERE pg.brand_id=?`,
        [BRAND_ID]
      );

    for (const prod of brandProducts) {

      if (
        !incomingSkus.has(prod.sku)
      ) {

        await db.execute(
          `UPDATE products
           SET deleted_at=NOW()
           WHERE id=?
           AND deleted_at IS NULL`,
          [prod.id]
        );
      }
    }

    await db.commit();

    console.log(
      '✅ FULL SYNC COMPLETE'
    );

  } catch (err) {

    await db.rollback();

    console.error(
      '❌ FAILED — ROLLED BACK'
    );

    throw err;

  } finally {

    await db.end();
  }

})();