import { NextResponse } from "next/server";

import { assertAuthEnvironment, AuthConfigError } from "../../../../src/lib/auth";
import { getCurrentUserFromRequest } from "../../../../src/lib/get-current-user";

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

export async function GET(_: Request) {
  try {
    assertAuthEnvironment();
  } catch (error) {
    const message = error instanceof AuthConfigError ? error.message : "Authentication environment is not configured.";
    return errorResponse(message, 500);
  }

  try {
    const user = await getCurrentUserFromRequest(_);
    if (!user) {
      return errorResponse("Unauthorized.", 401);
    }

    return NextResponse.json({
      success: true,
      message: "Current user retrieved.",
      user,
    });
  } catch (error) {
    console.error("Auth me API failed", error);
    return errorResponse("Failed to fetch current user.", 500);
  }
}
