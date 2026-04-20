import { NextResponse } from "next/server";

import { AuthError, requireSession } from "../../../../src/lib/auth-session";
import { checkoutCart } from "../../../../src/lib/ecommerce-db";

type CheckoutPayload = {
  address?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  paymentMethod?: "card" | "cod";
  notes?: string;
};

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CheckoutPayload;

    const address = payload.shippingAddress ?? payload.address;
    if (!address || !address.fullName || !address.phone || !address.line1 || !address.city || !address.postalCode || !address.country) {
      return NextResponse.json({ error: "Complete address is required." }, { status: 400 });
    }

    if (payload.paymentMethod !== "card" && payload.paymentMethod !== "cod") {
      return NextResponse.json({ error: "paymentMethod must be 'card' or 'cod'." }, { status: 400 });
    }

    const result = await checkoutCart(session.userId, {
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        line1: address.line1,
        city: address.city,
        postalCode: address.postalCode,
        country: address.country,
      },
      paymentMethod: payload.paymentMethod,
      notes: payload.notes,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
    }

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ order: result }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to place order." }, { status: 500 });
  }
}
