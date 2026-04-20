import { ProductStatus as PrismaProductStatus } from "@prisma/client";

import { prisma } from "./prisma";

export type ProductStatus = "draft" | "published";

export type AdminProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  taxCategory: string;
  collection: string;
  sku: string;
  stockQuantity: number;
  lowStockAlert: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductInput = {
  title: string;
  description: string;
  price: number;
  taxCategory: string;
  collection: string;
  sku: string;
  stockQuantity: number;
  lowStockAlert: boolean;
  status: ProductStatus;
};

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

export class ProductConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductConflictError";
  }
}

const DEFAULT_TAX_CATEGORY = "Standard Goods (20%)";
const DEFAULT_COLLECTION = "FW24 Editorial";

function toAdminStatus(status: PrismaProductStatus): ProductStatus {
  return status === PrismaProductStatus.PUBLISHED ? "published" : "draft";
}

function toPrismaStatus(status: ProductStatus): PrismaProductStatus {
  return status === "published" ? PrismaProductStatus.PUBLISHED : PrismaProductStatus.DRAFT;
}

function mapProduct(document: {
  id: string;
  title: string;
  description: string;
  status: PrismaProductStatus;
  taxCategory?: string | null;
  collection?: string | null;
  lowStockAlert?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{
    sku: string;
    priceInCents: number;
    stockQuantity: number;
  }>;
}): AdminProduct {
  const primaryVariant =
    document.variants[0] ??
    ({
      sku: "",
      priceInCents: 0,
      stockQuantity: 0,
    } as const);

  return {
    id: document.id,
    title: document.title,
    description: document.description,
    price: primaryVariant.priceInCents / 100,
    taxCategory: document.taxCategory || DEFAULT_TAX_CATEGORY,
    collection: document.collection || DEFAULT_COLLECTION,
    sku: primaryVariant.sku,
    stockQuantity: primaryVariant.stockQuantity,
    lowStockAlert: document.lowStockAlert ?? false,
    status: toAdminStatus(document.status),
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  };
}

function normalizeSku(sku: string) {
  return sku.trim().toLowerCase();
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "product";
}

async function createUniqueSlug(title: string) {
  const base = slugify(title);
  let candidate = base;
  let attempt = 1;

  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}-${attempt}`;
  }
}

async function ensureSkuUnique(sku: string, excludedVariantId?: string) {
  const normalized = normalizeSku(sku);
  const existingVariants = await prisma.productVariant.findMany({
    select: {
      id: true,
      sku: true,
    },
  });

  const conflict = existingVariants.find((variant) => {
    if (excludedVariantId && variant.id === excludedVariantId) {
      return false;
    }

    return normalizeSku(variant.sku) === normalized;
  });

  if (conflict) {
    throw new ProductConflictError("A product with this SKU already exists.");
  }
}

function validateProductInput(input: ProductInput) {
  if (!input.title.trim()) {
    throw new ProductValidationError("Title is required.");
  }

  if (!input.description.trim()) {
    throw new ProductValidationError("Description is required.");
  }

  if (!input.sku.trim()) {
    throw new ProductValidationError("SKU is required.");
  }

  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new ProductValidationError("Price must be a valid non-negative number.");
  }

  if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
    throw new ProductValidationError("Stock quantity must be a valid non-negative integer.");
  }
}

export async function listAdminProducts() {
  const items = await prisma.product.findMany({
    include: {
      variants: {
        select: {
          sku: true,
          priceInCents: true,
          stockQuantity: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return items.map(mapProduct);
}

export async function getAdminProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        select: {
          sku: true,
          priceInCents: true,
          stockQuantity: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return product ? mapProduct(product) : null;
}

export async function createAdminProduct(input: ProductInput) {
  validateProductInput(input);

  const title = input.title.trim();
  const description = input.description.trim();
  const sku = input.sku.trim();
  const taxCategory = input.taxCategory.trim() || DEFAULT_TAX_CATEGORY;
  const collection = input.collection.trim() || DEFAULT_COLLECTION;

  await ensureSkuUnique(sku);

  const slug = await createUniqueSlug(title);
  const created = await prisma.product.create({
    data: {
      title,
      slug,
      description,
      status: toPrismaStatus(input.status),
      taxCategory,
      collection,
      lowStockAlert: input.lowStockAlert,
      variants: {
        create: [
          {
            sku,
            title,
            priceInCents: Math.round(input.price * 100),
            stockQuantity: input.stockQuantity,
            isActive: true,
          },
        ],
      },
    },
    include: {
      variants: {
        select: {
          sku: true,
          priceInCents: true,
          stockQuantity: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  return mapProduct(created);
}

export async function updateAdminProduct(id: string, input: ProductInput) {
  const existing = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        select: {
          id: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!existing) {
    return null;
  }

  validateProductInput(input);

  const primaryVariantId = existing.variants[0]?.id;
  await ensureSkuUnique(input.sku, primaryVariantId);

  const title = input.title.trim();
  const description = input.description.trim();
  const sku = input.sku.trim();
  const taxCategory = input.taxCategory.trim() || DEFAULT_TAX_CATEGORY;
  const collection = input.collection.trim() || DEFAULT_COLLECTION;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        title,
        description,
        status: toPrismaStatus(input.status),
        taxCategory,
        collection,
        lowStockAlert: input.lowStockAlert,
      },
    });

    if (primaryVariantId) {
      await tx.productVariant.update({
        where: { id: primaryVariantId },
        data: {
          sku,
          title,
          priceInCents: Math.round(input.price * 100),
          stockQuantity: input.stockQuantity,
          isActive: true,
        },
      });
    } else {
      await tx.productVariant.create({
        data: {
          productId: id,
          sku,
          title,
          priceInCents: Math.round(input.price * 100),
          stockQuantity: input.stockQuantity,
          isActive: true,
        },
      });
    }

    return tx.product.findUnique({
      where: { id },
      include: {
        variants: {
          select: {
            sku: true,
            priceInCents: true,
            stockQuantity: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  });

  return updated ? mapProduct(updated) : null;
}

export async function deleteAdminProduct(id: string) {
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.product.delete({
    where: { id },
  });

  return true;
}
