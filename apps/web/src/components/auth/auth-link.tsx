"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildAuthHref } from "../../lib/auth-redirect";
import { useAuthStatus } from "../../hooks/use-auth-status";

type AuthLinkProps = {
  href: string;
  requiresAuth?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
};

export function AuthLink({ href, requiresAuth = false, className, children, ariaLabel }: AuthLinkProps) {
  const router = useRouter();
  const status = useAuthStatus();
  const authHref = buildAuthHref(href);
  const shouldGate = requiresAuth && status === "guest";

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!requiresAuth) {
      return;
    }

    if (status === "authenticated") {
      return;
    }

    event.preventDefault();
    router.push(authHref);
  };

  return (
    <Link
      href={shouldGate ? authHref : href}
      className={className}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
