import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
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
    if (!line || line.startsWith("#")) continue;
    const sep = line.indexOf("=");
    if (sep < 1) continue;
    const key = line.slice(0, sep).trim();
    const value = line.slice(sep + 1).trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(envFilePath);

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_USER_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_USER_PASSWORD || "Admin@123456";
  const fullName = process.env.ADMIN_USER_FULL_NAME || "Admin User";
  const phone = process.env.ADMIN_USER_PHONE || "+0000000000";

  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  console.log(`Creating/updating admin: ${email}`);

  const passwordHash = await hash(password, 10);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        isActive: true,
      },
    });
    console.log(`User created: ${user.id}`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, fullName, phone, isActive: true },
    });
    console.log(`User updated: ${user.id}`);
  }

  // ensure SUPER_ADMIN role exists
  let role = await prisma.role.findUnique({ where: { name: "SUPER_ADMIN" } });
  if (!role) {
    role = await prisma.role.create({ data: { name: "SUPER_ADMIN" } });
    console.log("Created role SUPER_ADMIN");
  }

  const existing = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
  });
  if (!existing) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    console.log("Assigned SUPER_ADMIN role to user");
  } else {
    console.log("User already has SUPER_ADMIN role");
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
