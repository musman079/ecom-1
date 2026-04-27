import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      const status = error.message === "Forbidden" ? 403 : 401;
      return NextResponse.json({ error: error.message }, { status });
    }

    return NextResponse.json({ error: "Failed to authorize request." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const fileEntries = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const singleEntry = formData.get("file");
    const singleFile = singleEntry instanceof File && singleEntry.size > 0 ? [singleEntry] : [];
    const files = [...fileEntries, ...singleFile];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Only JPG, PNG, WEBP or GIF images are allowed." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "Each file must be 5MB or smaller." }, { status: 400 });
      }
    }

    // ==========================================
    // LOCAL STORAGE UPLOAD (CURRENTLY ACTIVE)
    // ==========================================
    
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure the upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Create a unique filename
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const originalExt = file.name.split(".").pop() || "png";
      const filename = `product-${uniqueSuffix}.${originalExt}`;
      const filePath = join(uploadDir, filename);

      // Save the file
      await writeFile(filePath, buffer);

      // The URL where the file can be accessed
      uploadedUrls.push(`/uploads/${filename}`);
    }

    // ==========================================
    // CLOUDINARY UPLOAD (FOR FUTURE USE)
    // ==========================================
    /*
    To use Cloudinary:
    1. Run: pnpm add cloudinary
    2. Import cloudinary at the top: import { v2 as cloudinary } from "cloudinary";
    3. Configure cloudinary:
       cloudinary.config({
         cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
         api_key: process.env.CLOUDINARY_API_KEY,
         api_secret: process.env.CLOUDINARY_API_SECRET
       });
    4. Replace the Local Storage code above with:
       
       const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
       const uploadResponse = await cloudinary.uploader.upload(base64Image, {
         folder: "ecommerce_products"
       });
       const fileUrl = uploadResponse.secure_url;
    */

    return NextResponse.json({
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }
}
