import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Prisma client import
import { PrismaClient } from "@prisma/client";

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

const superadminEmail = "superadmin@example.com";
const superadminPassword = "SuperAdmin@123456";
const superadminFullName = "Super Admin";
const superadminPhone = "+92300000000";

console.log("🔐 Superadmin ko database mein insert kar raha hoon (Prisma ke through)...\n");
console.log(`📧 Email: ${superadminEmail}`);
console.log(`🔑 Password: ${superadminPassword}`);
console.log(`👤 Naam: ${superadminFullName}`);
console.log(`📱 Phone: ${superadminPhone}\n`);

const prisma = new PrismaClient();

try {
  console.log("🔗 Database se connect ho raha hoon...\n");

  // Pehle check kro keh user exist to nahi karta
  let user = await prisma.user.findUnique({
    where: { email: superadminEmail },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  const passwordHash = await hash(superadminPassword, 10);

  if (!user) {
    console.log("🆕 Naya superadmin user create ho raha hai...");

    user = await prisma.user.create({
      data: {
        email: superadminEmail,
        passwordHash,
        fullName: superadminFullName,
        phone: superadminPhone,
        notificationOrderUpdates: true,
        notificationReturnUpdates: true,
        notificationEmailEnabled: true,
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`✅ User create hua: ${user.id}\n`);
  } else {
    console.log("👤 User pehle se exist karta hai, update kar raha hoon...\n");

    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        fullName: superadminFullName,
        phone: superadminPhone,
        isActive: true,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    console.log(`✅ User update hua: ${user.id}\n`);
  }

  // SUPER_ADMIN role upsert kro
  let superAdminRole = await prisma.role.findUnique({
    where: { name: "SUPER_ADMIN" },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: { name: "SUPER_ADMIN" },
    });
    console.log("✅ SUPER_ADMIN role create hua\n");
  }

  // Check kro keh UserRole pehle se exist to nahi karta
  const existingUserRole = await prisma.userRole.findUnique({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    },
  });

  if (!existingUserRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
      },
    });
    console.log("✅ SUPER_ADMIN role assign hua\n");
  } else {
    console.log("✅ SUPER_ADMIN role pehle se assign hai\n");
  }

  console.log("═══════════════════════════════════════════════════");
  console.log("🎉 SUPERADMIN SUCCESSFULLY DATABASE MEIN CREATE/UPDATE HO GAYA!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`📧 Email:    ${superadminEmail}`);
  console.log(`🔑 Password: ${superadminPassword}`);
  console.log(`👤 Role:     SUPER_ADMIN`);
  console.log(`🆔 User ID:  ${user.id}`);
  console.log("═══════════════════════════════════════════════════\n");
  console.log("✅ Ab in credentials se login kar sakte ho!\n");

  process.exit(0);
} catch (error) {
  console.error("❌ Error hua!");
  console.error(error.message);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
