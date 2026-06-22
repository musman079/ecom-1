import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

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
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFile(envFilePath);
  const prisma = new PrismaClient();

  try {
    console.log("--- DIAGNOSTICS ---");
    
    const totalProducts = await prisma.product.count();
    const totalVariants = await prisma.productVariant.count();
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Total Variants: ${totalVariants}`);
    
    console.log("\nProducts by Brand/Collection:");
    const byCollection = await prisma.product.groupBy({
      by: ['collection'],
      _count: {
        id: true,
      },
    });
    console.table(byCollection.map(c => ({ Brand: c.collection || 'None', Count: c._count.id })));

    console.log("\nSample Khaadi Products:");
    const sample = await prisma.product.findMany({
      where: { collection: "Khaadi" },
      take: 3,
      include: {
        variants: true,
        categories: { include: { category: true } }
      }
    });

    for (const p of sample) {
      console.log(`- [${p.id}] ${p.title} (${p.variants.length} variants, ${p.categories.length} categories)`);
      console.log(`  Images: ${p.images.length}`);
      for (const v of p.variants) {
        console.log(`    Variant SKU: ${v.sku} | Price: ${v.priceInCents} | Compare At: ${v.compareAtPriceInCents} | Stock: ${v.stockQuantity}`);
      }
      if (p.categories.length > 0) {
        console.log(`    Categories: ${p.categories.map(c => c.category.name).join(", ")}`);
      }
    }

  } catch (error) {
    console.error("Diagnostics failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
