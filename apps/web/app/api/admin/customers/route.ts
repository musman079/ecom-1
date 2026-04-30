import { NextResponse } from "next/server";
import { prisma } from "../../../../src/lib/prisma";
import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);

    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const searchParam = url.searchParams.get("search");

    const limit = limitParam ? Number(limitParam) : 50;

    const search = searchParam?.trim();
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { fullName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const customers = await prisma.user.findMany({
      where,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            totalInCents: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    // Transform the data
    const transformedCustomers = customers.map((customer) => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + order.totalInCents, 0);
      const lastOrder = customer.orders.length > 0 ? customer.orders[0] : null;
      const roleNames = customer.roles.map((entry) => entry.role.name);
      const roles = roleNames.length > 0 ? Array.from(new Set(roleNames)) : ["CUSTOMER"];

      return {
        id: customer.id,
        email: customer.email,
        fullName: customer.fullName,
        phone: customer.phone,
        roles,
        totalOrders: customer._count.orders,
        totalSpent: totalSpent,
        totalSpentFormatted: `$${(totalSpent / 100).toFixed(2)}`,
        lastOrderDate: lastOrder?.createdAt ? new Date(lastOrder.createdAt).toISOString() : null,
        lastOrderStatus: lastOrder?.status || null,
        reviewsCount: customer._count.reviews,
        isActive: customer.isActive,
        createdAt: customer.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ customers: transformedCustomers });
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    console.error("Failed to load customers:", error);
    return NextResponse.json({ error: "Failed to load customers." }, { status: 500 });
  }
}
