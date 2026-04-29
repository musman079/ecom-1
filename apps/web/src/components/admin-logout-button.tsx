"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
      await signOut({ redirect: false, callbackUrl: "/auth" });
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
      <span className={props.iconClassName ?? "material-symbols-outlined text-[20px]"}>logout</span>
      <span>{loading ? "Logging out..." : props.label ?? "Logout"}</span>
    </button>
  );
}
