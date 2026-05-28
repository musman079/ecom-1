import { CUSTOMER_ROUTES } from "../constants/routes";

const AUTH_BLOCKLIST = [CUSTOMER_ROUTES.AUTH, "/api"] as const;

export function getSafeNextPath(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (AUTH_BLOCKLIST.some((blocked) => value.startsWith(blocked))) {
    return null;
  }

  return value;
}

export function buildAuthHref(nextPath?: string | null) {
  const safeNext = getSafeNextPath(nextPath ?? null);
  if (!safeNext) {
    return CUSTOMER_ROUTES.AUTH;
  }

  return `${CUSTOMER_ROUTES.AUTH}?next=${encodeURIComponent(safeNext)}`;
}
