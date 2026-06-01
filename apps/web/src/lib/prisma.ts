import { PrismaClient } from "@prisma/client";
import dns from "node:dns";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }

  // Prisma expects DATABASE_URL; reuse MONGODB_URL when only that is configured.
  // Important: this must NOT run at module evaluation time during Next builds.
  // Development helper: some environments block Node's DNS SRV lookups (used by
  // MongoDB+SRV URLs). In development we optionally override DNS servers so
  // `dns.resolveSrv` used by the driver succeeds. Set `MONGODB_DNS_SERVERS`
  // env var (comma-separated) to control servers, otherwise use public DNS
  // resolvers in non-production.
  try {
    const envServers = process.env.MONGODB_DNS_SERVERS;
    if (envServers) {
      const servers = envServers.split(",").map((s) => s.trim()).filter(Boolean);
      if (servers.length > 0) {
        dns.setServers(servers);
        console.warn("[prisma] Using MONGODB_DNS_SERVERS:", servers);
      }
    } else if (process.env.NODE_ENV !== "production") {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
      console.warn("[prisma] Overriding DNS servers for dev (8.8.8.8,1.1.1.1)");
    }
  } catch (e: unknown) {
    // Non-fatal — continue and let the normal resolver run.
    const message = e instanceof Error ? e.message : e;
    console.warn("[prisma] Failed to set DNS servers", message);
  }
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
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
