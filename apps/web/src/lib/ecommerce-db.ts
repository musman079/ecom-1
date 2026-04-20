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
  category?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;
  createdBy?: string;
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
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
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
  paymentStatus?: "pending" | "paid" | "failed";
  trackingNumber?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewDocument = {
  _id: ObjectId;
  productId: ObjectId;
  userId: ObjectId;
  userName: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type CouponDocument = {
  _id: ObjectId;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
  validFrom?: Date;
  validUntil?: Date;
  usageLimit?: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
};

type ProductQueryOptions = {
  publishedOnly?: boolean;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "createdAt" | "price" | "title";
  order?: "asc" | "desc";
  limit?: number;
  page?: number;
};

export type AdminOrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

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

async function reviewsCollection() {
  const db = await getMongoDb();
  return db.collection<ReviewDocument>("reviews");
}

async function couponsCollection() {
  const db = await getMongoDb();
  return db.collection<CouponDocument>("coupons");
}

export function mapProduct(document: ProductDocument) {
  return {
    id: document._id.toHexString(),
    title: document.title,
    description: document.description,
    price: document.price,
    category: document.category ?? "General",
    images: Array.isArray(document.images) ? document.images : [],
    rating: Number(document.rating ?? 0),
    reviewCount: Number(document.reviewCount ?? 0),
    isActive: document.isActive ?? true,
    createdBy: document.createdBy ?? null,
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

export async function updateUserProfile(userId: string, input: { fullName: string; phone?: string }) {
  const users = await usersCollection();
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const fullName = input.fullName.trim();
  if (!fullName) {
    return null;
  }

  const now = new Date();
  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        fullName,
        phone: input.phone?.trim() || undefined,
        updatedAt: now,
      },
    },
  );

  return users.findOne({ _id: objectId });
}

export async function listProducts(options?: { publishedOnly?: boolean }) {
  const result = await listProductsWithMeta({ publishedOnly: options?.publishedOnly });
  return result.products;
}

