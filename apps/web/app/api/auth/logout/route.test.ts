import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clearAuthCookie: vi.fn(),
}));

vi.mock("../../../../src/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("../../../../src/lib/auth")>("../../../../src/lib/auth");

  return {
    ...actual,
    clearAuthCookie: mocks.clearAuthCookie,
  };
});

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/logout", () => {
  it("returns success response and clears cookie", async () => {
    const response = await POST();
    const payload = (await response.json()) as { success: boolean; message: string };

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.message).toBe("Logged out successfully.");
    expect(mocks.clearAuthCookie).toHaveBeenCalledTimes(1);
  });
});