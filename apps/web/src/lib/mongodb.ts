import { MongoClient } from "mongodb";

import { getMongoDatabaseName, getMongoUrl } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

function getMongoClientPromise() {
  if (globalThis.mongoClientPromise) {
    return globalThis.mongoClientPromise;
  }

  const clientPromise = new MongoClient(getMongoUrl(), {
    maxPoolSize: 10,
  }).connect();

  if (process.env.NODE_ENV !== "production") {
    globalThis.mongoClientPromise = clientPromise;
  }

  return clientPromise;
}

export async function getMongoDb() {
  const client = await getMongoClientPromise();
  return client.db(getMongoDatabaseName());
}
