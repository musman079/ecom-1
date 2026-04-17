import { NextResponse } from "next/server";

import { mapUserRoles } from "../../../../src/lib/admin-auth";
import { getSessionFromRequest } from "../../../../src/lib/auth-session";
import { findUserById } from "../../../../src/lib/ecommerce-db";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const user = await findUserById(session.userId);
  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  const roles = mapUserRoles(user.email, user.roles);

  return NextResponse.json({
    user: {
      id: user._id.toHexString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? "",
      roles,
    },
  });
}
