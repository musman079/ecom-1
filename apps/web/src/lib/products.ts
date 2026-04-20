import { ProductStatus } from "@prisma/client";

import { prisma } from "./prisma";

export type PublicSort = "newest" | "price_asc" | "price_desc" | "popular";

export type ListPublicProductsInput = {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: PublicSort;
  page?: number;
  limit?: number;
};

export type PublicProductListItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stockQuantity: number;
  inStock: boolean;
  status: "published";
  thumbnail: string | null;
  image: string | null;
  categories: string[];
};

export type PublicProductDetail = {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  inStock: boolean;
  images: string[];
  categories: string[];
  status: "published";
  variantInfo: Array<{
    id: string;
    title: string;
    sku: string;
    color: string | null;
    size: string | null;
    price: number;
    compareAtPrice?: number;
    stockQuantity: number;
    inStock: boolean;
  }>;
};

export type PublicProductsListResult = {
  products: PublicProductListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function toMoneyFromCents(value: number | null | undefined) {
  if (typeof value !== "number") {
    return undefined;
  }

  return value / 100;
}

function toShortDescription(description: string, maxLength = 120) {
  const cleaned = description.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1)}...`;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export function normalizeListPublicProductsInput(input: ListPublicProductsInput): ListPublicProductsInput {
  const page = Number.isInteger(input.page) ? Math.max(DEFAULT_PAGE, Number(input.page)) : DEFAULT_PAGE;
  const limit = Number.isInteger(input.limit)
    ? Math.min(MAX_LIMIT, Math.max(1, Number(input.limit)))
    : DEFAULT_LIMIT;

  const sort: PublicSort =
    input.sort === "price_asc" || input.sort === "price_desc" || input.sort === "popular" || input.sort === "newest"
      ? input.sort
      : "newest";

  return {
    q: normalizeText(input.q),
    category: normalizeText(input.category),
    minPrice: typeof input.minPrice === "number" ? input.minPrice : undefined,
    maxPrice: typeof input.maxPrice === "number" ? input.maxPrice : undefined,
    sort,
    page,
    limit,
  };
}

function pickPrimaryVariant(
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    priceInCents: number;
    compareAtPriceInCents: number | null;
    stockQuantity: number;
    isActive: boolean;
    color: string | null;
    size: string | null;
  }>,
) {
  return variants.find((variant) => variant.isActive) ?? variants[0] ?? null;
}

function mapListItem(product: {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categories: Array<{ category: { name: string } }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    priceInCents: number;
    compareAtPriceInCents: number | null;
    stockQuantity: number;
    isActive: boolean;
    color: string | null;
    size: string | null;
  }>;
}): PublicProductListItem {
  const primaryVariant = pickPrimaryVariant(product.variants);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    shortDescription: toShortDescription(product.description),
    price: toMoneyFromCents(primaryVariant?.priceInCents) ?? 0,
    compareAtPrice: toMoneyFromCents(primaryVariant?.compareAtPriceInCents),
    sku: primaryVariant?.sku,
    stockQuantity: primaryVariant?.stockQuantity ?? 0,
    inStock: (primaryVariant?.stockQuantity ?? 0) > 0,
    status: "published",
    thumbnail: null,
    image: null,
    categories: product.categories.map((entry) => entry.category.name),
  };
}

function mapDetail(product: {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: ProductStatus;
  categories: Array<{ category: { name: string; slug: string } }>;
  variants: Array<{
    id: string;
    sku: string;
    title: string;
    priceInCents: number;
    compareAtPriceInCents: number | null;
    stockQuantity: number;
    isActive: boolean;
    color: string | null;
    size: string | null;
  }>;
}): PublicProductDetail {
  const primaryVariant = pickPrimaryVariant(product.variants);

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: toMoneyFromCents(primaryVariant?.priceInCents) ?? 0,
    compareAtPrice: toMoneyFromCents(primaryVariant?.compareAtPriceInCents),
    sku: primaryVariant?.sku ?? "",
    stockQuantity: primaryVariant?.stockQuantity ?? 0,
    inStock: (primaryVariant?.stockQuantity ?? 0) > 0,
    images: [],
    categories: product.categories.map((entry) => entry.category.name),
    status: "published",
    variantInfo: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.priceInCents / 100,
      compareAtPrice: toMoneyFromCents(variant.compareAtPriceInCents),
      stockQuantity: variant.stockQuantity,
      inStock: variant.stockQuantity > 0,
    })),
  };
}

export async function listPublicProducts(rawInput: ListPublicProductsInput): Promise<PublicProductsListResult> {
  const input = normalizeListPublicProductsInput(rawInput);

  const variantPriceFilter = {
    isActive: true,
    ...(typeof input.minPrice === "number" ? { priceInCents: { gte: Math.round(input.minPrice * 100) } } : {}),
    ...(typeof input.maxPrice === "number"
      ? {
          priceInCents: {
            ...(typeof input.minPrice === "number" ? { gte: Math.round(input.minPrice * 100) } : {}),
            lte: Math.round(input.maxPrice * 100),
          },
        }
      : {}),
  };

  const where = {
    status: ProductStatus.PUBLISHED,
    variants: {
      some: variantPriceFilter,
    },
    ...(input.q
      ? {
          OR: [
            { title: { contains: input.q, mode: "insensitive" as const } },
            { description: { contains: input.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(input.category
      ? {
          categories: {
            some: {
              OR: [
                { category: { slug: { equals: input.category.toLowerCase() } } },
                { category: { name: { equals: input.category, mode: "insensitive" as const } } },
              ],
            },
          },
        }
      : {}),
  };

  const skip = ((input.page ?? DEFAULT_PAGE) - 1) * (input.limit ?? DEFAULT_LIMIT);
  const take = input.limit ?? DEFAULT_LIMIT;
  const needsManualSort = input.sort === "price_asc" || input.sort === "price_desc";

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      ...(needsManualSort ? {} : { skip, take }),
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        status: true,
        categories: {
          select: {
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "asc",
          },
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
    }),
    prisma.product.count({ where }),
  ]);

  const mappedProducts = products.map(mapListItem);
  const sortedProducts =
    input.sort === "price_asc"
      ? mappedProducts.sort((a, b) => a.price - b.price)
      : input.sort === "price_desc"
        ? mappedProducts.sort((a, b) => b.price - a.price)
        : mappedProducts;

  const paginatedProducts = needsManualSort ? sortedProducts.slice(skip, skip + take) : sortedProducts;

  const totalPages = total === 0 ? 1 : Math.ceil(total / take);

  return {
    products: paginatedProducts,
    meta: {
      page: input.page ?? DEFAULT_PAGE,
      limit: take,
      total,
      totalPages,
      hasNextPage: (input.page ?? DEFAULT_PAGE) < totalPages,
      hasPrevPage: (input.page ?? DEFAULT_PAGE) > 1,
    },
  };
}

export async function getPublicProductByIdOrSlug(value: string): Promise<PublicProductDetail | null> {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const byIdOrSlug = await prisma.product.findFirst({
    where: {
      status: ProductStatus.PUBLISHED,
      variants: {
        some: {
          isActive: true,
        },
      },
      OR: [{ id: normalized }, { slug: normalized.toLowerCase() }],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      status: true,
      categories: {
        select: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      },
      variants: {
        where: {
          isActive: true,
        },
        orderBy: {
          createdAt: "asc",
        },
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

  return byIdOrSlug ? mapDetail(byIdOrSlug) : null;
}
