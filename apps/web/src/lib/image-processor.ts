// @ts-expect-error - sharp module compatibility
import sharpModule from "sharp";

const sharp = sharpModule;

// Standard product image dimensions
export const PRODUCT_IMAGE_STANDARD = {
  width: 1024,
  height: 768,
  format: "webp" as const,
} as const;

/**
 * Resize and optimize an image to standard product dimensions
 * Converts to WebP format for better compression and quality
 */
export async function resizeProductImage(buffer: Buffer): Promise<Buffer> {
  try {
    let pipeline = sharp(buffer);

    // Convert to standard size with proper aspect ratio handling
    pipeline = pipeline
      .resize(PRODUCT_IMAGE_STANDARD.width, PRODUCT_IMAGE_STANDARD.height, {
        fit: "cover", // Fills the entire space, crops if needed
        position: "center",
      })
      .webp({ quality: 85, effort: 6 });

    return await pipeline.toBuffer();
  } catch (error) {
    console.error("Image processing error:", error);
    // If processing fails, return original buffer
    return buffer;
  }
}

/**
 * Get the file extension for the standard format
 */
export function getStandardImageExtension(): string {
  return "webp";
}

/**
 * Get MIME type for the standard format
 */
export function getStandardImageMimeType(): string {
  return "image/webp";
}
