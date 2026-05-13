import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  // Prisma expects DATABASE_URL; reuse MONGODB_URL when only that is configured.
  // Important: this must NOT run at module evaluation time during Next builds.
  const resolvedDatabaseUrl = process.env.DATABASE_URL ?? process.env.MONGODB_URL;
  if (!process.env.DATABASE_URL && resolvedDatabaseUrl) {
    process.env.DATABASE_URL = resolvedDatabaseUrl;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("Prisma requires DATABASE_URL (or MONGODB_URL as a fallback).");
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = client;
  }

  return client;
}

// Lazy Prisma proxy:
// - Avoids PrismaClient instantiation during module evaluation (Next build).
// - Still fails fast when an endpoint actually tries to query the DB.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then") return undefined; // avoid treating prisma as a Promise/thenable
    const client = getPrismaClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
