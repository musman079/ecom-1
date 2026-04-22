import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, getAdminEmails, verifyAuthToken } from "./src/lib/auth";

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
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return unauthorizedResponse(request);
  }

  const payload = await verifyAuthToken(token);
  if (!payload) {
    return unauthorizedResponse(request);
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const adminByRole = payload.role === "ADMIN" || payload.role === "SUPER_ADMIN";
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
