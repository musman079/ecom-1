import { NextResponse } from "next/server";

import { requireSuperAdminSession } from "../../../../../src/lib/admin-auth";
import { AuthError } from "../../../../../src/lib/auth-session";
import { prisma } from "../../../../../src/lib/prisma";
import { Prisma } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdatePayload = {
  isActive?: boolean;
};

function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    const status = error.message === "Forbidden" ? 403 : 401;
    return NextResponse.json({ error: error.message }, { status });
  }

  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireSuperAdminSession(request);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  const { id } = await context.params;

  let payload: UpdatePayload;

  try {
    payload = (await request.json()) as UpdatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof payload.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: payload.isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      customer: {
        ...updatedUser,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    console.error("Failed to update customer status:", error);
    return NextResponse.json({ error: "Failed to update customer status." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    await requireSuperAdminSession(request);
  } catch (error) {
    const response = authErrorResponse(error);
    if (response) return response;
    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  const { id } = await context.params;

  try {
    const deletedUser = await prisma.user.delete({
      where: { id },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ customer: deletedUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    console.error("Failed to delete customer:", error);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}