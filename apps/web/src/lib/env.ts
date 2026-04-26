export class EnvConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvConfigError";
  }
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

function requireEnv(name: string) {
  const value = readEnv(name);
  if (!value) {
    throw new EnvConfigError(`${name} is not configured. Add it to apps/web/.env.`);
  }
  return value;
}

export function getMongoUrl() {
  const mongodbUrl = readEnv("MONGODB_URL");
  const databaseUrl = readEnv("DATABASE_URL");
  const resolved = mongodbUrl ?? databaseUrl;

  if (!resolved) {
    throw new EnvConfigError("MONGODB_URL or DATABASE_URL is required. Configure one MongoDB connection string.");
  }

  return resolved;
}

export function getMongoDatabaseName() {
  const explicitDbName = readEnv("MONGODB_DB_NAME");
  if (explicitDbName) {
    return explicitDbName;
  }

  try {
    const parsed = new URL(getMongoUrl());
    const pathname = parsed.pathname.replace(/^\//, "");
    return pathname || "1ecom";
  } catch {
    return "1ecom";
  }
}

export function assertRuntimeEnvironment() {
  requireEnv("JWT_SECRET");
  requireEnv("JWT_EXPIRY");
}
