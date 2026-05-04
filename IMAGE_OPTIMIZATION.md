# Product Image Optimization Guide

## Overview
Product images are automatically resized and optimized when uploaded through the admin panel. All images are converted to a standard size for consistency and better performance.

## Current Configuration

**Standard Product Image Dimensions:**
- **Width:** 1024px
- **Height:** 768px  
- **Aspect Ratio:** 4:3
- **Format:** WebP
- **Quality:** 85 (high quality with good compression)
- **Effort:** 6 (optimization level)

## How It Works

1. **Upload Flow:**
   - Admin uploads an image via `/admin_post_edit_product` page or `/admin_products` page
   - Image is sent to `/api/admin/upload` endpoint as FormData

2. **Processing:**
   - Image is received and converted to Buffer
   - Sharp library resizes the image to 1024x768
   - Image is converted to WebP format with quality 85
   - Optimization effort is set to 6 for best compression

3. **Storage:**
   - Resized image is saved to `public/uploads/` directory
   - Filename format: `product-[timestamp]-[random].webp`
   - URL returned: `/uploads/product-[timestamp]-[random].webp`

4. **Benefits:**
   - **Consistency:** All product images have the same dimensions
   - **Performance:** WebP format reduces file size by ~30-50% vs JPG
   - **Quality:** Quality 85 maintains visual fidelity while reducing size
   - **Fit:** "cover" fit mode with center positioning ensures no empty space

## Customizing Image Settings

To modify image dimensions or quality, edit `src/lib/image-processor.ts`:

```typescript
export const PRODUCT_IMAGE_STANDARD = {
  width: 1024,      // Change width
  height: 768,      // Change height
  format: "webp" as const,
};
```

In the `resizeProductImage` function:
```typescript
.webp({ 
  quality: 85,      // Change quality (1-100)
  effort: 6         // Change effort (1-9, higher = slower but better compression)
})
```

## Supported Input Formats
The upload endpoint accepts:
- JPG/JPEG
- PNG
- WebP
- GIF

Maximum file size: 5MB

## File Size Impact

Typical image size reduction:
- **Original JPG (1-3MB)** → **Optimized WebP (150-300KB)**
- **Original PNG (2-5MB)** → **Optimized WebP (200-400KB)**

## Future Enhancements

Possible improvements to consider:
1. Generate multiple sizes (thumbnail, detail view, etc.)
2. Add AVIF format support for even better compression
3. Implement CDN integration (Cloudinary, CloudFlare Images)
4. Add image cropping/transformation UI
5. Lazy load images with LQIP (Low Quality Image Placeholder)

## Troubleshooting

**Images not uploading?**
- Check file size is under 5MB
- Ensure file format is JPG, PNG, WebP, or GIF
- Check admin authentication

**Slow uploads?**
- Effort level (6) may be high for very large uploads
- Consider reducing to 4-5 for faster processing

**Image quality issues?**
- Adjust quality setting (increase from 85 to 90 for better quality)
- Be aware: higher quality = larger file size
