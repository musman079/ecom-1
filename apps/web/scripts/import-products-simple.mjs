#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      if (!line.trim() || line.startsWith("#")) continue;
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (!process.env[key?.trim()]) {
        process.env[key?.trim()] = value;
      }
    }
  } catch {
    console.error("❌ .env file not found");
    process.exit(1);
  }
}

await loadEnv();

const prisma = new PrismaClient();

async function importProducts() {
  try {
    console.log("📦 Starting product import...\n");

    // Read products from real-products.json
    const productsPath = path.join(__dirname, "../data/real-products.json");
    const productsData = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

    if (!productsData.products || productsData.products.length === 0) {
      console.log("❌ No products found in real-products.json");
      process.exit(1);
    }

    console.log(`Found ${productsData.products.length} products to import\n`);

    // Clear existing products
    await prisma.product.deleteMany({});
    console.log("✅ Cleared existing products\n");

    let importedCount = 0;

    for (const productData of productsData.products) {
      try {
        // Create or get category
        const category = await prisma.category.upsert({
          where: { slug: (productData.category || "uncategorized").toLowerCase() },
          update: {},
          create: {
            name: productData.category || "Uncategorized",
            slug: (productData.category || "uncategorized").toLowerCase(),
          },
        });

        // Create product
        const product = await prisma.product.create({
          data: {
            title: productData.title,
            slug: productData.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, ""),
            description: productData.description || "",
            collection: productData.collection,
            status: "PUBLISHED", // Set status to PUBLISHED
            images: productData.images || [],
            lowStockAlert: productData.lowStockAlert || false,
            categories: {
              create: {
                category: {
                  connect: { id: category.id },
                },
              },
            },
          },
        });

        // Create variant
        const priceInCents = Math.round(productData.price);
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: productData.sku,
            title: productData.title,
            priceInCents: priceInCents,
            compareAtPriceInCents: null,
            stockQuantity: productData.stock || 0,
            isActive: true,
            color: null,
            size: null,
          },
        });

        console.log(`✅ Imported: ${productData.title}`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Error importing ${productData.title}:`, error.message);
      }
    }

    console.log(`\n🎉 Successfully imported ${importedCount} products!`);

    // Verify
    const count = await prisma.product.count();
    const publishedCount = await prisma.product.count({
      where: { status: "PUBLISHED" },
    });

    console.log(`\n📊 Database stats:`);
    console.log(`   Total products: ${count}`);
    console.log(`   Published products: ${publishedCount}`);

    const sampleProduct = await prisma.product.findFirst({
      include: { variants: true, categories: { include: { category: true } } },
    });

    if (sampleProduct) {
      console.log(`\n📦 Sample product:`);
      console.log(`   Title: ${sampleProduct.title}`);
      console.log(`   Status: ${sampleProduct.status}`);
      console.log(`   Variants: ${sampleProduct.variants.length}`);
    }
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
