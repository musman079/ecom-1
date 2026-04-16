import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

type ProductStore = {
  products: AdminProduct[];
};

const dataDirectory = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDirectory, "admin-products.json");

async function ensureStoreFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFilePath, "utf8");
  } catch {
    const seedStore: ProductStore = { products: [] };
    await writeFile(dataFilePath, JSON.stringify(seedStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<ProductStore> {
  await ensureStoreFile();

  const raw = await readFile(dataFilePath, "utf8");
  let parsed: Partial<ProductStore>;

  try {
    parsed = JSON.parse(raw) as Partial<ProductStore>;
  } catch {
    parsed = { products: [] };
  }

  return {
    products: Array.isArray(parsed.products) ? parsed.products : [],
  };
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

async function writeStore(store: ProductStore) {
  await ensureStoreFile();
  await writeFile(dataFilePath, JSON.stringify(store, null, 2), "utf8");
}

export async function listAdminProducts() {
  const store = await readStore();
  return store.products.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getAdminProductById(id: string) {
  const store = await readStore();
  return store.products.find((product) => product.id === id) ?? null;
}

export async function createAdminProduct(input: ProductInput) {
  const now = new Date().toISOString();
  const store = await readStore();

  validateProductInput(input);

  const normalizedSku = input.sku.trim().toLowerCase();
  const skuExists = store.products.some((product) => product.sku.trim().toLowerCase() === normalizedSku);
  if (skuExists) {
    throw new ProductValidationError("A product with this SKU already exists.");
  }

  const product: AdminProduct = {
    id: randomUUID(),
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    taxCategory: input.taxCategory.trim(),
    collection: input.collection.trim(),
    sku: input.sku.trim(),
    stockQuantity: input.stockQuantity,
    lowStockAlert: input.lowStockAlert,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  };

  store.products.unshift(product);
  await writeStore(store);

  return product;
}

export async function updateAdminProduct(id: string, input: ProductInput) {
  const store = await readStore();
  const index = store.products.findIndex((product) => product.id === id);

  if (index < 0) {
    return null;
  }

  const existing = store.products[index];
  if (!existing) {
    return null;
  }

  validateProductInput(input);

  const normalizedSku = input.sku.trim().toLowerCase();
  const conflictingSku = store.products.some(
    (product) => product.id !== id && product.sku.trim().toLowerCase() === normalizedSku,
  );
  if (conflictingSku) {
    throw new ProductValidationError("A product with this SKU already exists.");
  }

  const updated: AdminProduct = {
    ...existing,
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    taxCategory: input.taxCategory.trim(),
    collection: input.collection.trim(),
    sku: input.sku.trim(),
    stockQuantity: input.stockQuantity,
    lowStockAlert: input.lowStockAlert,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };

  store.products[index] = updated;
  await writeStore(store);

  return updated;
}

export async function deleteAdminProduct(id: string) {
  const store = await readStore();
  const previousCount = store.products.length;
  store.products = store.products.filter((product) => product.id !== id);

  if (store.products.length === previousCount) {
    return false;
  }

  await writeStore(store);
  return true;
}
