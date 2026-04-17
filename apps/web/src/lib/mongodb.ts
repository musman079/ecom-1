import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getDatabaseNameFromUri(uri: string) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "");
    return pathname || "1ecom";
  } catch {
    return "1ecom";
  }
}

const mongoUri = process.env.MONGODB_URL;

if (!mongoUri) {
  throw new Error("MONGODB_URL is not set. Add it in apps/web/.env.");
}

const resolvedMongoUri = mongoUri;

const clientPromise =
  globalThis.mongoClientPromise ??
  new MongoClient(resolvedMongoUri, {
    maxPoolSize: 10,
  }).connect();

if (process.env.NODE_ENV !== "production") {
  globalThis.mongoClientPromise = clientPromise;
}

export async function getMongoDb() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB_NAME ?? getDatabaseNameFromUri(resolvedMongoUri);
  return client.db(dbName);
}
