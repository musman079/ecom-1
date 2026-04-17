import { ObjectId } from "mongodb";

import { mapUserRoles } from "./admin-auth";
import { getMongoDb } from "./mongodb";

export type UserDocument = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  roles: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ProductStatus = "draft" | "published";

export type ProductDocument = {
  _id: ObjectId;
  title: string;
  description: string;
  price: number;
  taxCategory: string;
  collection: string;
  sku: string;
  stockQuantity: number;
  lowStockAlert: boolean;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
};

type CartItemDocument = {
  productId: ObjectId;
  quantity: number;
};

type CartDocument = {
  _id: ObjectId;
  userId: ObjectId;
  items: CartItemDocument[];
  createdAt: Date;
  updatedAt: Date;
};

type OrderItemSnapshot = {
  productId: ObjectId;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderDocument = {
  _id: ObjectId;
  orderNumber: string;
  userId: ObjectId;
  status: "pending" | "confirmed";
  items: OrderItemSnapshot[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: "card" | "cod";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

async function usersCollection() {
  const db = await getMongoDb();
  return db.collection<UserDocument>("users");
}

async function productsCollection() {
  const db = await getMongoDb();
  return db.collection<ProductDocument>("products");
}

async function cartsCollection() {
  const db = await getMongoDb();
  return db.collection<CartDocument>("carts");
}

async function ordersCollection() {
  const db = await getMongoDb();
  return db.collection<OrderDocument>("orders");
}

export function mapProduct(document: ProductDocument) {
  return {
    id: document._id.toHexString(),
    title: document.title,
    description: document.description,
    price: document.price,
    taxCategory: document.taxCategory,
    collection: document.collection,
    sku: document.sku,
    stockQuantity: document.stockQuantity,
    lowStockAlert: document.lowStockAlert,
    status: document.status,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
}) {
  const users = await usersCollection();
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date();

  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) {
    return null;
  }

  const result = await users.insertOne({
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || undefined,
    roles: mapUserRoles(normalizedEmail, ["CUSTOMER"]),
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } as UserDocument);

  const user = await users.findOne({ _id: result.insertedId });
  return user ?? null;
}

export async function findUserByEmail(email: string) {
  const users = await usersCollection();
  return users.findOne({ email: email.trim().toLowerCase() });
}

export async function findUserById(userId: string) {
  const users = await usersCollection();
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  return users.findOne({ _id: objectId });
}

export async function listProducts(options?: { publishedOnly?: boolean }) {
  const products = await productsCollection();
  const filter = options?.publishedOnly ? { status: "published" as const } : {};

  const items = await products.find(filter).sort({ createdAt: -1 }).toArray();
  return items.map(mapProduct);
}

export async function findProductById(productId: string) {
  const products = await productsCollection();
  const objectId = toObjectId(productId);

  if (!objectId) {
    return null;
  }

  const found = await products.findOne({ _id: objectId });
  return found ? mapProduct(found) : null;
}

export async function getProductDocumentById(productId: string) {
  const products = await productsCollection();
  const objectId = toObjectId(productId);
  if (!objectId) {
    return null;
  }

  return products.findOne({ _id: objectId });
}

export async function getCartWithProducts(userId: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  const carts = await cartsCollection();
  const products = await productsCollection();

  const cart = await carts.findOne({ userId: userObjectId });
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return { items: [], subtotal: 0, totalItems: 0 };
  }

  const productIds = items.map((item) => item.productId);
  const productDocs = await products.find({ _id: { $in: productIds } }).toArray();
  const productById = new Map(productDocs.map((doc) => [doc._id.toHexString(), doc]));

  const cartItems = items
    .map((item) => {
      const product = productById.get(item.productId.toHexString());
      if (!product) {
        return null;
      }

      const lineTotal = product.price * item.quantity;
      return {
        productId: product._id.toHexString(),
        title: product.title,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        stockQuantity: product.stockQuantity,
        lineTotal,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const subtotal = cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: cartItems,
    subtotal,
    totalItems,
  };
}

export async function addToCart(userId: string, productId: string, quantity: number) {
  const userObjectId = toObjectId(userId);
  const productObjectId = toObjectId(productId);

  if (!userObjectId || !productObjectId) {
    return null;
  }

  const products = await productsCollection();
  const product = await products.findOne({ _id: productObjectId, status: "published" });
  if (!product) {
    return null;
  }

  const carts = await cartsCollection();
  const now = new Date();

  await carts.updateOne(
    { userId: userObjectId },
    {
      $setOnInsert: {
        userId: userObjectId,
        items: [],
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  const cart = await carts.findOne({ userId: userObjectId });
  if (!cart) {
    return null;
  }

  const existing = cart.items.find((item) => item.productId.equals(productObjectId));
  const nextQuantity = Math.max(1, Math.min((existing?.quantity ?? 0) + quantity, product.stockQuantity));

  if (existing) {
    await carts.updateOne(
      { _id: cart._id, "items.productId": productObjectId },
      {
        $set: {
          "items.$.quantity": nextQuantity,
          updatedAt: now,
        },
      },
    );
  } else {
    await carts.updateOne(
      { _id: cart._id },
      {
        $push: {
          items: {
            productId: productObjectId,
            quantity: Math.max(1, Math.min(quantity, product.stockQuantity)),
          },
        },
        $set: {
          updatedAt: now,
        },
      },
    );
  }

  return getCartWithProducts(userId);
}

export async function updateCartItemQuantity(userId: string, productId: string, quantity: number) {
  const userObjectId = toObjectId(userId);
  const productObjectId = toObjectId(productId);

  if (!userObjectId || !productObjectId) {
    return null;
  }

  const carts = await cartsCollection();
  const products = await productsCollection();
  const product = await products.findOne({ _id: productObjectId });
  if (!product) {
    return null;
  }

  const safeQuantity = Math.max(0, Math.min(quantity, product.stockQuantity));

  if (safeQuantity === 0) {
    await carts.updateOne(
      { userId: userObjectId },
      {
        $pull: {
          items: {
            productId: productObjectId,
          },
        },
        $set: { updatedAt: new Date() },
      },
    );
    return getCartWithProducts(userId);
  }

  await carts.updateOne(
    { userId: userObjectId, "items.productId": productObjectId },
    {
      $set: {
        "items.$.quantity": safeQuantity,
        updatedAt: new Date(),
      },
    },
  );

  return getCartWithProducts(userId);
}

export async function removeFromCart(userId: string, productId: string) {
  const userObjectId = toObjectId(userId);
  const productObjectId = toObjectId(productId);

  if (!userObjectId || !productObjectId) {
    return null;
  }

  const carts = await cartsCollection();
  await carts.updateOne(
    { userId: userObjectId },
    {
      $pull: {
        items: {
          productId: productObjectId,
        },
      },
      $set: {
        updatedAt: new Date(),
      },
    },
  );

  return getCartWithProducts(userId);
}

function buildOrderNumber() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100).toString();
  return `ORD-${stamp}-${random}`;
}

export async function checkoutCart(userId: string, payload: {
  shippingAddress: {
    fullName: string;
    phone: string;
    line1: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: "card" | "cod";
  notes?: string;
}) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return null;
  }

  const carts = await cartsCollection();
  const products = await productsCollection();
  const orders = await ordersCollection();

  const cart = await carts.findOne({ userId: userObjectId });
  if (!cart || cart.items.length === 0) {
    return { error: "Cart is empty." as const };
  }

  const productIds = cart.items.map((item) => item.productId);
  const productDocs = await products.find({ _id: { $in: productIds } }).toArray();
  const productById = new Map(productDocs.map((doc) => [doc._id.toHexString(), doc]));

  const orderItems: OrderItemSnapshot[] = [];
  for (const item of cart.items) {
    const product = productById.get(item.productId.toHexString());
    if (!product || product.status !== "published") {
      return { error: "One or more products are no longer available." as const };
    }

    if (product.stockQuantity < item.quantity) {
      return { error: `Insufficient stock for ${product.title}.` as const };
    }

    orderItems.push({
      productId: product._id,
      title: product.title,
      sku: product.sku,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: product.price * item.quantity,
    });
  }

  for (const item of orderItems) {
    const stockUpdate = await products.updateOne(
      {
        _id: item.productId,
        stockQuantity: { $gte: item.quantity },
      },
      {
        $inc: {
          stockQuantity: -item.quantity,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
    );

    if (stockUpdate.modifiedCount === 0) {
      return { error: `Stock changed for ${item.title}. Please refresh cart.` as const };
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const shippingCost = subtotal > 0 ? 12 : 0;
  const taxAmount = Number((subtotal * 0.08).toFixed(2));
  const total = subtotal + shippingCost + taxAmount;
  const now = new Date();

  const order = {
    orderNumber: buildOrderNumber(),
    userId: userObjectId,
    status: "confirmed",
    items: orderItems,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
  };

  const orderResult = await orders.insertOne(order as OrderDocument);

  await carts.updateOne(
    { _id: cart._id },
    {
      $set: {
        items: [],
        updatedAt: new Date(),
      },
    },
  );

  return {
    orderId: orderResult.insertedId.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    items: order.items.map((item) => ({
      productId: item.productId.toHexString(),
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    createdAt: now.toISOString(),
  };
}
