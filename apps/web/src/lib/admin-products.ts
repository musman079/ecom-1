import { ObjectId } from "mongodb";

import { getMongoDb } from "./mongodb";

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

type ProductDocument = {
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

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  return new ObjectId(id);
}

function mapProduct(document: ProductDocument): AdminProduct {
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

async function productsCollection() {
  const db = await getMongoDb();
  return db.collection<ProductDocument>("products");
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
  const products = await productsCollection();
  const items = await products.find({}).sort({ createdAt: -1 }).toArray();
  return items.map(mapProduct);
}

export async function getAdminProductById(id: string) {
  const products = await productsCollection();
  const objectId = toObjectId(id);
  if (!objectId) {
    return null;
  }

  const product = await products.findOne({ _id: objectId });
  return product ? mapProduct(product) : null;
}

export async function createAdminProduct(input: ProductInput) {
  const now = new Date();
  const products = await productsCollection();

  validateProductInput(input);

  const normalizedSku = input.sku.trim().toLowerCase();
  const skuExists = await products.findOne({ sku: { $regex: new RegExp(`^${normalizedSku}$`, "i") } });
  if (skuExists) {
    throw new ProductValidationError("A product with this SKU already exists.");
  }

  const product = {
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

  const created = await products.insertOne(product as ProductDocument);
  const inserted = await products.findOne({ _id: created.insertedId });

  if (!inserted) {
    throw new ProductValidationError("Product could not be created.");
  }

  return mapProduct(inserted);
}

export async function updateAdminProduct(id: string, input: ProductInput) {
  const products = await productsCollection();
  const objectId = toObjectId(id);

  if (!objectId) {
    return null;
  }

  const existing = await products.findOne({ _id: objectId });
  if (!existing) {
    return null;
  }

  validateProductInput(input);

  const normalizedSku = input.sku.trim().toLowerCase();
  const conflictingSku = await products.findOne({
    _id: { $ne: objectId },
    sku: { $regex: new RegExp(`^${normalizedSku}$`, "i") },
  });
  if (conflictingSku) {
    throw new ProductValidationError("A product with this SKU already exists.");
  }

  await products.updateOne(
    { _id: objectId },
    {
      $set: {
        title: input.title.trim(),
        description: input.description.trim(),
        price: input.price,
        taxCategory: input.taxCategory.trim(),
        collection: input.collection.trim(),
        sku: input.sku.trim(),
        stockQuantity: input.stockQuantity,
        lowStockAlert: input.lowStockAlert,
        status: input.status,
        updatedAt: new Date(),
      },
    },
  );

  const updated = await products.findOne({ _id: objectId });
  return updated ? mapProduct(updated) : null;
}

export async function deleteAdminProduct(id: string) {
  const products = await productsCollection();
  const objectId = toObjectId(id);
  if (!objectId) {
    return false;
  }

  const deleted = await products.deleteOne({ _id: objectId });
  return deleted.deletedCount > 0;
}
