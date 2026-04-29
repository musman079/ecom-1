import "next-auth";
import "next-auth/jwt";

type SessionRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: SessionRole;
      roles: SessionRole[];
    };
  }

  interface User {
    role?: SessionRole;
    roles?: SessionRole[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: SessionRole;
    roles?: SessionRole[];
  }
}
