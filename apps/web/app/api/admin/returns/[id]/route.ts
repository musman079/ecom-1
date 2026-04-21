import { NextResponse } from "next/server";

import { requireAdminSession } from "../../../../../src/lib/admin-auth";
import { AuthError } from "../../../../../src/lib/auth-session";
import { updateReturnRequestByAdmin } from "../../../../../src/lib/ecommerce-db";

type RequestPayload = {
  status?: "requested" | "approved" | "in_transit" | "refunded" | "rejected";
  adminNote?: string;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  let payload: RequestPayload;
  try {
    payload = (await request.json()) as RequestPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { id } = await context.params;
  const requestRow = await updateReturnRequestByAdmin({
    returnId: id,
    status: payload.status,
    adminNote: payload.adminNote,
  });

  if (!requestRow) {
    return NextResponse.json({ error: "Return request not found." }, { status: 404 });
  }

  return NextResponse.json({ returnRequest: requestRow });
}
