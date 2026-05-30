"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { buildAuthHref } from "../../src/lib/auth-redirect";

function ReviewsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const authRedirect = useMemo(() => buildAuthHref(nextPath), [nextPath]);

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          router.replace(authRedirect);
        }
      } catch {
        router.replace(authRedirect);
      }
    };

    void ensureAuth();
  }, [authRedirect, router]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black uppercase tracking-tight">Reviews & Ratings</h1>
      <p className="mt-4 text-sm text-zinc-600">
        This page is reserved for writing product reviews and ratings after purchase.
      </p>
      <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="mt-8 inline-block rounded-full border border-zinc-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em]">
        Browse Products
      </Link>
    </main>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense fallback={null}>
      <ReviewsContent />
    </Suspense>
  );
}
