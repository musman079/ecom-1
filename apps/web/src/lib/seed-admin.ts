import { hash } from "bcryptjs";

import { prisma } from "./prisma";

export async function ensureAdminSeeded() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@kinetic.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const fullName = process.env.SEED_ADMIN_NAME ?? "Kinetic Super Admin";

  const [customerRole, adminRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: "CUSTOMER" },
      update: {},
      create: { name: "CUSTOMER" },
    }),
    prisma.role.upsert({
      where: { name: "SUPER_ADMIN" },
      update: {},
      create: { name: "SUPER_ADMIN" },
    }),
  ]);

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: await hash(password, 12),
        isActive: true,
      },
    });
  }

  await Promise.all([
    prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: customerRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: customerRole.id,
      },
    }),
    prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    }),
  ]);

  return { email, password };
}
