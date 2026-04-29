import { NextResponse } from "next/server";
import { ProductStatus } from "@prisma/client";

import { AuthError, requireSession } from "../../../src/lib/auth-session";
import { prisma } from "../../../src/lib/prisma";

type CartMutationPayload = {
  productId?: string;
  quantity?: number;
};

type ApiCartItem = {
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
  thumbnail: string | null;
};

type ApiCart = {
  items: ApiCartItem[];
  subtotal: number;
  totalItems: number;
};

async function readUserCart(userId: string): Promise<ApiCart> {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                    images: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return {
      items: [],
      subtotal: 0,
      totalItems: 0,
    };
  }

  const items: ApiCartItem[] = cart.items
    .filter((item) => item.variant.product.status === ProductStatus.PUBLISHED)
    .map((item) => {
      const price = item.variant.priceInCents / 100;
      const lineTotal = price * item.quantity;
      const thumbnail = (Array.isArray(item.variant.product.images) && item.variant.product.images.length > 0 ? item.variant.product.images[0] : null) ?? null;

      return {
        productId: item.variant.product.id,
        title: item.variant.product.title,
        sku: item.variant.sku,
        price,
        quantity: item.quantity,
        stockQuantity: item.variant.stockQuantity,
        lineTotal,
        thumbnail,
      };
    });

  const subtotal = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    totalItems,
  };
}

async function findCartItemByProductId(userId: string, productId: string) {
  return prisma.cartItem.findFirst({
    where: {
      cart: {
        userId,
      },
      variant: {
        productId,
      },
    },
    include: {
      variant: {
        select: {
          id: true,
          stockQuantity: true,
        },
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const session = await requireSession(request);
    const cart = await readUserCart(session.userId);
    return NextResponse.json({
      cart,
      items: cart.items,
      totalPrice: cart.subtotal,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CartMutationPayload;

    if (!payload.productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const quantity = Number(payload.quantity ?? 1);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json({ error: "quantity must be a positive number." }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: {
        id: payload.productId,
        status: ProductStatus.PUBLISHED,
      },
      include: {
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    const primaryVariant = product?.variants[0] ?? null;
    if (!primaryVariant) {
      return NextResponse.json({ error: "Product not found or unavailable." }, { status: 404 });
    }

    if (primaryVariant.stockQuantity <= 0) {
      return NextResponse.json({ error: "This product is out of stock." }, { status: 409 });
    }

    const cart = await prisma.cart.upsert({
      where: { userId: session.userId },
      update: {},
      create: {
        userId: session.userId,
      },
      select: {
        id: true,
      },
    });

    const existing = await prisma.cartItem.findUnique({
      where: {
        cartId_variantId: {
          cartId: cart.id,
          variantId: primaryVariant.id,
        },
      },
      select: {
        id: true,
        quantity: true,
      },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: Math.min(existing.quantity + Math.floor(quantity), primaryVariant.stockQuantity),
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          variantId: primaryVariant.id,
          quantity: Math.min(Math.floor(quantity), primaryVariant.stockQuantity),
        },
      });
    }

    const updatedCart = await readUserCart(session.userId);

    return NextResponse.json({ cart: updatedCart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to add to cart." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireSession(request);
    const payload = (await request.json()) as CartMutationPayload;

    if (!payload.productId || payload.quantity === undefined) {
      return NextResponse.json({ error: "productId and quantity are required." }, { status: 400 });
    }

    const quantity = Number(payload.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return NextResponse.json({ error: "quantity must be zero or a positive number." }, { status: 400 });
    }

    const cartItem = await findCartItemByProductId(session.userId, payload.productId);
    if (!cartItem) {
      return NextResponse.json({ error: "Unable to update cart item." }, { status: 404 });
    }

    if (Math.floor(quantity) === 0) {
      await prisma.cartItem.delete({
        where: {
          id: cartItem.id,
        },
      });
    } else {
      await prisma.cartItem.update({
        where: {
          id: cartItem.id,
        },
        data: {
          quantity: Math.min(Math.floor(quantity), cartItem.variant.stockQuantity),
        },
      });
    }

    const cart = await readUserCart(session.userId);

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireSession(request);

    const url = new URL(request.url);
    const productId = url.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId query parameter is required." }, { status: 400 });
    }

    const cartItem = await findCartItemByProductId(session.userId, productId);
    if (!cartItem) {
      return NextResponse.json({ error: "Unable to remove item from cart." }, { status: 404 });
    }

    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

    const cart = await readUserCart(session.userId);

    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to update cart." }, { status: 500 });
  }
}
