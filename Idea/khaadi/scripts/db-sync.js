const fs = require('fs');
const mysql = require('mysql2/promise');


const currentEnv = 'local';
const DATA_FILE = 'khaadi/output/normalized.json';
const BRAND_ID = 1;

(async () => {

  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  const environments = {
    local: {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'suit_dekho',
    },

    live: {
      host: 'u366310750',
      user: 'u366310750_suit_dekho',
      password: '',
      database: 'u366310750_suit_dekho',
    }
  };
  
  const db = await mysql.createConnection(environments[currentEnv]);

  await db.beginTransaction();

  try {

    const incomingSkus = new Set();

    /* =========================
       PRELOAD MASTER TABLES
    ========================== */

    const seasonMap = new Map();
    const categoryMap = new Map();
    const occasionMap = new Map();

    const [seasons] = await db.execute(`SELECT id,name FROM seasons`);
    seasons.forEach(s => seasonMap.set(s.name, s.id));

    const [categories] = await db.execute(`SELECT id,name FROM categories`);
    categories.forEach(c => categoryMap.set(c.name, c.id));

    const [occasions] = await db.execute(`SELECT id,name FROM occasions`);
    occasions.forEach(o => occasionMap.set(o.name, o.id));


    /* =========================
       PROCESS GROUPS
    ========================== */

    for (const group of data.groups) {

      let productGroupId;

      const primarySku = group.products[0].sku;

      const [existingGroup] = await db.execute(
        `SELECT product_group_id FROM products WHERE sku=? LIMIT 1`,
        [primarySku]
      );

      if (existingGroup.length) {

        productGroupId = existingGroup[0].product_group_id;

      } else {

        const [res] = await db.execute(
          `INSERT INTO product_groups (brand_id) VALUES (?)`,
          [BRAND_ID]
        );

        productGroupId = res.insertId;

      }


      /* =========================
         PRODUCTS SYNC
      ========================== */

      for (const p of group.products) {

        incomingSkus.add(p.sku);

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
          [
            productGroupId,
            p.title,
            p.url,
            p.stitch_type,
            p.pieces,
            p.design_type,
            p.fabric,
            p.price,
            p.discount_price,
            p.in_stock,
            p.is_new ?? false,
            p.details_html,
            p.sku
          ]
        );

        if (updateResult.affectedRows === 0) {

          await db.execute(
            `INSERT INTO products
             (product_group_id,sku,title,source_url,stitch_type,pieces,
              design_type,fabric,price,discount_price,in_stock,is_new,description)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              productGroupId,
              p.sku,
              p.title,
              p.url,
              p.stitch_type,
              p.pieces,
              p.design_type,
              p.fabric,
              p.price,
              p.discount_price,
              p.in_stock,
              p.is_new ?? false,
              p.details_html
            ]
          );

        }

      }



      /* =========================
         IMAGE SYNC
      ========================== */

      const incomingImages = group.images || [];

      // get all product ids in current group
      const [groupProducts] = await db.execute(
        `SELECT id
         FROM products
         WHERE product_group_id=?`,
        [productGroupId]
      );

      const productIds =
        groupProducts.map(p => p.id);

      // existing linked images for this group
      const [dbImages] = await db.execute(
        `SELECT DISTINCT i.id,i.url
         FROM images i
         JOIN image_product ip
           ON ip.image_id=i.id
         JOIN products p
           ON p.id=ip.product_id
         WHERE p.product_group_id=?`,
        [productGroupId]
      );

      const existingImages =
        dbImages.map(i => i.url);

      /* INSERT NEW */

      for (const img of incomingImages) {

        let imageId;

        // check existing global image
        const [existingImage] = await db.execute(
          `SELECT id
           FROM images
           WHERE url=?
           LIMIT 1`,
          [img]
        );

        if (existingImage.length) {

          imageId = existingImage[0].id;

        } else {

          const [imgRes] = await db.execute(
            `INSERT INTO images (url)
             VALUES (?)`,
            [img]
          );

          imageId = imgRes.insertId;
        }

        // attach same image to all products
        for (const productId of productIds) {

          await db.execute(
            `INSERT IGNORE INTO image_product
             (image_id,product_id)
             VALUES (?,?)`,
            [imageId, productId]
          );

        }

      }

      /* DELETE STALE */

      for (const dbImg of dbImages) {

        if (!incomingImages.includes(dbImg.url)) {

          // remove all relations
          await db.execute(
            `DELETE ip
             FROM image_product ip
             JOIN products p
               ON p.id=ip.product_id
             WHERE ip.image_id=?
             AND p.product_group_id=?`,
            [dbImg.id, productGroupId]
          );

          // cleanup orphan image
          const [stillUsed] = await db.execute(
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



      /* =========================
         RELATION SYNC FUNCTION
      ========================== */

      async function syncRelation({
        junctionTable,
        relationColumn,
        masterTable,
        incomingNames,
        masterMap
      }) {

        const incomingIds = [];

        for (const name of incomingNames) {

          let id = masterMap.get(name);

          if (!id) {

            const [res] = await db.execute(
              `INSERT INTO ${masterTable}
               (name,slug,is_active)
               VALUES(?,?,1)`,
              [name, name.toLowerCase().replace(/\s+/g, '-')]
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

        const existingIds = existing.map(e => e[relationColumn]);


        /* INSERT missing */

        for (const id of incomingIds) {

          if (!existingIds.includes(id)) {

            await db.execute(
              `INSERT INTO ${junctionTable}
               (product_group_id,${relationColumn})
               VALUES(?,?)`,
              [productGroupId, id]
            );

          }

        }


        /* DELETE stale */

        for (const id of existingIds) {

          if (!incomingIds.includes(id)) {

            await db.execute(
              `DELETE FROM ${junctionTable}
               WHERE product_group_id=?
               AND ${relationColumn}=?`,
              [productGroupId, id]
            );

          }

        }

      }



      /* =========================
         SEASONS SYNC
      ========================== */

      if (group.seasons?.length) {

        await syncRelation({
          junctionTable: 'product_group_season',
          relationColumn: 'season_id',
          masterTable: 'seasons',
          incomingNames: group.seasons,
          masterMap: seasonMap
        });

      }



      /* =========================
         CATEGORY SYNC
      ========================== */

      if (group.categories?.length) {

        await syncRelation({
          junctionTable: 'product_group_category',
          relationColumn: 'category_id',
          masterTable: 'categories',
          incomingNames: group.categories,
          masterMap: categoryMap
        });

      }



      /* =========================
         OCCASION SYNC
      ========================== */

      if (group.occasions?.length) {

        await syncRelation({
          junctionTable: 'product_group_occasion',
          relationColumn: 'occasion_id',
          masterTable: 'occasions',
          incomingNames: group.occasions,
          masterMap: occasionMap
        });

      }

    }



    /* =========================
       SOFT DELETE MISSING PRODUCTS
    ========================== */

    const [brandProducts] = await db.execute(
      `SELECT p.id,p.sku
       FROM products p
       JOIN product_groups pg ON pg.id=p.product_group_id
       WHERE pg.brand_id=?`,
      [BRAND_ID]
    );

    for (const prod of brandProducts) {

      if (!incomingSkus.has(prod.sku)) {

        await db.execute(
          `UPDATE products
           SET deleted_at=NOW()
           WHERE id=? AND deleted_at IS NULL`,
          [prod.id]
        );

      }

    }



    await db.commit();

    console.log("✅ FULL SYNC COMPLETE");

  } catch (err) {

    await db.rollback();

    console.error("❌ FAILED — ROLLED BACK");

    throw err;

  } finally {

    await db.end();

  }

})();