#!/usr/bin/env node

/**
 * Quick diagnostic to check product fetching issues
 */

import { PrismaClient } from "@prisma/client";

async function loadEnv() {
  const path = "../.env";
  try {
    const fs = await import("fs");
    const content = fs.readFileSync(path, "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue;
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim();
      if (!process.env[key?.trim()]) {
        process.env[key?.trim()] = value.replace(/^["']|["']scripts/diagnose-products.mjs/g, "");
      }
    }
  } catch (e) {
    console.warn("No .env file found");
  }
}

await loadEnv();

console.log("🔍 Diagnostic Check Started\n");
console.log("1. DATABASE_URL:", process.env.DATABASE_URL ? "✅ SET" : "⚠️ WARNING: Not set!");

const prisma = new PrismaClient();

try {
  console.log("\n2. Checking database connection...");
  await prisma.scripts/diagnose-products.mjsqueryRawSELECT 1;
  console.log("✅ Database connected!");

  console.log("\n3. Checking if products exist...");
  const count = await prisma.product.count();
  console.log(✅ Found  products);

  if (count === 0) {
    console.log("\n❌ WARNING: Database is empty!");
    console.log("To import products, run:");
    console.log("  pnpm run import:admin-products");
  } else {
    console.log("\n4. Fetching first product...");
    const product = await prisma.product.findFirst({
      include: { variants: true },
    });
    console.log("✅ Sample product:", product?.title);
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
} finally {
  await prisma.scripts/diagnose-products.mjsdisconnect();
}
