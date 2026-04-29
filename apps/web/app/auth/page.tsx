import { Suspense } from "react";
import { AuthClient } from "./auth-client";

function AuthLoading() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#070d17] text-[#eaf2ff] flex items-center justify-center">
      <div className="text-white/60">Loading authentication...</div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthClient />
    </Suspense>
  );
}
