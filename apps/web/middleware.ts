import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { getAdminEmails } from "./src/lib/auth";

function unauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const loginUrl = new URL("/auth", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function forbiddenResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  return NextResponse.redirect(new URL("/", request.url));
}

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });

  if (!token || typeof token.email !== "string") {
    return unauthorizedResponse(request);
  }

  const normalizedEmail = token.email.trim().toLowerCase();
  const tokenRoles = Array.isArray(token.roles)
    ? token.roles.filter((value) => typeof value === "string")
    : typeof token.role === "string"
      ? [token.role]
      : [];
  const adminByRole = tokenRoles.includes("ADMIN") || tokenRoles.includes("SUPER_ADMIN");
  const adminByEmail = getAdminEmails().includes(normalizedEmail);

  if (!adminByRole && !adminByEmail) {
    return forbiddenResponse(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin_overview_dashboard/:path*",
    "/admin_products/:path*",
    "/admin_orders/:path*",
    "/admin_returns/:path*",
    "/admin_post_edit_product/:path*",
    "/api/admin/:path*",
  ],
};
