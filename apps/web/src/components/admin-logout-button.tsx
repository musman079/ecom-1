"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { writeAuthStatusCache } from "../hooks/use-auth-status";

import { LogOut } from "lucide-react";

type AdminLogoutButtonProps = {
  className?: string;
  iconClassName?: string;
  label?: string;
};

export default function AdminLogoutButton(props: AdminLogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      await signOut({ redirect: false, callbackUrl: "/auth" });
      writeAuthStatusCache("guest");
      router.replace("/auth");
      router.refresh();
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void onLogout()}
      disabled={loading}
      className={props.className}
      aria-label="Logout"
      title="Logout"
    >
      <LogOut className={props.iconClassName ?? "w-4 h-4"} />
      <span>{loading ? "Logging out..." : props.label ?? "Logout"}</span>
    </button>
  );
}
