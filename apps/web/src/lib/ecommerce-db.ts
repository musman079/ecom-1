import { ProductStatus as PrismaProductStatus } from "@prisma/client";
import { ObjectId } from "mongodb";

import { mapUserRoles } from "./admin-auth";
import { getMongoDb } from "./mongodb";
import { prisma } from "./prisma";

export type UserDocument = {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  notificationPreferences?: {
    orderUpdates: boolean;
    returnUpdates: boolean;
    emailEnabled: boolean;
  };
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
  /** Mongo product `_id`, or Prisma `Product.id` string when synced from storefront cart */
  productId: ObjectId | string;
  /** Present for Prisma / variant-backed lines — drives stock restock */
  variantId?: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderDocument = {
  _id: ObjectId;
  orderNumber: string;
  userId: ObjectId | string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItemSnapshot[];
  subtotal: number;
  discountAmount?: number;
  couponCode?: string;
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

type ReturnRequestStatus = "requested" | "approved" | "in_transit" | "refunded" | "rejected";
const RETURN_STATUS_TRANSITIONS: Record<ReturnRequestStatus, ReturnRequestStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["in_transit", "rejected"],
  in_transit: ["refunded", "rejected"],
  refunded: [],
  rejected: [],
};

type ReturnRequestDocument = {
  _id: ObjectId;
  returnNumber: string;
  userId: ObjectId | string;
  orderId: ObjectId;
  orderNumber: string;
  paymentStatus: "pending" | "paid" | "failed";
  reason: string;
  notes?: string;
  resolution: "refund" | "exchange";
  status: ReturnRequestStatus;
  refundStatus: "not_required" | "pending" | "refunded" | "failed";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ShippingRateRule = {
  countries?: string[];
  states?: string[];
  minSubtotal?: number;
  maxSubtotal?: number;
  rate: number;
  freeOver?: number;
  courier?: string;
};

type TaxRateRule = {
  countries?: string[];
  states?: string[];
  rate: number;
  label?: string;
};

type CheckoutAddress = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
};

type CheckoutPricingInput = {
  subtotal: number;
  shippingAddress: CheckoutAddress;
  discountAmount?: number;
};

type WishlistItemDocument = {
  _id: ObjectId;
  userId: ObjectId | string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
};

const DEFAULT_SHIPPING_RULES: ShippingRateRule[] = [
  { countries: ["US", "United States"], states: ["CA", "NY"], minSubtotal: 0, rate: 9.5, freeOver: 150, courier: "Priority Ground" },
  { countries: ["US", "United States"], minSubtotal: 0, rate: 12, freeOver: 120, courier: "Standard Ground" },
  { countries: ["CA", "Canada"], minSubtotal: 0, rate: 15, freeOver: 180, courier: "North America Ground" },
  { minSubtotal: 0, rate: 22, courier: "International Standard" },
];

const DEFAULT_TAX_RULES: TaxRateRule[] = [
  { countries: ["US", "United States"], states: ["CA"], rate: 0.0825, label: "California sales tax" },
  { countries: ["US", "United States"], states: ["NY"], rate: 0.08875, label: "New York sales tax" },
  { countries: ["US", "United States"], rate: 0.06, label: "US sales tax" },
  { countries: ["CA", "Canada"], rate: 0.13, label: "Canadian sales tax" },
  { rate: 0.08, label: "Standard VAT" },
];

function normalizeLocationValue(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

function parseRulesEnv<T>(name: string): T[] | null {
  const raw = process.env[name];
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : null;
  } catch {
    console.warn(`Ignoring invalid ${name} configuration.`);
    return null;
  }
}

function matchesRule(location: { country?: string; state?: string }, rule: { countries?: string[]; states?: string[] }) {
  const normalizedCountry = normalizeLocationValue(location.country);
  const normalizedState = normalizeLocationValue(location.state);
  const countries = rule.countries?.map((country) => country.trim().toLowerCase()).filter(Boolean);
  const states = rule.states?.map((state) => state.trim().toLowerCase()).filter(Boolean);

  const countryMatches = !countries || countries.length === 0 || (normalizedCountry ? countries.includes(normalizedCountry) : false);
  const stateMatches = !states || states.length === 0 || (normalizedState ? states.includes(normalizedState) : false);

  return countryMatches && stateMatches;
}

function resolveShippingRule(input: CheckoutPricingInput) {
  const rules = parseRulesEnv<ShippingRateRule>("CHECKOUT_SHIPPING_RULES") ?? DEFAULT_SHIPPING_RULES;
  const subtotal = Math.max(0, Number(input.subtotal ?? 0));

  const rule =
    rules.find((entry) => {
      if (!matchesRule({ country: input.shippingAddress.country, state: input.shippingAddress.state }, entry)) {
        return false;
      }

      if (typeof entry.minSubtotal === "number" && subtotal < entry.minSubtotal) {
        return false;
      }

      if (typeof entry.maxSubtotal === "number" && subtotal > entry.maxSubtotal) {
        return false;
      }

      return true;
    }) ?? rules[rules.length - 1] ?? DEFAULT_SHIPPING_RULES[DEFAULT_SHIPPING_RULES.length - 1];

  const shippingCost = typeof rule.freeOver === "number" && subtotal >= rule.freeOver ? 0 : Number((rule.rate ?? 0).toFixed(2));

  return {
    shippingCost: Number(shippingCost.toFixed(2)),
    courier: rule.courier ?? "Standard shipping",
  };
}

function resolveTaxRule(input: CheckoutPricingInput) {
  const rules = parseRulesEnv<TaxRateRule>("CHECKOUT_TAX_RULES") ?? DEFAULT_TAX_RULES;
  const taxableSubtotal = Math.max(0, Number(input.subtotal ?? 0) - Math.max(0, Number(input.discountAmount ?? 0)));

  const rule =
    rules.find((entry) => matchesRule({ country: input.shippingAddress.country, state: input.shippingAddress.state }, entry)) ??
    rules[rules.length - 1] ??
    DEFAULT_TAX_RULES[DEFAULT_TAX_RULES.length - 1];

  return {
    rate: Number(rule.rate ?? 0),
    taxAmount: Number((taxableSubtotal * Number(rule.rate ?? 0)).toFixed(2)),
    label: rule.label ?? "Sales tax",
  };
}

export function calculateCheckoutPricing(input: CheckoutPricingInput) {
  const shipping = resolveShippingRule(input);
  const tax = resolveTaxRule(input);
  const subtotal = Math.max(0, Number(input.subtotal ?? 0));
  const discountAmount = Math.max(0, Number(input.discountAmount ?? 0));
  const discountedSubtotal = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
  const total = Number((discountedSubtotal + shipping.shippingCost + tax.taxAmount).toFixed(2));

  return {
    subtotal,
    discountAmount,
    discountedSubtotal,
    shippingCost: shipping.shippingCost,
    shippingCourier: shipping.courier,
    taxRate: tax.rate,
    taxLabel: tax.label,
    taxAmount: tax.taxAmount,
    total,
  };
}

type NotificationKind =
  | "order_created"
  | "order_status_updated"
  | "return_requested"
  | "return_status_updated"
  | "admin_return_requested";

type NotificationPreferences = {
  orderUpdates: boolean;
  returnUpdates: boolean;
  emailEnabled: boolean;
};

type NotificationDocument = {
  _id: ObjectId;
  userId: ObjectId | string;
  audience: "customer" | "admin";
  kind: NotificationKind;
  title: string;
  message: string;
  metadata?: Record<string, string>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type NotificationEmailQueueDocument = {
  _id: ObjectId;
  userId: ObjectId | string;
  kind: NotificationKind;
  subject: string;
  body: string;
  recipientEmail?: string;
  status: "pending" | "sent" | "failed" | "permanently_failed";
  attemptCount: number;
  failureReason?: string;
  processedAt?: Date;
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

/** Query filter: match orders/notifications keyed by legacy BSON ObjectId or Prisma-style string ids */
function bsonUserOwnershipFilter(field: string, userId: string): Record<string, unknown> {
  if (/^[a-fA-F0-9]{24}$/.test(userId)) {
    return { [field]: { $in: [userId, new ObjectId(userId)] } };
  }
  return { [field]: userId };
}

/** Value stored on new Mongo documents for orders/returns — ObjectId only for 24‑hex ids */
function storedUserRef(userId: string): ObjectId | string {
  return /^[a-fA-F0-9]{24}$/.test(userId) ? new ObjectId(userId) : userId;
}

function orderItemProductIdForApi(pid: OrderItemSnapshot["productId"]) {
  return pid instanceof ObjectId ? pid.toHexString() : String(pid);
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

async function returnRequestsCollection() {
  const db = await getMongoDb();
  return db.collection<ReturnRequestDocument>("return_requests");
}

async function notificationsCollection() {
  const db = await getMongoDb();
  return db.collection<NotificationDocument>("notifications");
}

async function wishlistCollection() {
  const db = await getMongoDb();
  return db.collection<WishlistItemDocument>("wishlist_items");
}

async function notificationEmailQueueCollection() {
  const db = await getMongoDb();
  return db.collection<NotificationEmailQueueDocument>("notification_email_queue");
}

function notificationPreferenceKey(uid: ObjectId | string) {
  return uid instanceof ObjectId ? uid.toHexString() : uid;
}

/** BSON-safe user ref for notification documents */
function notificationStoredUserId(uid: ObjectId | string): ObjectId | string {
  if (uid instanceof ObjectId) return uid;
  return /^[a-fA-F0-9]{24}$/.test(uid) ? new ObjectId(uid) : uid;
}

async function createNotifications(input: Array<{
  userId: ObjectId | string;
  audience: "customer" | "admin";
  kind: NotificationKind;
  title: string;
  message: string;
  metadata?: Record<string, string>;
}>) {
  if (!input.length) {
    return;
  }

  const users = await usersCollection();
  const mongoCustomerHexIds = new Set<string>();
  const prismaCustomerIds = new Set<string>();

  for (const item of input) {
    if (item.audience !== "customer") continue;
    const uid = item.userId;
    if (uid instanceof ObjectId) mongoCustomerHexIds.add(uid.toHexString());
    else if (/^[a-fA-F0-9]{24}$/.test(uid)) mongoCustomerHexIds.add(uid);
    else prismaCustomerIds.add(uid);
  }

  const customerDocs =
    mongoCustomerHexIds.size > 0 ? await users.find({ _id: { $in: [...mongoCustomerHexIds].map((h) => new ObjectId(h)) } }).toArray() : [];

  const prismaCustomers =
    prismaCustomerIds.size > 0
      ? await prisma.user.findMany({
          where: { id: { in: [...prismaCustomerIds] }, isActive: true },
          select: {
            id: true,
            email: true,
            notificationOrderUpdates: true,
            notificationReturnUpdates: true,
            notificationEmailEnabled: true,
          },
        })
      : [];

  const customerPreferenceMap = new Map<string, NotificationPreferences>(
    customerDocs.map((doc) => [
      doc._id.toHexString(),
      {
        orderUpdates: doc.notificationPreferences?.orderUpdates ?? true,
        returnUpdates: doc.notificationPreferences?.returnUpdates ?? true,
        emailEnabled: doc.notificationPreferences?.emailEnabled ?? true,
      },
    ]),
  );

  for (const u of prismaCustomers) {
    customerPreferenceMap.set(u.id, {
      orderUpdates: u.notificationOrderUpdates,
      returnUpdates: u.notificationReturnUpdates,
      emailEnabled: u.notificationEmailEnabled,
    });
  }

  const customerEmailMap = new Map<string, string>(
    customerDocs.map((doc) => [doc._id.toHexString(), doc.email]),
  );
  for (const u of prismaCustomers) {
    customerEmailMap.set(u.id, u.email);
  }

  const kindPreferenceKey: Record<NotificationKind, keyof NotificationPreferences | null> = {
    order_created: "orderUpdates",
    order_status_updated: "orderUpdates",
    return_requested: "returnUpdates",
    return_status_updated: "returnUpdates",
    admin_return_requested: null,
  };

  const filteredInput = input.filter((item) => {
    if (item.audience === "admin") {
      return true;
    }

    const preferences =
      customerPreferenceMap.get(notificationPreferenceKey(item.userId)) ??
      ({
        orderUpdates: true,
        returnUpdates: true,
        emailEnabled: true,
      } satisfies NotificationPreferences);

    const preferenceKey = kindPreferenceKey[item.kind];
    if (!preferenceKey) {
      return true;
    }

    return preferences[preferenceKey] === true;
  });

  if (!filteredInput.length) {
    return;
  }

  const notifications = await notificationsCollection();
  const emailQueue = await notificationEmailQueueCollection();
  const now = new Date();

  await notifications.insertMany(
    filteredInput.map((item) => ({
      userId: notificationStoredUserId(item.userId),
      audience: item.audience,
      kind: item.kind,
      title: item.title,
      message: item.message,
      metadata: item.metadata,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    }) as NotificationDocument),
  );

  const emailEligibleKinds: NotificationKind[] = ["order_created", "order_status_updated", "return_status_updated"];

  const emailRows = filteredInput
    .filter((item) => {
      if (item.audience !== "customer" || !emailEligibleKinds.includes(item.kind)) {
        return false;
      }

      const preferences =
        customerPreferenceMap.get(notificationPreferenceKey(item.userId)) ??
        ({
          orderUpdates: true,
          returnUpdates: true,
          emailEnabled: true,
        } satisfies NotificationPreferences);

      return preferences.emailEnabled;
    })
    .map((item) => {
      const orderNumber = item.metadata?.orderNumber;
      const returnNumber = item.metadata?.returnNumber;

      let subject = item.title;
      let body = item.message;

      if (item.kind === "order_created") {
        subject = `Your order ${orderNumber ?? ""} is confirmed`.trim();
        body = `Thanks for shopping with us. Your order ${orderNumber ?? ""} has been placed and is now being processed.`.trim();
      } else if (item.kind === "order_status_updated") {
        subject = `Order ${orderNumber ?? ""} status update`.trim();
        body = `There is an update on order ${orderNumber ?? ""}: ${item.message}`.trim();
      } else if (item.kind === "return_status_updated") {
        subject = `Return ${returnNumber ?? ""} status update`.trim();
        body = `Your return request ${returnNumber ?? ""} has been updated. ${item.message}`.trim();
      }

      const recipientEmail = customerEmailMap.get(notificationPreferenceKey(item.userId));

      return {
        userId: notificationStoredUserId(item.userId),
        kind: item.kind,
        subject,
        body,
        recipientEmail,
        status: "pending",
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      } as NotificationEmailQueueDocument;
    });

  if (emailRows.length) {
    await emailQueue.insertMany(emailRows);
  }
}

async function getAdminUserIds() {
  const users = await usersCollection();
  const docs = await users
    .find({
      isActive: true,
      roles: { $in: ["ADMIN", "SUPER_ADMIN"] },
    })
    .project<{ _id: ObjectId }>({ _id: 1 })
    .toArray();

  return docs.map((item) => item._id);
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
    notificationPreferences: {
      orderUpdates: true,
      returnUpdates: true,
      emailEnabled: true,
    },
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

export async function getNotificationPreferencesByUserId(userId: string) {
  const users = await usersCollection();
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const user = await users.findOne({ _id: objectId });
  if (!user) {
    return null;
  }

  return {
    orderUpdates: user.notificationPreferences?.orderUpdates ?? true,
    returnUpdates: user.notificationPreferences?.returnUpdates ?? true,
    emailEnabled: user.notificationPreferences?.emailEnabled ?? true,
  } satisfies NotificationPreferences;
}

export async function updateNotificationPreferencesByUserId(
  userId: string,
  input: Partial<NotificationPreferences>,
) {
  const users = await usersCollection();
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const current = await getNotificationPreferencesByUserId(userId);
  if (!current) {
    return null;
  }

  const nextPreferences: NotificationPreferences = {
    orderUpdates: input.orderUpdates ?? current.orderUpdates,
    returnUpdates: input.returnUpdates ?? current.returnUpdates,
    emailEnabled: input.emailEnabled ?? current.emailEnabled,
  };

  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        notificationPreferences: nextPreferences,
        updatedAt: new Date(),
      },
    },
  );

  return nextPreferences;
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

async function restockOrderItems(items: OrderItemSnapshot[]) {
  if (!items.length) {
    return;
  }

  const products = await productsCollection();

  for (const item of items) {
    if (item.variantId) {
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stockQuantity: { increment: item.quantity } },
      });
      continue;
    }

    const pid = item.productId;
    if (pid instanceof ObjectId) {
      await products.updateOne(
        { _id: pid },
        {
          $inc: {
            stockQuantity: item.quantity,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
      );
      continue;
    }

    const mongoOid = typeof pid === "string" ? toObjectId(pid) : null;
    if (mongoOid) {
      await products.updateOne(
        { _id: mongoOid },
        {
          $inc: {
            stockQuantity: item.quantity,
          },
          $set: {
            updatedAt: new Date(),
          },
        },
      );
    }
  }
}

/**
 * Storefront checkout backed by Prisma Cart + Inventory (authoritative cart from `/api/cart`).
 */
export async function checkoutFromPrismaCart(
  userId: string,
  payload: {
    shippingAddress: {
      fullName: string;
      phone: string;
      line1: string;
      city: string;
      postalCode: string;
      country: string;
      state?: string;
    };
    paymentMethod: "card" | "cod";
    notes?: string;
    couponCode?: string;
  },
) {
  const cartRow = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          variant: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!cartRow || cartRow.items.length === 0) {
    return { error: "Cart is empty." as const };
  }

  const restoredCartItems = cartRow.items.map((ci) => ({
    variantId: ci.variantId,
    quantity: ci.quantity,
  }));

  type PricedLine = {
    variantId: string;
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  };

  const lines: PricedLine[] = [];

  for (const row of cartRow.items) {
    const variant = row.variant;
    const product = variant.product;

    if (product.status !== PrismaProductStatus.PUBLISHED || !variant.isActive) {
      return { error: "One or more products are no longer available." as const };
    }

    if (variant.stockQuantity < row.quantity) {
      return { error: `Insufficient stock for ${product.title}.` as const };
    }

    const unitPrice = variant.priceInCents / 100;
    lines.push({
      variantId: row.variantId,
      productId: product.id,
      title: product.title,
      sku: variant.sku,
      quantity: row.quantity,
      unitPrice,
      lineTotal: Number((unitPrice * row.quantity).toFixed(2)),
    });
  }

  const subtotal = Number(lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2));

  let couponCode: string | undefined;
  let discountAmount = 0;

  if (payload.couponCode?.trim()) {
    const couponResult = await applyCouponCode({
      code: payload.couponCode,
      subtotal,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    couponCode = couponResult.code;
    discountAmount = couponResult.discountAmount;
  }

  const pricing = calculateCheckoutPricing({
    subtotal,
    discountAmount,
    shippingAddress: payload.shippingAddress,
  });
  const shippingCost = pricing.shippingCost;
  const taxAmount = pricing.taxAmount;
  const total = pricing.total;
  const now = new Date();
  const orderNumber = buildOrderNumber();

  const orderItems: OrderItemSnapshot[] = lines.map((line) => ({
    productId: line.productId,
    variantId: line.variantId,
    title: line.title,
    sku: line.sku,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    lineTotal: line.lineTotal,
  }));

  const decrementedLines = lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity }));

  try {
    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const res = await tx.productVariant.updateMany({
          where: { id: line.variantId, stockQuantity: { gte: line.quantity } },
          data: {
            stockQuantity: { decrement: line.quantity },
          },
        });

        if (res.count !== 1) {
          throw new Error("stock_conflict");
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cartRow.id } });
    });
  } catch {
    return { error: "Stock changed while checking out. Please refresh your cart and try again." as const };
  }

  const orders = await ordersCollection();

  const orderBody = {
    orderNumber,
    userId: storedUserRef(userId),
    status: "processing" as const,
    items: orderItems,
    subtotal,
    discountAmount,
    couponCode,
    shippingCost,
    taxAmount,
    total,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    paymentStatus: "pending" as const,
    estimatedDelivery: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
  };

  let orderResult: { insertedId: ObjectId };
  try {
    orderResult = await orders.insertOne(orderBody as never);
  } catch {
    console.error("Mongo order insert failed after Prisma checkout; rolling back.");

    try {
      await prisma.$transaction(async (tx) => {
        for (const d of decrementedLines) {
          await tx.productVariant.update({
            where: { id: d.variantId },
            data: { stockQuantity: { increment: d.quantity } },
          });
        }

        for (const ri of restoredCartItems) {
          await tx.cartItem.create({
            data: {
              cartId: cartRow.id,
              variantId: ri.variantId,
              quantity: ri.quantity,
            },
          });
        }
      });
    } catch (rollbackErr) {
      console.error("Checkout rollback failed", rollbackErr);
    }

    return { error: "Failed to finalize order. Please try again." as const };
  }

  await createNotifications([
    {
      userId,
      audience: "customer",
      kind: "order_created",
      title: `Order ${orderNumber} confirmed`,
      message: `Your order has been placed successfully. Current status: ${orderBody.status}.`,
      metadata: {
        orderId: orderResult.insertedId.toHexString(),
        orderNumber,
      },
    },
  ]);

  if (couponCode) {
    const coupons = await couponsCollection();
    await coupons.updateOne(
      { code: couponCode },
      {
        $inc: { usedCount: 1 },
        $set: { updatedAt: new Date() },
      },
    );
  }

  return {
    orderId: orderResult.insertedId.toHexString(),
    orderNumber,
    status: orderBody.status,
    subtotal,
    discountAmount: discountAmount ?? 0,
    couponCode: couponCode ?? null,
    shippingCost,
    taxAmount,
    total,
    paymentStatus: orderBody.paymentStatus,
    items: orderItems.map((item) => ({
      productId: orderItemProductIdForApi(item.productId),
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    createdAt: now.toISOString(),
  };
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
  couponCode?: string;
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
        _id: item.productId as ObjectId,
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

  let couponCode: string | undefined;
  let discountAmount = 0;

  if (payload.couponCode?.trim()) {
    const couponResult = await applyCouponCode({
      code: payload.couponCode,
      subtotal,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    couponCode = couponResult.code;
    discountAmount = couponResult.discountAmount;
  }

  const pricing = calculateCheckoutPricing({
    subtotal,
    discountAmount,
    shippingAddress: payload.shippingAddress,
  });
  const shippingCost = pricing.shippingCost;
  const taxAmount = pricing.taxAmount;
  const total = pricing.total;
  const now = new Date();

  const order = {
    orderNumber: buildOrderNumber(),
    userId: userObjectId,
    status: "processing",
    items: orderItems,
    subtotal,
    discountAmount,
    couponCode,
    shippingCost,
    taxAmount,
    total,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    // Payment is finalized later by admin/manual confirmation flow.
    paymentStatus: "pending",
    estimatedDelivery: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
  };

  const orderResult = await orders.insertOne(order as OrderDocument);

  await createNotifications([
    {
      userId: userObjectId,
      audience: "customer",
      kind: "order_created",
      title: `Order ${order.orderNumber} confirmed`,
      message: `Your order has been placed successfully. Current status: ${order.status}.`,
      metadata: {
        orderId: orderResult.insertedId.toHexString(),
        orderNumber: order.orderNumber,
      },
    },
  ]);

  if (couponCode) {
    const coupons = await couponsCollection();
    await coupons.updateOne(
      { code: couponCode },
      {
        $inc: { usedCount: 1 },
        $set: { updatedAt: new Date() },
      },
    );
  }

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
    discountAmount: order.discountAmount ?? 0,
    couponCode: order.couponCode ?? null,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    items: order.items.map((item) => ({
      productId: orderItemProductIdForApi(item.productId),
      title: item.title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    createdAt: now.toISOString(),
  };
}

export async function placeOrderFromItems(
  userId: string,
  payload: {
    items: Array<{
      productId: string;
      quantity: number;
    }>;
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
    couponCode?: string;
  },
) {
  const userObjectId = toObjectId(userId);
  if (!userObjectId) {
    return null;
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return { error: "Cart items are required." as const };
  }

  const normalizedItems = payload.items
    .map((item) => ({
      productId: toObjectId(item.productId),
      quantity: Math.max(1, Math.floor(Number(item.quantity))),
    }))
    .filter((item): item is { productId: ObjectId; quantity: number } => Boolean(item.productId));

  if (normalizedItems.length === 0) {
    return { error: "Invalid cart items supplied." as const };
  }

  const mergedByProduct = new Map<string, number>();
  for (const item of normalizedItems) {
    const key = item.productId.toHexString();
    mergedByProduct.set(key, (mergedByProduct.get(key) ?? 0) + item.quantity);
  }

  const productIds = Array.from(mergedByProduct.keys()).map((id) => new ObjectId(id));
  const products = await productsCollection();
  const orders = await ordersCollection();
  const productDocs = await products.find({ _id: { $in: productIds } }).toArray();
  const productById = new Map(productDocs.map((doc) => [doc._id.toHexString(), doc]));

  const orderItems: OrderItemSnapshot[] = [];
  for (const [productId, quantity] of mergedByProduct.entries()) {
    const product = productById.get(productId);

    if (!product || product.status !== "published") {
      return { error: "One or more products are no longer available." as const };
    }

    if (product.stockQuantity < quantity) {
      return { error: `Insufficient stock for ${product.title}.` as const };
    }

    orderItems.push({
      productId: product._id,
      title: product.title,
      sku: product.sku,
      quantity,
      unitPrice: product.price,
      lineTotal: product.price * quantity,
    });
  }

  for (const item of orderItems) {
    const stockUpdate = await products.updateOne(
      {
        _id: item.productId as ObjectId,
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
      return { error: `Stock changed for ${item.title}. Please review your cart.` as const };
    }
  }

  const subtotal = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

  let couponCode: string | undefined;
  let discountAmount = 0;

  if (payload.couponCode?.trim()) {
    const couponResult = await applyCouponCode({
      code: payload.couponCode,
      subtotal,
    });

    if ("error" in couponResult) {
      return { error: couponResult.error };
    }

    couponCode = couponResult.code;
    discountAmount = couponResult.discountAmount;
  }

  const pricing = calculateCheckoutPricing({
    subtotal,
    discountAmount,
    shippingAddress: payload.shippingAddress,
  });
  const shippingCost = pricing.shippingCost;
  const taxAmount = pricing.taxAmount;
  const total = pricing.total;
  const now = new Date();

  const order = {
    orderNumber: buildOrderNumber(),
    userId: userObjectId,
    status: "processing",
    items: orderItems,
    subtotal,
    discountAmount,
    couponCode,
    shippingCost,
    taxAmount,
    total,
    shippingAddress: payload.shippingAddress,
    paymentMethod: payload.paymentMethod,
    paymentStatus: "pending",
    estimatedDelivery: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
    notes: payload.notes,
    createdAt: now,
    updatedAt: now,
  };

  const orderResult = await orders.insertOne(order as OrderDocument);

  await createNotifications([
    {
      userId: userObjectId,
      audience: "customer",
      kind: "order_created",
      title: `Order ${order.orderNumber} confirmed`,
      message: `Your order has been placed successfully. Current status: ${order.status}.`,
      metadata: {
        orderId: orderResult.insertedId.toHexString(),
        orderNumber: order.orderNumber,
      },
    },
  ]);

  if (couponCode) {
    const coupons = await couponsCollection();
    await coupons.updateOne(
      { code: couponCode },
      {
        $inc: { usedCount: 1 },
        $set: { updatedAt: new Date() },
      },
    );
  }

  return {
    orderId: orderResult.insertedId.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? 0,
    couponCode: order.couponCode ?? null,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    paymentStatus: order.paymentStatus,
    items: order.items.map((item) => ({
      productId: orderItemProductIdForApi(item.productId),
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
  const limit = Math.max(1, Math.min(options?.limit ?? 12, 50));
  const orders = await ordersCollection();

  const docs = await orders
    .find(bsonUserOwnershipFilter("userId", userId))
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

  const userIdKeys = Array.from(
    new Set(
      docs.map((order) =>
        typeof order.userId === "string" ? order.userId : order.userId.toHexString(),
      ),
    ),
  );
  const mongoUserIds = userIdKeys.filter((id) => /^[a-fA-F0-9]{24}$/.test(id)).map((id) => new ObjectId(id));
  const users = await usersCollection();
  const userDocs = mongoUserIds.length > 0 ? await users.find({ _id: { $in: mongoUserIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((user) => [user._id.toHexString(), user]));

  const prismaUserKeys = userIdKeys.filter((id) => !/^[a-fA-F0-9]{24}$/.test(id));
  const prismaUserDocs =
    prismaUserKeys.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: prismaUserKeys } },
          select: { id: true, email: true, fullName: true },
        })
      : [];
  const prismaUserMap = new Map(prismaUserDocs.map((u) => [u.id, u]));

  return docs.map((order) => {
    const key = typeof order.userId === "string" ? order.userId : order.userId.toHexString();
    const user = userMap.get(key);
    const prismaCustomer = prismaUserMap.get(key);
    return {
      id: order._id.toHexString(),
      orderNumber: order.orderNumber,
      userId: key,
      customerName: user?.fullName ?? prismaCustomer?.fullName ?? "Customer",
      customerEmail: user?.email ?? prismaCustomer?.email ?? "-",
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

  const previousStatus = existing.status;
  const previousPaymentStatus = existing.paymentStatus ?? "pending";
  const previousTrackingNumber = existing.trackingNumber ?? null;

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

  if (input.status === "cancelled" && previousStatus !== "cancelled") {
    await restockOrderItems(existing.items);
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

  const statusChanged = updated.status !== previousStatus;
  const paymentChanged = (updated.paymentStatus ?? "pending") !== previousPaymentStatus;
  const trackingChanged = (updated.trackingNumber ?? null) !== previousTrackingNumber;

  if (statusChanged || paymentChanged || trackingChanged) {
    const changes: string[] = [];

    if (statusChanged) {
      changes.push(`status: ${previousStatus} -> ${updated.status}`);
    }

    if (paymentChanged) {
      changes.push(`payment: ${previousPaymentStatus} -> ${updated.paymentStatus ?? "pending"}`);
    }

    if (trackingChanged && updated.trackingNumber) {
      changes.push(`tracking #${updated.trackingNumber}`);
    }

    await createNotifications([
      {
        userId: updated.userId,
        audience: "customer",
        kind: "order_status_updated",
        title: `Order ${updated.orderNumber} updated`,
        message: changes.join(" | "),
        metadata: {
          orderId: updated._id.toHexString(),
          orderNumber: updated.orderNumber,
        },
      },
    ]);
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
  const orderObjectId = toObjectId(orderId);
  if (!orderObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({
    _id: orderObjectId,
    ...bsonUserOwnershipFilter("userId", userId),
  });
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
    discountAmount: order.discountAmount ?? 0,
    couponCode: order.couponCode ?? null,
    shippingCost: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    items: order.items.map((item) => ({
      productId: orderItemProductIdForApi(item.productId),
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
  const orders = await ordersCollection();
  const order = await orders.findOne({
    orderNumber: orderNumber.trim(),
    ...bsonUserOwnershipFilter("userId", userId),
  });
  if (!order) {
    return null;
  }

  return {
    id: order._id.toHexString(),
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount ?? 0,
    shippingFee: order.shippingCost,
    taxAmount: order.taxAmount,
    total: order.total,
    notes: order.notes ?? "",
    couponCode: order.couponCode ?? undefined,
    trackingNumber: order.trackingNumber ?? null,
    paymentStatus: order.paymentStatus ?? "pending",
    items: order.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

export async function cancelOrderForUser(userId: string, orderId: string) {
  const orderObjectId = toObjectId(orderId);
  if (!orderObjectId) {
    return null;
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({
    _id: orderObjectId,
    ...bsonUserOwnershipFilter("userId", userId),
  });
  if (!order) {
    return null;
  }

  if (!["pending", "confirmed", "processing"].includes(order.status)) {
    return { error: "Order cannot be cancelled at this stage." as const };
  }

  await restockOrderItems(order.items);

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

export async function createReturnRequestForUser(userId: string, payload: {
  orderId: string;
  reason: string;
  notes?: string;
  resolution: "refund" | "exchange";
}) {
  const orderObjectId = toObjectId(payload.orderId);
  if (!orderObjectId) {
    return null;
  }

  const reason = payload.reason.trim();
  if (!reason) {
    return { error: "Reason is required." as const };
  }

  if (reason.length < 8) {
    return { error: "Reason must be at least 8 characters." as const };
  }

  if (reason.length > 300) {
    return { error: "Reason must be 300 characters or less." as const };
  }

  const orders = await ordersCollection();
  const order = await orders.findOne({
    _id: orderObjectId,
    ...bsonUserOwnershipFilter("userId", userId),
  });
  if (!order) {
    return { error: "Order not found." as const };
  }

  if (!order.items.length) {
    return { error: "Order has no items to return." as const };
  }

  const paymentStatus = order.paymentStatus ?? "pending";
  if (payload.resolution === "refund" && paymentStatus !== "paid") {
    return { error: "Refunds are only available for paid orders." as const };
  }

  if (order.status === "cancelled") {
    return { error: "Cancelled orders cannot be returned." as const };
  }

  if (!["delivered", "shipped"].includes(order.status)) {
    return { error: "Returns are only available for shipped or delivered orders." as const };
  }

  const normalizedNotes = payload.notes?.trim();
  if (normalizedNotes && normalizedNotes.length > 500) {
    return { error: "Notes must be 500 characters or less." as const };
  }

  const returnRequests = await returnRequestsCollection();
  const existing = await returnRequests.findOne({
    orderId: orderObjectId,
    status: { $in: ["requested", "approved", "in_transit"] },
    ...bsonUserOwnershipFilter("userId", userId),
  });

  if (existing) {
    return { error: "An active return request already exists for this order." as const };
  }

  const now = new Date();
  const returnNumber = `RET-${Date.now()}`;

  const result = await returnRequests.insertOne({
    returnNumber,
    userId: storedUserRef(userId),
    orderId: orderObjectId,
    orderNumber: order.orderNumber,
    paymentStatus,
    reason,
    notes: normalizedNotes || undefined,
    resolution: payload.resolution,
    status: "requested",
    refundStatus: payload.resolution === "refund" ? "pending" : "not_required",
    createdAt: now,
    updatedAt: now,
  } as ReturnRequestDocument);

  const created = await returnRequests.findOne({ _id: result.insertedId });
  if (!created) {
    return null;
  }

  const adminIds = await getAdminUserIds();

  const notificationsToCreate: Array<{
    userId: ObjectId | string;
    audience: "customer" | "admin";
    kind: NotificationKind;
    title: string;
    message: string;
    metadata?: Record<string, string>;
  }> = [
    {
      userId,
      audience: "customer",
      kind: "return_requested",
      title: `Return ${created.returnNumber} submitted`,
      message: `Request created for order ${created.orderNumber}. We will review it soon.`,
      metadata: {
        returnId: created._id.toHexString(),
        returnNumber: created.returnNumber,
        orderNumber: created.orderNumber,
      },
    },
  ];

  for (const adminId of adminIds) {
    notificationsToCreate.push({
      userId: adminId,
      audience: "admin",
      kind: "admin_return_requested",
      title: `New return request ${created.returnNumber}`,
      message: `Order ${created.orderNumber} requires return review.`,
      metadata: {
        returnId: created._id.toHexString(),
        returnNumber: created.returnNumber,
        orderNumber: created.orderNumber,
      },
    });
  }

  await createNotifications(notificationsToCreate);

  return {
    id: created._id.toHexString(),
    returnNumber: created.returnNumber,
    orderId: created.orderId.toHexString(),
    orderNumber: created.orderNumber,
    paymentStatus: created.paymentStatus,
    reason: created.reason,
    notes: created.notes ?? "",
    resolution: created.resolution,
    status: created.status,
    refundStatus: created.refundStatus,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function listReturnRequestsByUser(userId: string, options?: { limit?: number }) {
  const limit = Math.max(1, Math.min(options?.limit ?? 15, 50));
  const returnRequests = await returnRequestsCollection();

  const docs = await returnRequests
    .find(bsonUserOwnershipFilter("userId", userId))
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  return docs.map((item) => ({
    id: item._id.toHexString(),
    returnNumber: item.returnNumber,
    orderId: item.orderId.toHexString(),
    orderNumber: item.orderNumber,
    paymentStatus: item.paymentStatus,
    reason: item.reason,
    notes: item.notes ?? "",
    resolution: item.resolution,
    status: item.status,
    refundStatus: item.refundStatus,
    adminNote: item.adminNote ?? "",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

export async function listReturnRequestsForAdmin(options?: { limit?: number; status?: ReturnRequestStatus }) {
  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200));
  const returnRequests = await returnRequestsCollection();

  const filter: Record<string, unknown> = {};
  if (options?.status) {
    filter.status = options.status;
  }

  const docs = await returnRequests.find(filter).sort({ createdAt: -1 }).limit(limit).toArray();

  const userIdKeys = Array.from(
    new Set(docs.map((item) => (typeof item.userId === "string" ? item.userId : item.userId.toHexString()))),
  );
  const mongoUserIds = userIdKeys.filter((id) => /^[a-fA-F0-9]{24}$/.test(id)).map((id) => new ObjectId(id));
  const users = await usersCollection();
  const userDocs = mongoUserIds.length > 0 ? await users.find({ _id: { $in: mongoUserIds } }).toArray() : [];
  const userMap = new Map(userDocs.map((user) => [user._id.toHexString(), user]));

  const prismaUserKeys = userIdKeys.filter((id) => !/^[a-fA-F0-9]{24}$/.test(id));
  const prismaUserDocs =
    prismaUserKeys.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: prismaUserKeys } },
          select: { id: true, email: true, fullName: true },
        })
      : [];
  const prismaUserMap = new Map(prismaUserDocs.map((u) => [u.id, u]));

  return docs.map((item) => {
    const key = typeof item.userId === "string" ? item.userId : item.userId.toHexString();
    const user = userMap.get(key);
    const prismaCustomer = prismaUserMap.get(key);
    return {
      id: item._id.toHexString(),
      returnNumber: item.returnNumber,
      orderId: item.orderId.toHexString(),
      orderNumber: item.orderNumber,
      customerName: user?.fullName ?? prismaCustomer?.fullName ?? "Customer",
      customerEmail: user?.email ?? prismaCustomer?.email ?? "-",
      paymentStatus: item.paymentStatus,
      reason: item.reason,
      notes: item.notes ?? "",
      resolution: item.resolution,
      status: item.status,
      refundStatus: item.refundStatus,
      adminNote: item.adminNote ?? "",
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}

export async function updateReturnRequestByAdmin(input: {
  returnId: string;
  status?: ReturnRequestStatus;
  adminNote?: string;
}) {
  const returnObjectId = toObjectId(input.returnId);
  if (!returnObjectId) {
    return null;
  }

  const returnRequests = await returnRequestsCollection();
  const existing = await returnRequests.findOne({ _id: returnObjectId });
  if (!existing) {
    return null;
  }

  const previousStatus = existing.status;
  const requestedStatus = input.status;
  const trimmedAdminNote = input.adminNote?.trim();

  if (requestedStatus && requestedStatus !== previousStatus) {
    const allowed = RETURN_STATUS_TRANSITIONS[previousStatus];
    if (!allowed.includes(requestedStatus)) {
      return {
        error: `Invalid status transition: ${previousStatus} -> ${requestedStatus}.`,
      } as const;
    }
  }

  if (requestedStatus === "rejected") {
    const noteValue = trimmedAdminNote ?? existing.adminNote?.trim() ?? "";
    if (!noteValue) {
      return {
        error: "adminNote is required when rejecting a return request.",
      } as const;
    }
  }

  const updateSet: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.status) {
    updateSet.status = input.status;
  }

  if (input.status === "refunded") {
    updateSet.refundStatus = "refunded";
  } else if (input.status === "rejected" && existing.resolution === "refund") {
    updateSet.refundStatus = "failed";
  }

  if (input.adminNote !== undefined) {
    updateSet.adminNote = trimmedAdminNote || undefined;
  }

  await returnRequests.updateOne(
    { _id: returnObjectId },
    {
      $set: updateSet,
    },
  );

  const updated = await returnRequests.findOne({ _id: returnObjectId });
  if (!updated) {
    return null;
  }

  if (updated.status !== previousStatus) {
    await createNotifications([
      {
        userId: updated.userId,
        audience: "customer",
        kind: "return_status_updated",
        title: `Return ${updated.returnNumber} updated`,
        message: `Status changed: ${previousStatus} -> ${updated.status}.`,
        metadata: {
          returnId: updated._id.toHexString(),
          returnNumber: updated.returnNumber,
          orderNumber: updated.orderNumber,
        },
      },
    ]);
  }

  return {
    id: updated._id.toHexString(),
    returnNumber: updated.returnNumber,
    orderId: updated.orderId.toHexString(),
    orderNumber: updated.orderNumber,
    paymentStatus: updated.paymentStatus,
    reason: updated.reason,
    notes: updated.notes ?? "",
    resolution: updated.resolution,
    status: updated.status,
    refundStatus: updated.refundStatus,
    adminNote: updated.adminNote ?? "",
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function listWishlistForUser(userId: string) {
  const wishlist = await wishlistCollection();
  const items = await wishlist.find(bsonUserOwnershipFilter("userId", userId)).sort({ createdAt: -1 }).toArray();

  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  if (productIds.length === 0) {
    return [];
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      status: PrismaProductStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      images: true,
      categories: {
        select: {
          category: {
            select: { name: true },
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sku: true,
          title: true,
          priceInCents: true,
          compareAtPriceInCents: true,
          stockQuantity: true,
          isActive: true,
          color: true,
          size: true,
        },
      },
    },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  return items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) {
        return null;
      }

      const primaryVariant = product.variants.find((variant) => variant.isActive) ?? product.variants[0] ?? null;
      const imageArray = Array.isArray(product.images) ? product.images : [];

      return {
        id: item._id.toHexString(),
        productId: product.id,
        title: product.title,
        slug: product.slug,
        price: primaryVariant ? primaryVariant.priceInCents / 100 : 0,
        thumbnail: imageArray[0] ?? null,
        categories: product.categories.map((entry) => entry.category.name),
        createdAt: item.createdAt.toISOString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export async function isWishlistProductForUser(userId: string, productId: string) {
  const wishlist = await wishlistCollection();
  const product = await wishlist.findOne({ ...bsonUserOwnershipFilter("userId", userId), productId: productId.trim() });
  return Boolean(product);
}

export async function addWishlistItemForUser(userId: string, productId: string) {
  const wishlist = await wishlistCollection();
  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    return { error: "productId is required." as const };
  }

  const product = await prisma.product.findFirst({
    where: { id: normalizedProductId, status: PrismaProductStatus.PUBLISHED },
    select: { id: true },
  });

  if (!product) {
    return { error: "Product not found." as const };
  }

  const existing = await wishlist.findOne({ ...bsonUserOwnershipFilter("userId", userId), productId: normalizedProductId });
  if (existing) {
    return { existed: true as const };
  }

  const now = new Date();
  const result = await wishlist.insertOne({
    userId: storedUserRef(userId),
    productId: normalizedProductId,
    createdAt: now,
    updatedAt: now,
  } as WishlistItemDocument);

  return { id: result.insertedId.toHexString(), createdAt: now.toISOString() };
}

export async function removeWishlistItemForUser(userId: string, productId: string) {
  const wishlist = await wishlistCollection();
  const normalizedProductId = productId.trim();

  if (!normalizedProductId) {
    return { error: "productId is required." as const };
  }

  await wishlist.deleteOne({ ...bsonUserOwnershipFilter("userId", userId), productId: normalizedProductId });
  return { ok: true as const };
}

export async function listNotificationsByUser(
  userId: string,
  options?: { limit?: number; unreadOnly?: boolean; kind?: NotificationKind; audience?: "customer" | "admin" },
) {
  const limit = Math.max(1, Math.min(options?.limit ?? 20, 100));
  const notifications = await notificationsCollection();

  const filter: Record<string, unknown> = {
    ...bsonUserOwnershipFilter("userId", userId),
  };

  if (options?.unreadOnly) {
    filter.isRead = false;
  }

  if (options?.kind) {
    filter.kind = options.kind;
  }

  if (options?.audience) {
    filter.audience = options.audience;
  }

  const [docs, unreadCount] = await Promise.all([
    notifications.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
    notifications.countDocuments({ ...bsonUserOwnershipFilter("userId", userId), isRead: false }),
  ]);

  return {
    unreadCount,
    notifications: docs.map((item) => ({
      id: item._id.toHexString(),
      audience: item.audience,
      kind: item.kind,
      title: item.title,
      message: item.message,
      metadata: item.metadata ?? {},
      isRead: item.isRead,
      readAt: item.readAt ? item.readAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
  };
}

export async function markNotificationsReadByUser(userId: string, input?: { ids?: string[]; markAll?: boolean }) {
  const notifications = await notificationsCollection();
  const now = new Date();

  if (input?.markAll) {
    const result = await notifications.updateMany(
      { ...bsonUserOwnershipFilter("userId", userId), isRead: false },
      {
        $set: {
          isRead: true,
          readAt: now,
          updatedAt: now,
        },
      },
    );

    return { updatedCount: result.modifiedCount };
  }

  const ids = Array.isArray(input?.ids) ? input?.ids : [];
  const objectIds = ids.map((id) => toObjectId(id)).filter((id): id is ObjectId => Boolean(id));
  if (!objectIds.length) {
    return { updatedCount: 0 };
  }

  const result = await notifications.updateMany(
    {
      ...bsonUserOwnershipFilter("userId", userId),
      _id: { $in: objectIds },
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
        updatedAt: now,
      },
    },
  );

  return { updatedCount: result.modifiedCount };
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
