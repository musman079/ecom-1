import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient, ProductStatus } from "@prisma/client";

const currentDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDir, "../.env");
const defaultAdminDataPath = resolve(currentDir, "../data/admin-products.json");
const fallbackDataPath = resolve(currentDir, "../data/real-products.json");

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

function parseProductsFile(path) {
  const raw = readFileSync(path, "utf-8");
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.products)) {
    return parsed.products;
  }

  return [];
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

function toPriceInCents(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  if (Number.isInteger(numeric) && numeric >= 1000) {
    return numeric;
  }

  return Math.round(numeric * 100);
}

function normalizeProduct(input) {
  const title = String(input.title ?? input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const sku = String(input.sku ?? "").trim();
  const stockQuantity = Number(input.stockQuantity ?? input.stock ?? 0);
  const priceInCents = toPriceInCents(input.price);

  if (!title || !description || !sku || !Number.isInteger(stockQuantity) || stockQuantity < 0 || priceInCents === null) {
    return null;
  }

  return {
    title,
    description,
    sku,
    stockQuantity,
    priceInCents,
    taxCategory: String(input.taxCategory ?? "Standard Goods (20%)").trim(),
    collection: String(input.collection ?? input.category ?? "General").trim(),
    lowStockAlert: Boolean(input.lowStockAlert ?? stockQuantity <= 5),
    status: toStatus(input.status),
  };
}

async function upsertBySku(prisma, normalized) {
  const existingVariants = await prisma.productVariant.findMany({
    select: {
      id: true,
      productId: true,
      sku: true,
    },
  });

  const existingVariant = existingVariants.find(
    (variant) => variant.sku.trim().toLowerCase() === normalized.sku.trim().toLowerCase(),
  );

  if (!existingVariant) {
    const slug = await createUniqueSlug(prisma, normalized.title);
    await prisma.product.create({
      data: {
        title: normalized.title,
        slug,
        description: normalized.description,
        taxCategory: normalized.taxCategory,
        collection: normalized.collection,
        lowStockAlert: normalized.lowStockAlert,
        status: normalized.status,
        variants: {
          create: {
            sku: normalized.sku,
            title: normalized.title,
            priceInCents: normalized.priceInCents,
            stockQuantity: normalized.stockQuantity,
            isActive: true,
          },
        },
      },
    });

    return "inserted";
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: existingVariant.productId },
      data: {
        title: normalized.title,
        description: normalized.description,
        taxCategory: normalized.taxCategory,
        collection: normalized.collection,
        lowStockAlert: normalized.lowStockAlert,
        status: normalized.status,
      },
    });

    await tx.productVariant.update({
      where: { id: existingVariant.id },
      data: {
        title: normalized.title,
        priceInCents: normalized.priceInCents,
        stockQuantity: normalized.stockQuantity,
        isActive: true,
      },
    });
  });

  return "updated";
}

loadEnvFile(envFilePath);
ensureDatabaseUrl();

const argPath = process.argv[2] ? resolve(process.cwd(), process.argv[2]) : null;
const candidatePaths = argPath ? [argPath] : [defaultAdminDataPath, fallbackDataPath];

let selectedPath = null;
let parsedItems = [];

for (const path of candidatePaths) {
  try {
    const items = parseProductsFile(path);
    if (items.length > 0) {
      parsedItems = items;
      selectedPath = path;
      break;
    }
  } catch {
    // ignore and continue to next candidate file
  }
}

if (!selectedPath || parsedItems.length === 0) {
  console.log("No products found to import. Checked admin-products.json and real-products.json.");
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of parsedItems) {
    const normalized = normalizeProduct(item);
    if (!normalized) {
      skipped += 1;
      continue;
    }

    const result = await upsertBySku(prisma, normalized);
    if (result === "inserted") {
      inserted += 1;
    } else {
      updated += 1;
    }
  }

  console.log(`Prisma import complete from ${selectedPath}. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
} catch (error) {
  console.error("Failed to import products via Prisma.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
