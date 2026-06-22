import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient, ProductStatus } from "@prisma/client";

const currentDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDir, "../.env");

function loadEnvFile(path) {
  let content;
  try {
    content = readFileSync(path, "utf-8");
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^"|"$/g, "")
      .replace(/^'|'$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function ensureDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in apps/web/.env.");
  }
}

function slugify(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "product";
}

async function createUniqueSlug(prisma, title) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

function toStatus(raw) {
  return String(raw ?? "published").toLowerCase() === "draft" ? ProductStatus.DRAFT : ProductStatus.PUBLISHED;
}

function getPrices(p) {
  let priceInCents = 0;
  let compareAtPriceInCents = null;

  const originalPrice = p.price ? Math.round(parseFloat(p.price) * 100) : 0;
  const discountPrice = p.discount_price ? Math.round(parseFloat(p.discount_price) * 100) : null;

  if (discountPrice && discountPrice < originalPrice) {
    priceInCents = discountPrice;
    compareAtPriceInCents = originalPrice;
  } else {
    priceInCents = originalPrice;
  }

  return { priceInCents, compareAtPriceInCents };
}

async function getOrCreateCategory(prisma, categoryName) {
  const slug = slugify(categoryName);
  const existing = await prisma.category.findUnique({
    where: { slug }
  });
  if (existing) return existing.id;

  const created = await prisma.category.create({
    data: {
      name: categoryName,
      slug
    }
  });
  return created.id;
}

async function processProductGroup(prisma, group, brandName) {
  if (!group.products || group.products.length === 0) return { action: "skipped", reason: "no products" };

  const firstProduct = group.products[0];
  const title = firstProduct.title || "Unnamed Product";
  
  // Base details for the product
  let descriptionHtml = firstProduct.details_html || "";
  
  // Combine all categories
  const allCategories = [...new Set([...(group.categories || []), ...(group.seasons || []), ...(group.occasions || [])])].filter(Boolean);
  
  // Find category IDs
  const categoryIds = [];
  for (const cat of allCategories) {
    const id = await getOrCreateCategory(prisma, cat);
    categoryIds.push(id);
  }

  // Create or update by the FIRST sku
  const primarySku = firstProduct.sku.trim();
  const existingVariant = await prisma.productVariant.findUnique({
    where: { sku: primarySku },
    include: { product: true }
  });

  let productId;
  let action = "inserted";

  if (!existingVariant) {
    // Create new Product
    const slug = await createUniqueSlug(prisma, title);
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description: descriptionHtml,
        collection: brandName,
        images: group.images || [],
        status: ProductStatus.PUBLISHED,
      }
    });
    productId = product.id;
    
    // Connect categories
    for (const catId of categoryIds) {
      await prisma.productCategory.create({
        data: {
          productId,
          categoryId: catId
        }
      });
    }
  } else {
    productId = existingVariant.productId;
    action = "updated";
    
    // Update existing Product
    await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description: descriptionHtml,
        collection: brandName,
        images: group.images || [],
        status: ProductStatus.PUBLISHED,
      }
    });
    
    // Connect new categories (ignoring existing ones to keep simple)
    const existingConnections = await prisma.productCategory.findMany({
      where: { productId }
    });
    const existingCatIds = new Set(existingConnections.map(c => c.categoryId));
    
    for (const catId of categoryIds) {
      if (!existingCatIds.has(catId)) {
        await prisma.productCategory.create({
          data: {
            productId,
            categoryId: catId
          }
        });
      }
    }
  }

  // Upsert all variants
  for (const p of group.products) {
    const sku = p.sku.trim();
    const { priceInCents, compareAtPriceInCents } = getPrices(p);
    const stockQuantity = p.in_stock ? 50 : 0;

    const vExisting = await prisma.productVariant.findUnique({
      where: { sku }
    });

    if (vExisting) {
      await prisma.productVariant.update({
        where: { id: vExisting.id },
        data: {
          title: p.title || title,
          priceInCents,
          compareAtPriceInCents,
          stockQuantity,
          isActive: p.in_stock
        }
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId,
          sku,
          title: p.title || title,
          priceInCents,
          compareAtPriceInCents,
          stockQuantity,
          isActive: p.in_stock
        }
      });
    }
  }

  return { action };
}

async function main() {
  loadEnvFile(envFilePath);
  ensureDatabaseUrl();

  const brand = process.argv[2] || "khaadi";
  const brandName = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  const dataPath = `C:/Users/USMAN/Desktop/Projects/suit_dekho/${brand}/output/normalized.json`;

  console.log(`Starting import for brand: ${brandName} from ${dataPath}`);

  let parsedItems = [];
  try {
    const raw = readFileSync(dataPath, "utf-8");
    const rawParsed = JSON.parse(raw);
    if (rawParsed.groups && Array.isArray(rawParsed.groups)) {
      parsedItems = rawParsed.groups;
    } else {
      parsedItems = Array.isArray(rawParsed) ? rawParsed : Object.values(rawParsed);
    }
  } catch (error) {
    console.error(`Failed to read or parse ${dataPath}:`, error.message);
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log(`Found ${parsedItems.length} product groups.`);

    for (let i = 0; i < parsedItems.length; i++) {
      const group = parsedItems[i];
      try {
        const { action, reason } = await processProductGroup(prisma, group, brandName);
        if (action === "inserted") inserted++;
        else if (action === "updated") updated++;
        else skipped++;
      } catch (err) {
        console.error(`Error processing group ${group.id || i}:`, err.message);
        skipped++;
      }

      if ((i + 1) % 100 === 0) {
        console.log(`Processed ${i + 1} / ${parsedItems.length}...`);
      }
    }

    console.log(`\nImport complete for ${brandName}.`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (or errors): ${skipped}`);

  } catch (error) {
    console.error("Critical error during import:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
