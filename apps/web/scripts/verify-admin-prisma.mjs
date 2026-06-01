import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
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
  console.log(`Looking up user: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
  if (!user) {
    console.log("User not found");
    process.exit(1);
  }
  console.log("User found:");
  console.log(`- id: ${user.id}`);
  console.log(`- email: ${user.email}`);
  console.log(`- isActive: ${user.isActive}`);
  console.log(`- passwordHash present: ${!!user.passwordHash}`);
  const roleNames = (user.roles || []).map((r) => r.role?.name).filter(Boolean);
  console.log(`- roles: ${roleNames.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
