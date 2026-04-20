import { redirect } from "next/navigation";

import { getCurrentUser } from "./get-current-user";

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return user;
}
