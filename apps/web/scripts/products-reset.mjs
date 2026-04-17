import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { MongoClient } from "mongodb";

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

loadEnvFile(envFilePath);

const mongoUri = required("MONGODB_URL");
const dbName = (process.env.MONGODB_DB_NAME || getDatabaseNameFromUri(mongoUri)).trim();

const client = new MongoClient(mongoUri, { maxPoolSize: 5 });

try {
  await client.connect();
  const db = client.db(dbName);
  const products = db.collection("products");

  const result = await products.deleteMany({});
  console.log(`Products removed: ${result.deletedCount}`);
  process.exit(0);
} catch (error) {
  console.error("Failed to reset products.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
} finally {
  await client.close();
}
