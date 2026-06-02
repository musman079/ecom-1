import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { AUTH_COOKIE_NAME, getAdminEmails, verifyAuthToken } from "./src/lib/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/auth",
  "/product_details",
  "/product_detail_desktop",
  "/privacy_policy",
  "/terms_of_service",
  "/returns_refunds",
  "/reviews",
];

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/profile",
  "/cart_checkout",
  "/cart_checkout_desktop",
  "/order_tracking",
];

// Admin routes that require ADMIN or SUPER_ADMIN role
const ADMIN_ROUTES = [
  "/admin_overview_dashboard",
  "/admin_products",
  "/admin_orders",
  "/admin_returns",
  "/admin_settings",
  "/admin_customers",
  "/admin_analytics",
  "/admin_post_edit_product",
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  "/api/admin",
  "/api/cart",
  "/api/checkout",
  "/api/orders",
  "/api/profile",
  "/api/returns",
  "/api/wishlist",
  "/api/reviews",
  "/api/notifications",
  "/api/coupons",
];

// API routes that require ADMIN role
const ADMIN_API_ROUTES = ["/api/admin"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and public files
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/static")) {
    return NextResponse.next();
  }

  // Check if it's a public route
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Get JWT token (NextAuth or custom cookie fallback)
  const nextAuthToken = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  });
  const customTokenValue = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  const customToken = customTokenValue ? await verifyAuthToken(customTokenValue) : null;
  const token = nextAuthToken ?? customToken;

  // Check if route requires authentication
  const requiresAuth = isProtectedRoute(pathname) || isAdminRoute(pathname) || isProtectedApiRoute(pathname) || isAdminApiRoute(pathname);

  // If no token and requires auth, redirect to login
  if (!token && requiresAuth) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If admin route, check role
  if (isAdminRoute(pathname) || isAdminApiRoute(pathname)) {
    if (!token) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const email = typeof token.email === "string" ? token.email : "";
    const normalizedEmail = email.trim().toLowerCase();
    const tokenRoles = Array.isArray(token.roles)
      ? token.roles
      : typeof token.role === "string"
        ? [token.role]
        : [];
    const isAdmin =
      tokenRoles.includes("ADMIN") ||
      tokenRoles.includes("SUPER_ADMIN") ||
      getAdminEmails().includes(normalizedEmail);

    if (!isAdmin) {
      console.warn(`[PROXY] Unauthorized admin access attempt: ${email} tried to access ${pathname}`);
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  // If protected route but user not authenticated (already handled above)
  if (isProtectedRoute(pathname) && !token) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
