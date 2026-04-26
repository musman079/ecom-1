import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRequest } from "../../../../src/test-utils/http";

const mocks = vi.hoisted(() => ({
  assertAuthEnvironment: vi.fn(),
  getCurrentUserFromRequest: vi.fn(),
}));

vi.mock("../../../../src/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/lib/auth")>("../../../../src/lib/auth");

  return {
    ...actual,
    assertAuthEnvironment: mocks.assertAuthEnvironment,
  };
});

vi.mock("../../../../src/lib/get-current-user", () => ({
  getCurrentUserFromRequest: mocks.getCurrentUserFromRequest,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("returns 401 when current user is missing", async () => {
    mocks.getCurrentUserFromRequest.mockResolvedValue(null);

    const response = await GET(createRequest("http://localhost/api/auth/me", "GET"));
    const payload = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(401);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Unauthorized.");
  });

  it("returns 200 with user payload when session is valid", async () => {
    mocks.getCurrentUserFromRequest.mockResolvedValue({
      id: "user-10",
      email: "user@example.com",
      fullName: "User",
      phone: "",
      role: "CUSTOMER",
      roles: ["CUSTOMER"],
    });

    const response = await GET(createRequest("http://localhost/api/auth/me", "GET"));
    const payload = (await response.json()) as { success: boolean; user: { id: string } };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.user.id).toBe("user-10");
  });

  it("returns 500 when environment assertion fails", async () => {
    mocks.assertAuthEnvironment.mockImplementation(() => {
      throw new Error("bad env");
    });

    const response = await GET(createRequest("http://localhost/api/auth/me", "GET"));
    const payload = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(500);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe("Authentication environment is not configured.");
  });
});