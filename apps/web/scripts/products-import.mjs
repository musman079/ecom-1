import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { MongoClient } from "mongodb";

const currentDir = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDir, "../.env");
const dataFilePath = resolve(currentDir, "../data/real-products.json");

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
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function required(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`${name} is required.`);
  }
  return value.trim();
}

function getDatabaseNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "");
    return pathname || "1ecom";
  } catch {
    return "1ecom";
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

function normalizeProduct(input) {
  const title = String(input.title ?? input.name ?? "").trim();
  const description = String(input.description ?? "").trim();
  const sku = String(input.sku ?? "").trim();
  const price = Number(input.price ?? 0);
  const stockQuantity = Number(input.stockQuantity ?? input.stock ?? 0);

  if (!title || !description || !sku || !Number.isFinite(price) || price < 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
    return null;
  }

  const rawStatus = String(input.status ?? "published").toLowerCase();
  const status = rawStatus === "draft" ? "draft" : "published";

  return {
    title,
    description,
    price,
    taxCategory: String(input.taxCategory ?? "Standard Goods (20%)").trim(),
    collection: String(input.collection ?? input.category ?? "General").trim(),
    sku,
    stockQuantity,
    lowStockAlert: Boolean(input.lowStockAlert ?? false),
    status,
  };
}

loadEnvFile(envFilePath);

const mongoUri = required("MONGODB_URL");
const dbName = (process.env.MONGODB_DB_NAME || getDatabaseNameFromUri(mongoUri)).trim();

const client = new MongoClient(mongoUri, { maxPoolSize: 5 });

try {
  const items = parseProductsFile(dataFilePath);
  if (items.length === 0) {
    console.log("No products found in data/real-products.json");
    process.exit(0);
  }

  await client.connect();
  const db = client.db(dbName);
  const products = db.collection("products");

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const product = normalizeProduct(item);
    if (!product) {
      skipped += 1;
      continue;
    }

    const now = new Date();
    const existing = await products.findOne({ sku: { $regex: new RegExp(`^${product.sku}$`, "i") } });

    if (!existing) {
      await products.insertOne({
        ...product,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
      continue;
    }

    await products.updateOne(
      { _id: existing._id },
      {
        $set: {
          ...product,
          updatedAt: now,
        },
      },
    );
    updated += 1;
  }

  console.log(`Products import complete. Inserted: ${inserted}, Updated: ${updated}, Skipped: ${skipped}`);
  process.exit(0);
} catch (error) {
  console.error("Failed to import products.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
} finally {
  await client.close();
}
