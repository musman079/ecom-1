import { afterEach, describe, expect, it } from "vitest";

import { EnvConfigError, assertRuntimeEnvironment, getMongoDatabaseName } from "./env";

const snapshot = {
  MONGODB_URL: process.env.MONGODB_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY,
};

afterEach(() => {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("env helpers", () => {
  it("prefers an explicit Mongo database name", () => {
    process.env.MONGODB_DB_NAME = "catalog-db";
    expect(getMongoDatabaseName()).toBe("catalog-db");
  });

  it("derives the database name from the connection string path", () => {
    delete process.env.MONGODB_DB_NAME;
    process.env.DATABASE_URL = "mongodb://localhost:27017/ecom-test";
    delete process.env.MONGODB_URL;

    expect(getMongoDatabaseName()).toBe("ecom-test");
  });

  it("falls back to the default database name when the URI has no path", () => {
    delete process.env.MONGODB_DB_NAME;
    process.env.MONGODB_URL = "mongodb://localhost:27017";
    delete process.env.DATABASE_URL;

    expect(getMongoDatabaseName()).toBe("1ecom");
  });

  it("only requires JWT runtime settings for auth bootstrap", () => {
    delete process.env.MONGODB_URL;
    delete process.env.DATABASE_URL;
    delete process.env.MONGODB_DB_NAME;
    process.env.JWT_SECRET = "test-secret";
    process.env.JWT_EXPIRY = "1h";

    expect(() => assertRuntimeEnvironment()).not.toThrow();
  });

  it("throws a typed error when JWT config is missing", () => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRY;

    expect(() => assertRuntimeEnvironment()).toThrow(EnvConfigError);
  });
});