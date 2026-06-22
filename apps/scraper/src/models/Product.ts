import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string | null;
  title: string;
  brand: string;
  url: string;
  images: string[];
  price: number;
  discount_price: number | null;
  in_stock: boolean;
  description: string;
  
  // Scraped Attributes
  stitch_type: 'stitched' | 'unstitched' | null;
  pieces: 1 | 2 | 3 | 4 | null;
  design_type: 'embroidered' | 'printed' | null;
  fabric: string | null;
  season: string | null;
  category: string | null;
  occasion: string | null;

  // Metadata
  is_valid: boolean; // false if sku or required fields are missing
  created_at: Date;
  updated_at: Date;
}

const ProductSchema: Schema = new Schema({
  sku: { type: String, default: null }, // Nullable if couldn't resolve
  title: { type: String, required: true },
  brand: { type: String, required: true },
  url: { type: String, required: true },
  images: { type: [String], default: [] },
  price: { type: Number, required: true },
  discount_price: { type: Number, default: null },
  in_stock: { type: Boolean, default: true },
  description: { type: String, default: '' },
  
  stitch_type: { type: String, enum: ['stitched', 'unstitched', null], default: null },
  pieces: { type: Number, enum: [1, 2, 3, 4, null], default: null },
  design_type: { type: String, enum: ['embroidered', 'printed', null], default: null },
  fabric: { type: String, default: null },
  season: { type: String, default: null },
  category: { type: String, default: null },
  occasion: { type: String, default: null },

  is_valid: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// We want SKU to be unique but allow multiple nulls
ProductSchema.index({ sku: 1, brand: 1 }, { unique: true, partialFilterExpression: { sku: { $type: "string" } } });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
