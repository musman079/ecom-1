import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJsonRequest } from "../../../../src/test-utils/http";

const mocks = vi.hoisted(() => ({
  assertAuthEnvironment: vi.fn(),
  verifyPassword: vi.fn(),
  signAuthToken: vi.fn(),
  setAuthCookie: vi.fn(),
  isAdminEmail: vi.fn(),
  sanitizeAuthUser: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    role: {
      upsert: vi.fn(),
    },
    userRole: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("../../../../src/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/lib/auth")>("../../../../src/lib/auth");

  return {
    ...actual,
    assertAuthEnvironment: mocks.assertAuthEnvironment,
    verifyPassword: mocks.verifyPassword,
    signAuthToken: mocks.signAuthToken,
    setAuthCookie: mocks.setAuthCookie,
    isAdminEmail: mocks.isAdminEmail,
  };
});

vi.mock("../../../../src/lib/get-current-user", () => ({
  sanitizeAuthUser: mocks.sanitizeAuthUser,
}));

vi.mock("../../../../src/lib/prisma", () => ({
  prisma: mocks.prisma,
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();

  mocks.setAuthCookie.mockImplementation((response: unknown) => response);
  mocks.isAdminEmail.mockReturnValue(false);
});

describe("POST /api/auth/login", () => {
  it("returns 400 when JSON body is invalid", async () => {
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    const response = await POST(request);
    const payload = (await response.json()) as { message: string; success: boolean };

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Invalid JSON body.");
  });

  it("returns 401 for invalid credentials", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue(null);

    const response = await POST(createJsonRequest("http://localhost/api/auth/login", "POST", { email: "user@example.com", password: "secret123" }));
    const payload = (await response.json()) as { message: string; success: boolean };

    expect(response.status).toBe(401);
    expect(payload.message).toBe("Invalid credentials.");
  });

  it("returns 200 and sets auth cookie on success", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      passwordHash: "hashed",
      fullName: "Admin User",
      phone: "",
      isActive: true,
      roles: [{ role: { name: "ADMIN" } }],
    });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.signAuthToken.mockResolvedValue("signed-token");
    mocks.sanitizeAuthUser.mockReturnValue({
      id: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      roles: ["ADMIN"],
    });

    const response = await POST(createJsonRequest("http://localhost/api/auth/login", "POST", { email: "admin@example.com", password: "secret123" }));
    const payload = (await response.json()) as { success: boolean; user: { role: string } };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.user.role).toBe("ADMIN");

    expect(mocks.signAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "user-1",
        email: "admin@example.com",
        role: "ADMIN",
        roles: ["ADMIN"],
      }),
    );
    expect(mocks.setAuthCookie).toHaveBeenCalledTimes(1);
  });

  it("assigns CUSTOMER role when user has no roles", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: "user-2",
      email: "shopper@example.com",
      passwordHash: "hashed",
      fullName: "Shopper",
      phone: null,
      isActive: true,
      roles: [],
    });
    mocks.prisma.role.upsert.mockResolvedValue({ id: "role-customer" });
    mocks.prisma.userRole.upsert.mockResolvedValue({ id: "user-role-customer" });
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.signAuthToken.mockResolvedValue("signed-token");
    mocks.sanitizeAuthUser.mockReturnValue({ id: "user-2", role: "CUSTOMER", roles: ["CUSTOMER"] });

    const response = await POST(createJsonRequest("http://localhost/api/auth/login", "POST", { email: "shopper@example.com", password: "secret123" }));

    expect(response.status).toBe(200);
    expect(mocks.prisma.role.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.prisma.userRole.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.signAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "CUSTOMER",
        roles: ["CUSTOMER"],
      }),
    );
  });
});