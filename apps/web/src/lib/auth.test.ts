import { afterEach, describe, expect, it } from "vitest";

import {
  AUTH_COOKIE_NAME,
  getAdminEmails,
  isAdminEmail,
  normalizeEmail,
  readAuthTokenFromCookieHeader,
  validateEmailFormat,
  validatePasswordStrength,
} from "./auth";

const originalAdminEmails = process.env.ADMIN_EMAILS;

afterEach(() => {
  if (originalAdminEmails === undefined) {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = originalAdminEmails;
  }
});

describe("auth helpers", () => {
  it("normalizes email addresses consistently", () => {
    expect(normalizeEmail("  USER@Example.COM  ")).toBe("user@example.com");
  });

  it("validates basic email and password rules", () => {
    expect(validateEmailFormat("customer@example.com")).toBe(true);
    expect(validateEmailFormat("invalid-email")).toBe(false);
    expect(validatePasswordStrength("1234567")).toBe(false);
    expect(validatePasswordStrength("12345678")).toBe(true);
  });

  it("parses admin emails and respects normalized matching", () => {
    process.env.ADMIN_EMAILS = "Admin@One.com, second@example.com  ";

    expect(getAdminEmails()).toEqual(["admin@one.com", "second@example.com"]);
    expect(isAdminEmail("admin@ONE.com")).toBe(true);
    expect(isAdminEmail("customer@example.com")).toBe(false);
  });

  it("reads auth cookies from the cookie header", () => {
    expect(readAuthTokenFromCookieHeader(`foo=bar; ${AUTH_COOKIE_NAME}=token-value%2B123; theme=light`)).toBe(
      "token-value+123",
    );
    expect(readAuthTokenFromCookieHeader("foo=bar")).toBeNull();
  });
});