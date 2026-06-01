import dns from "node:dns";
import { MongoClient } from "mongodb";

import { getMongoDatabaseName, getMongoUrl } from "./env";

// Ensure DNS servers are set early so the MongoDB driver's SRV lookups succeed
// in development environments where the system DNS may block SRV queries.
try {
  const envServers = process.env.MONGODB_DNS_SERVERS;
  if (envServers) {
    const servers = envServers.split(",").map((s) => s.trim()).filter(Boolean);
    if (servers.length > 0) {
      dns.setServers(servers);
      console.warn("[mongodb] Using MONGODB_DNS_SERVERS:", servers);
    }
  } else if (process.env.NODE_ENV !== "production") {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    console.warn("[mongodb] Overriding DNS servers for dev (8.8.8.8,1.1.1.1)");
  }
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : e;
  console.warn("[mongodb] Failed to set DNS servers", message);
}

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise() {
  if (globalThis.mongoClientPromise) {
    return globalThis.mongoClientPromise;
  }

  // Attempt to connect; if SRV DNS query is refused, retry once after
  // forcing public DNS servers. This handles intermittent dev environments
  // where SRV lookups may fail initially.
  const clientPromise = (async () => {
    try {
      return await new MongoClient(getMongoUrl(), { maxPoolSize: 10 }).connect();
    } catch (err: unknown) {
      try {
        // Only handle SRV query failures — rethrow other errors.
        // Node dns reports this as syscall === 'querySrv' and code === 'ECONNREFUSED'.
        const mongoErr = err as NodeJS.ErrnoException;
        if (mongoErr && (mongoErr.syscall === "querySrv" || mongoErr.code === "ENOTFOUND" || mongoErr.code === "ECONNREFUSED")) {
          try {
            dns.setServers(["8.8.8.8", "1.1.1.1"]);
            console.warn("[mongodb] Retry: forcing public DNS servers and reconnecting");
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : e;
            console.warn("[mongodb] Failed to set DNS servers for retry", message);
          }

          return await new MongoClient(getMongoUrl(), { maxPoolSize: 10 }).connect();
        }
      } catch {
        // If retry failed, surface original error below.
      }

      throw err;
    }
  })();

  if (process.env.NODE_ENV !== "production") {
    globalThis.mongoClientPromise = clientPromise;
  }

  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClientPromise();
  return client.db(getMongoDatabaseName());
}
