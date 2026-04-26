import { beforeEach, describe, expect, it, vi } from "vitest";

import { createJsonRequest } from "../../../../src/test-utils/http";

const mocks = vi.hoisted(() => ({
  assertAuthEnvironment: vi.fn(),
  hashPassword: vi.fn(),
  signAuthToken: vi.fn(),
  setAuthCookie: vi.fn(),
  isAdminEmail: vi.fn(),
  sanitizeAuthUser: vi.fn(),
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      upsert: vi.fn(),
    },
  },
}));

vi.mock("../../../../src/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/lib/auth")>("../../../../src/lib/auth");

  return {
    ...actual,
    assertAuthEnvironment: mocks.assertAuthEnvironment,
    hashPassword: mocks.hashPassword,
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

describe("POST /api/auth/register", () => {
  it("returns 400 when required fields are missing", async () => {
    const response = await POST(createJsonRequest("http://localhost/api/auth/register", "POST", { email: "", password: "" }));
    const payload = (await response.json()) as { message: string; success: boolean };

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("email and password are required.");
  });

  it("returns 409 when user already exists", async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({ id: "existing-user" });

    const response = await POST(createJsonRequest("http://localhost/api/auth/register", "POST", { email: "user@example.com", password: "secret123" }));
    const payload = (await response.json()) as { message: string };

    expect(response.status).toBe(409);
    expect(payload.message).toBe("An account with this email already exists.");
  });

  it("returns 201 and sets auth cookie on successful registration", async () => {
    mocks.prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "user-3",
        email: "user@example.com",
        fullName: "User",
        phone: null,
        roles: [{ role: { name: "CUSTOMER" } }],
      });

    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.prisma.role.upsert.mockResolvedValue({ id: "role-customer" });
    mocks.prisma.user.create.mockResolvedValue({ id: "user-3" });
    mocks.signAuthToken.mockResolvedValue("signed-token");
    mocks.sanitizeAuthUser.mockReturnValue({ id: "user-3", role: "CUSTOMER", roles: ["CUSTOMER"] });

    const response = await POST(
      createJsonRequest("http://localhost/api/auth/register", "POST", {
        email: "user@example.com",
        password: "secret123",
        fullName: "User",
      }),
    );

    const payload = (await response.json()) as { success: boolean; user: { role: string } };

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.user.role).toBe("CUSTOMER");
    expect(mocks.signAuthToken).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: "user-3",
        email: "user@example.com",
        role: "CUSTOMER",
        roles: ["CUSTOMER"],
      }),
    );
    expect(mocks.setAuthCookie).toHaveBeenCalledTimes(1);
  });
});