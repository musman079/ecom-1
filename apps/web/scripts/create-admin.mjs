import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

const { hash } = bcrypt;

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

loadEnvFile(envFilePath);

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

const mongoUri = required("MONGODB_URL");
const adminEmail = required("ADMIN_USER_EMAIL").toLowerCase();
const adminPassword = required("ADMIN_USER_PASSWORD");
const adminFullName = (process.env.ADMIN_USER_FULL_NAME || "Admin User").trim();
const adminPhone = (process.env.ADMIN_USER_PHONE || "").trim() || undefined;
const dbName = (process.env.MONGODB_DB_NAME || getDatabaseNameFromUri(mongoUri)).trim();

if (adminPassword.length < 8) {
  throw new Error("ADMIN_USER_PASSWORD must be at least 8 characters.");
}

const client = new MongoClient(mongoUri, { maxPoolSize: 5 });

try {
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection("users");

  const now = new Date();
  const passwordHash = await hash(adminPassword, 10);

  const existing = await users.findOne({ email: adminEmail });

  if (!existing) {
    const result = await users.insertOne({
      email: adminEmail,
      passwordHash,
      fullName: adminFullName,
      phone: adminPhone,
      roles: ["CUSTOMER", "ADMIN"],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`Admin user created: ${adminEmail}`);
    console.log(`Inserted id: ${result.insertedId.toString()}`);
    process.exit(0);
  }

  const existingRoles = Array.isArray(existing.roles) ? existing.roles : [];
  const mergedRoles = Array.from(new Set([...existingRoles, "ADMIN", "CUSTOMER"]));

  await users.updateOne(
    { _id: existing._id },
    {
      $set: {
        passwordHash,
        fullName: adminFullName,
        phone: adminPhone,
        roles: mergedRoles,
        isActive: true,
        updatedAt: now,
      },
    },
  );

  console.log(`Existing user promoted/updated as admin: ${adminEmail}`);
  process.exit(0);
} catch (error) {
  console.error("Failed to create admin user.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
} finally {
  await client.close();
}
