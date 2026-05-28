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
    throw new Error(`${name} zaroor hona chahiye.`);
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

const mongoUri = required("DATABASE_URL");
const superadminEmail = "superadmin@example.com"; // Default superadmin email
const superadminPassword = "SuperAdmin@123456"; // Default password - zaroor badlna
const superadminFullName = "Super Admin";
const superadminPhone = "+92300000000";

const dbName = (process.env.MONGODB_DB_NAME || getDatabaseNameFromUri(mongoUri)).trim();

console.log("🔐 Superadmin ko database mein insert kar raha hoon...\n");
console.log(`📧 Email: ${superadminEmail}`);
console.log(`🔑 Password: ${superadminPassword}`);
console.log(`👤 Naam: ${superadminFullName}`);
console.log(`📱 Phone: ${superadminPhone}\n`);

const client = new MongoClient(mongoUri, { maxPoolSize: 5 });

try {
  await client.connect();
  console.log("✅ Database se connect ho gya!\n");
  
  const db = client.db(dbName);
  const users = db.collection("User");
  const roles = db.collection("Role");
  const userRoles = db.collection("UserRole");

  const now = new Date();
  const passwordHash = await hash(superadminPassword, 10);

  // Pehle check kro keh user pehle se exist to nahi karta
  let existing = await users.findOne({ email: superadminEmail });

  if (!existing) {
    console.log("🆕 Naya superadmin user create ho raha hai...");
    
    // User create kro
    const userResult = await users.insertOne({
      email: superadminEmail,
      passwordHash,
      fullName: superadminFullName,
      phone: superadminPhone,
      notificationOrderUpdates: true,
      notificationReturnUpdates: true,
      notificationEmailEnabled: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    const userId = userResult.insertedId;
    console.log(`✅ User insert hua: ${userId}\n`);

    // SUPER_ADMIN role check kro ya create kro
    let superAdminRole = await roles.findOne({ name: "SUPER_ADMIN" });
    if (!superAdminRole) {
      const roleResult = await roles.insertOne({
        name: "SUPER_ADMIN",
        createdAt: now,
        updatedAt: now,
      });
      superAdminRole = { _id: roleResult.insertedId, name: "SUPER_ADMIN" };
      console.log(`✅ SUPER_ADMIN role create hua\n`);
    }

    // UserRole connection create kro
    await userRoles.insertOne({
      userId,
      roleId: superAdminRole._id,
      createdAt: now,
      updatedAt: now,
    });

    console.log("✅ UserRole connection create hua\n");
    console.log("═══════════════════════════════════════");
    console.log("🎉 SUPERADMIN SUCCESSFULLY CREATE HO GAYA!");
    console.log("═══════════════════════════════════════");
    console.log(`📧 Email: ${superadminEmail}`);
    console.log(`🔑 Password: ${superadminPassword}`);
    console.log("═══════════════════════════════════════\n");

    process.exit(0);
  }

  // Agar user pehle se hai to SUPER_ADMIN role add kar do
  console.log("👤 User pehle se exist karta hai, SUPER_ADMIN role add kar raha hoon...\n");

  let superAdminRole = await roles.findOne({ name: "SUPER_ADMIN" });
  if (!superAdminRole) {
    const roleResult = await roles.insertOne({
      name: "SUPER_ADMIN",
      createdAt: now,
      updatedAt: now,
    });
    superAdminRole = { _id: roleResult.insertedId, name: "SUPER_ADMIN" };
    console.log(`✅ SUPER_ADMIN role create hua\n`);
  }

  // Check kro keh pehle se UserRole exist to nahi karta
  const existingUserRole = await userRoles.findOne({
    userId: existing._id,
    roleId: superAdminRole._id,
  });

  if (!existingUserRole) {
    await userRoles.insertOne({
      userId: existing._id,
      roleId: superAdminRole._id,
      createdAt: now,
      updatedAt: now,
    });
    console.log("✅ SUPER_ADMIN role assign hua\n");
  }

  // Password update kar do
  await users.updateOne(
    { _id: existing._id },
    {
      $set: {
        passwordHash,
        fullName: superadminFullName,
        phone: superadminPhone,
        isActive: true,
        updatedAt: now,
      },
    },
  );

  console.log("═══════════════════════════════════════");
  console.log("✅ SUPERADMIN UPDATE HO GAYA!");
  console.log("═══════════════════════════════════════");
  console.log(`📧 Email: ${superadminEmail}`);
  console.log(`🔑 Password: ${superadminPassword}`);
  console.log("═══════════════════════════════════════\n");

  process.exit(0);
} catch (error) {
  console.error("❌ Error hua!");
  console.error(error.message);
  process.exit(1);
} finally {
  await client.close();
}
