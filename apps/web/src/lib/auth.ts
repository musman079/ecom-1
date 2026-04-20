import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextResponse } from "next/server";

export type AuthRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: AuthRole;
};

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthConfigError";
  }
}

export const AUTH_COOKIE_NAME = "ecom_auth";
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 10;

function requireEnv(name: "DATABASE_URL" | "JWT_SECRET" | "JWT_EXPIRY") {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AuthConfigError(`${name} is not configured. Add it to apps/web/.env.local`);
  }
  return value;
}

export function assertAuthEnvironment() {
  requireEnv("DATABASE_URL");
  requireEnv("JWT_SECRET");
  requireEnv("JWT_EXPIRY");
}

function getJwtSecretKey() {
  const jwtSecret = requireEnv("JWT_SECRET");
  return new TextEncoder().encode(jwtSecret);
}

function getJwtExpiry() {
  return requireEnv("JWT_EXPIRY");
}

export function validateEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validatePasswordStrength(password: string) {
  return password.length >= MIN_PASSWORD_LENGTH;
}

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

export async function signAuthToken(payload: AuthTokenPayload): Promise<string> {
  const secretKey = getJwtSecretKey();
  const expiry = getJwtExpiry();

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secretKey);
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());

    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }

    if (payload.role !== "CUSTOMER" && payload.role !== "ADMIN" && payload.role !== "SUPER_ADMIN") {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function readAuthTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");
  for (const cookieChunk of cookies) {
    const [rawName, ...rawValueParts] = cookieChunk.trim().split("=");
    if (rawName !== AUTH_COOKIE_NAME) {
      continue;
    }

    const rawValue = rawValueParts.join("=");
    return decodeURIComponent(rawValue);
  }

  return null;
}

export function readAuthTokenFromRequest(request: Request): string | null {
  return readAuthTokenFromCookieHeader(request.headers.get("cookie"));
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
