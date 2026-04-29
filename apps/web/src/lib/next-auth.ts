import type { RoleType } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import { getAdminEmails, normalizeEmail, verifyPassword } from "./auth";
import { prisma } from "./prisma";

type SessionRole = "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";

function toPrimaryRole(roles: readonly string[]): SessionRole {
  if (roles.includes("SUPER_ADMIN")) {
    return "SUPER_ADMIN";
  }

  if (roles.includes("ADMIN")) {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function mapUserRoles(email: string, roles?: string[]): SessionRole[] {
  const baseRoles = Array.isArray(roles) ? [...roles] : [];
  const hasAdminEmail = getAdminEmails().includes(email.trim().toLowerCase());

  if (hasAdminEmail && !baseRoles.includes("ADMIN")) {
    baseRoles.push("ADMIN");
  }

  if (baseRoles.length === 0) {
    baseRoles.push("CUSTOMER");
  }

  return Array.from(new Set(baseRoles.filter((role): role is SessionRole => ["CUSTOMER", "ADMIN", "SUPER_ADMIN"].includes(role))));
}

async function ensureRoleExists(name: RoleType) {
  return prisma.role.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function ensureUserRole(userId: string, roleName: RoleType) {
  const role = await ensureRoleExists(roleName);

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId,
      roleId: role.id,
    },
  });
}

async function getRoleSnapshotByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalized },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const roleNames = mapUserRoles(
    user.email,
    user.roles.map((entry) => entry.role.name),
  );

  return {
    id: user.id,
    email: user.email,
    roles: roleNames,
    role: toPrimaryRole(roleNames),
  };
}

async function ensureOAuthUser(email: string, name?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      fullName: name?.trim() || normalizedEmail.split("@")[0] || "Customer",
      passwordHash: null,
      isActive: true,
    },
    select: { id: true },
  });

  await ensureUserRole(created.id, "CUSTOMER");

  if (getAdminEmails().includes(normalizedEmail)) {
    await ensureUserRole(created.id, "ADMIN");
  }

  return created.id;
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = normalizeEmail(credentials?.email ?? "");
      const password = credentials?.password ?? "";

      if (!email || !password) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.isActive || !user.passwordHash) {
        return null;
      }

      const passwordValid = await verifyPassword(password, user.passwordHash);
      if (!passwordValid) {
        return null;
      }

      const roleNames = mapUserRoles(
        user.email,
        user.roles.map((entry) => entry.role.name),
      );

      if (getAdminEmails().includes(email) && !roleNames.includes("ADMIN")) {
        await ensureUserRole(user.id, "ADMIN");
      }

      const snapshotRoles = mapUserRoles(email, roleNames);

      return {
        id: user.id,
        email: user.email,
        role: toPrimaryRole(snapshotRoles),
        roles: snapshotRoles,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.JWT_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      if (!user.email) {
        return false;
      }

      try {
        await ensureOAuthUser(user.email, user.name);
        return true;
      } catch (error) {
        console.error("OAuth user sync failed", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      const email = normalizeEmail((user?.email as string | undefined) ?? (token.email as string | undefined) ?? "");
      if (!email) {
        return token;
      }

      const snapshot = await getRoleSnapshotByEmail(email);
      if (!snapshot) {
        return token;
      }

      token.sub = snapshot.id;
      token.email = snapshot.email;
      token.role = snapshot.role;
      token.roles = snapshot.roles;
      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      const roles = Array.isArray(token.roles)
        ? token.roles.filter((value): value is SessionRole => typeof value === "string")
        : [];

      session.user.id = typeof token.sub === "string" ? token.sub : "";
      session.user.email = typeof token.email === "string" ? token.email : session.user.email;
      session.user.roles = roles.length > 0 ? roles : ["CUSTOMER"];
      session.user.role =
        typeof token.role === "string" && ["CUSTOMER", "ADMIN", "SUPER_ADMIN"].includes(token.role)
          ? (token.role as SessionRole)
          : toPrimaryRole(session.user.roles);

      return session;
    },
  },
};
