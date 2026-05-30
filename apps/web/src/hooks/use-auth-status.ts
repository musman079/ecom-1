"use client";

import { useEffect, useState } from "react";

export type AuthStatus = "unknown" | "authenticated" | "guest";

const CACHE_KEY = "ecom.auth.status";
const CACHE_TTL_MS = 2 * 60 * 1000;
let inFlight: Promise<AuthStatus> | null = null;

function readCache(): AuthStatus | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { status?: AuthStatus; timestamp?: number };
    if (!parsed.status || typeof parsed.timestamp !== "number") {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return parsed.status;
  } catch {
    return null;
  }
}

export function writeAuthStatusCache(status: AuthStatus) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ status, timestamp: Date.now() }),
    );
  } catch {
    // Ignore cache write failures.
  }
}

export function clearAuthStatusCache() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore cache clear failures.
  }
}

async function fetchAuthStatus(): Promise<AuthStatus> {
  const cached = readCache();
  if (cached) {
    return cached;
  }

  if (inFlight) {
    return inFlight;
  }

  inFlight = fetch("/api/auth/me", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        return "guest" as const;
      }

      const payload = (await response.json()) as { success?: boolean; user?: { id?: string } | null };
      return payload?.success && payload?.user?.id ? ("authenticated" as const) : ("guest" as const);
    })
    .catch(() => "guest" as const)
    .finally(() => {
      inFlight = null;
    });

  const status = await inFlight;
  writeAuthStatusCache(status);
  return status;
}

export function useAuthStatus() {
  const [status, setStatus] = useState<AuthStatus>(() => readCache() ?? "unknown");

  useEffect(() => {
    let active = true;

    fetchAuthStatus().then((next) => {
      if (active) {
        setStatus(next);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  return status;
}
