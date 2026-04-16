import { NextResponse } from "next/server";

import { getAuthenticatedUser, isAdminRole } from "../../../../src/lib/auth";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      isAdmin: isAdminRole(user.roles),
    },
  });
}
