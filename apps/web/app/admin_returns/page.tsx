import { Suspense } from "react";
import { AdminReturnsClient } from "./admin-returns-client";

function AdminReturnsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] text-sm font-medium text-zinc-500">
      Loading admin returns...
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense fallback={<AdminReturnsLoading />}>
      <AdminReturnsClient />
    </Suspense>
  );
}
