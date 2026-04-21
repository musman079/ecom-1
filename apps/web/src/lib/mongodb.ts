import { MongoClient } from "mongodb";

import { getMongoDatabaseName, getMongoUrl } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const resolvedMongoUri = getMongoUrl();

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
  return client.db(getMongoDatabaseName());
}