export async function listProductsWithMeta(options?: ProductQueryOptions) {
  const products = await productsCollection();

  const filter: Record<string, unknown> = {};
  if (options?.publishedOnly) {
    filter.status = "published";
    filter.isActive = { $ne: false };
  }

  if (options?.category) {
    filter.category = options.category;
  }

  if (Number.isFinite(options?.minPrice) || Number.isFinite(options?.maxPrice)) {
    filter.price = {};
    if (Number.isFinite(options?.minPrice)) {
      (filter.price as Record<string, number>).$gte = Number(options?.minPrice);
    }
    if (Number.isFinite(options?.maxPrice)) {
      (filter.price as Record<string, number>).$lte = Number(options?.maxPrice);
    }
  }

  if (options?.search?.trim()) {
    const searchRegex = new RegExp(options.search.trim(), "i");
    filter.$or = [{ title: searchRegex }, { description: searchRegex }, { sku: searchRegex }];
  }

  const page = Math.max(1, options?.page ?? 1);
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  const sortField = options?.sortBy ?? "createdAt";
  const sortDirection = options?.order === "asc" ? 1 : -1;

  const [total, docs] = await Promise.all([
    products.countDocuments(filter),
    products
      .find(filter)
      .sort({ [sortField]: sortDirection })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray(),
  ]);

  return {
    products: docs.map(mapProduct),
    total,
    page,
    limit,
  };
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

export async function listReviewsByProduct(productId: string, options?: { approvedOnly?: boolean; limit?: number }) {
  const productObjectId = toObjectId(productId);
  if (!productObjectId) {
    return [];
  }

  const reviews = await reviewsCollection();
  const filter: Record<string, unknown> = { productId: productObjectId };
  if (options?.approvedOnly) {
    filter.isApproved = true;
  }

  const limit = Math.max(1, Math.min(options?.limit ?? 50, 100));
  const docs = await reviews.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

  return docs.map((review) => ({
    id: review._id.toHexString(),
    productId: review.productId.toHexString(),
    userId: review.userId.toHexString(),
    userName: review.userName,
    rating: review.rating,
    comment: review.comment,
    isApproved: review.isApproved,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }));
}

export async function createReview(input: {
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
}) {
  const productObjectId = toObjectId(input.productId);
  const userObjectId = toObjectId(input.userId);
  if (!productObjectId || !userObjectId) {
    return null;
  }

  const products = await productsCollection();
  const product = await products.findOne({ _id: productObjectId, status: "published" });
  if (!product) {
    return null;
  }

  const reviews = await reviewsCollection();
  const now = new Date();

  const reviewDoc: Omit<ReviewDocument, "_id"> = {
    productId: productObjectId,
    userId: userObjectId,
    userName: input.userName,
    rating: input.rating,
    comment: input.comment,
    isApproved: true,
    createdAt: now,
    updatedAt: now,
  };

  const insertResult = await reviews.insertOne(reviewDoc as ReviewDocument);

  const approvedReviews = await reviews.find({ productId: productObjectId, isApproved: true }).toArray();
  const reviewCount = approvedReviews.length;
  const averageRating = reviewCount
    ? Number((approvedReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(2))
    : 0;

  await products.updateOne(
    { _id: productObjectId },
    {
      $set: {
        rating: averageRating,
        reviewCount,
        updatedAt: now,
      },
    },
  );

  const inserted = await reviews.findOne({ _id: insertResult.insertedId });
  if (!inserted) {
    return null;
  }

  return {
    id: inserted._id.toHexString(),
    productId: inserted.productId.toHexString(),
    userId: inserted.userId.toHexString(),
    userName: inserted.userName,
    rating: inserted.rating,
    comment: inserted.comment,
    isApproved: inserted.isApproved,
    createdAt: inserted.createdAt.toISOString(),
    updatedAt: inserted.updatedAt.toISOString(),
  };
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
    status: "processing",
    items: orderItems,
    subtotal,
    shippingCost,
    taxAmount,
    total,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === "cod" ? "pending" : "paid",
    estimatedDelivery: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
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

export async function listRecentOrdersByUser(userId: string, options?: { limit?: number }) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return [];
  }

  const limit = Math.max(1, Math.min(options?.limit ?? 12, 50));
  const orders = await ordersCollection();

  const docs = await orders
    .find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((order) => ({
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus ?? "pending",
    trackingNumber: order.trackingNumber ?? null,
    total: order.total,
    totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
    leadItemTitle: order.items[0]?.title ?? "Order Item",
    createdAt: order.createdAt.toISOString(),
  }));
}

export async function listRecentOrdersForAdmin(options?: { limit?: number; status?: AdminOrderStatus }) {
  const limit = Math.max(1, Math.min(options?.limit ?? 30, 100));
  const orders = await ordersCollection();

  const filter: Record<string, unknown> = {};
  if (options?.status) {
    filter.status = options.status;
  }

  const docs = await orders.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

  const userIds = Array.from(new Set(docs.map((order) => order.userId.toHexString()))).map((id) => new ObjectId(id));
  const users = await usersCollection();
  const userDocs = userIds.length > 0 ? await users.find({ _id: { $in: userIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((user) => [user._id.toHexString(), user]));

  return docs.map((order) => {
    const user = userMap.get(order.userId.toHexString());
    return {
      id: order._id.toHexString(),
      orderNumber: order.orderNumber,
      userId: order.userId.toHexString(),
      customerName: user?.fullName ?? "Customer",
      customerEmail: user?.email ?? "-",
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus ?? "pending",
      trackingNumber: order.trackingNumber ?? null,
      total: order.total,
      totalItems: order.items.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  });
}

export async function updateOrderByAdmin(input: {
  orderId: string;
  status?: AdminOrderStatus;
  trackingNumber?: string;
  paymentStatus?: "pending" | "paid" | "failed";
}) {
  const orderObjectId = toObjectId(input.orderId);
  if (!orderObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const existing = await orders.findOne({ _id: orderObjectId });
  if (!existing) {
    return null;
  }

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.status) {
    updateSet.status = input.status;

    if (input.status === "delivered") {
      updateSet.deliveredAt = new Date();
    }

    if (input.status === "cancelled") {
      updateSet.cancelledAt = new Date();
    }
  }

  if (input.trackingNumber !== undefined) {
    const trimmedTracking = input.trackingNumber.trim();
    updateSet.trackingNumber = trimmedTracking || null;
  }

  if (input.paymentStatus) {
    updateSet.paymentStatus = input.paymentStatus;
  }

  await orders.updateOne(
    { _id: orderObjectId },
    {
      $set: updateSet,
    },
  );

  const updated = await orders.findOne({ _id: orderObjectId });
  if (!updated) {
    return null;
  }

  return {
    id: updated._id.toHexString(),
    orderNumber: updated.orderNumber,
    status: updated.status,
    paymentStatus: updated.paymentStatus ?? "pending",
    trackingNumber: updated.trackingNumber ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function getOrderByIdForUser(userId: string, orderId: string) {
  const userObjectId = toObjectId(userId);
  const orderObjectId = toObjectId(orderId);
  if (!userObjectId || !orderObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({ _id: orderObjectId, userId: userObjectId });
  if (!order) {
    return null;
  }

  return {
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus ?? "pending",
    trackingNumber: order.trackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
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
    shippingAddress: order.shippingAddress,
    notes: order.notes ?? "",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function trackOrderForUser(userId: string, orderNumber: string) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({ userId: userObjectId, orderNumber: orderNumber.trim() });
  if (!order) {
    return null;
  }

  return {
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    trackingNumber: order.trackingNumber ?? null,
    estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.toISOString() : null,
    paymentStatus: order.paymentStatus ?? "pending",
    updatedAt: order.updatedAt.toISOString(),
  };
}

export async function cancelOrderForUser(userId: string, orderId: string) {
  const userObjectId = toObjectId(userId);
  const orderObjectId = toObjectId(orderId);
  if (!userObjectId || !orderObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({ _id: orderObjectId, userId: userObjectId });
  if (!order) {
    return null;
  }

  if (!["pending", "confirmed", "processing"].includes(order.status)) {
    return { error: "Order cannot be cancelled at this stage." as const };
  }

  await orders.updateOne(
    { _id: orderObjectId },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    },
  );

  return { ok: true as const };
}

export async function getAdminDashboardMetrics() {
  const [orders, products, users] = await Promise.all([ordersCollection(), productsCollection(), usersCollection()]);

  const [totalOrders, totalCustomers, totalProducts, deliveredOrders, processingOrders, lowStockProducts] = await Promise.all([
    orders.countDocuments({}),
    users.countDocuments({ isActive: true }),
    products.countDocuments({}),
    orders.countDocuments({ status: "delivered" }),
    orders.countDocuments({ status: "processing" }),
    products.countDocuments({ stockQuantity: { $lte: 5 } }),
  ]);

  const revenueDocs = await orders
    .aggregate<{ _id: null; totalRevenue: number }>([
      {
        $match: {
          status: { $in: ["processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
    ])
    .toArray();

  return {
    totalRevenue: Number((revenueDocs[0]?.totalRevenue ?? 0).toFixed(2)),
    totalOrders,
    totalCustomers,
    totalProducts,
    deliveredOrders,
    processingOrders,
    lowStockProducts,
  };
}

export async function getAdminAnalytics(options?: { months?: number; topProductsLimit?: number }) {
  const months = Math.max(1, Math.min(options?.months ?? 6, 24));
  const topProductsLimit = Math.max(1, Math.min(options?.topProductsLimit ?? 5, 20));
  const fromDate = new Date();
  fromDate.setMonth(fromDate.getMonth() - months + 1);
  fromDate.setDate(1);
  fromDate.setHours(0, 0, 0, 0);

  const orders = await ordersCollection();

  const salesByMonth = await orders
    .aggregate<{
      _id: { year: number; month: number };
      revenue: number;
      orders: number;
    }>([
      {
        $match: {
          createdAt: { $gte: fromDate },
          status: { $in: ["processing", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ])
    .toArray();

  const topProducts = await orders
    .aggregate<{
      _id: string;
      quantitySold: number;
      revenue: number;
      productTitle: string;
      sku: string;
    }>([
      {
        $unwind: "$items",
      },
      {
        $group: {
          _id: "$items.productId",
          quantitySold: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.lineTotal" },
          productTitle: { $first: "$items.title" },
          sku: { $first: "$items.sku" },
        },
      },
      {
        $sort: {
          quantitySold: -1,
        },
      },
      {
        $limit: topProductsLimit,
      },
    ])
    .toArray();

  return {
    salesByMonth: salesByMonth.map((row) => ({
      year: row._id.year,
      month: row._id.month,
      revenue: Number(row.revenue.toFixed(2)),
      orders: row.orders,
    })),
    topProducts: topProducts.map((row) => ({
      productId: row._id.toString(),
      productTitle: row.productTitle,
      sku: row.sku,
      quantitySold: row.quantitySold,
      revenue: Number(row.revenue.toFixed(2)),
    })),
  };
}

export async function applyCouponCode(input: { code: string; subtotal: number }) {
  const normalizedCode = input.code.trim().toUpperCase();
  if (!normalizedCode || !Number.isFinite(input.subtotal) || input.subtotal < 0) {
    return { error: "Invalid coupon or subtotal." as const };
  }

  const coupons = await couponsCollection();
  const now = new Date();

  const coupon = await coupons.findOne({
    code: normalizedCode,
    isActive: true,
    $or: [{ validFrom: { $exists: false } }, { validFrom: { $lte: now } }],
  });

  if (!coupon) {
    return { error: "Coupon not found or inactive." as const };
  }

  if (coupon.validUntil && coupon.validUntil < now) {
    return { error: "Coupon has expired." as const };
  }

  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { error: "Coupon usage limit reached." as const };
  }

  if (coupon.minOrderAmount !== undefined && input.subtotal < coupon.minOrderAmount) {
    return { error: `Minimum order amount is ${coupon.minOrderAmount}.` as const };
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (input.subtotal * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  if (coupon.maxDiscount !== undefined) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }

  discountAmount = Number(Math.max(0, Math.min(discountAmount, input.subtotal)).toFixed(2));

  return {
    code: coupon.code,
    discountAmount,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    finalSubtotal: Number((input.subtotal - discountAmount).toFixed(2)),
  };
}
