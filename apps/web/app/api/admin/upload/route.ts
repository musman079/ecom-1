import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ==========================================
    // LOCAL STORAGE UPLOAD (CURRENTLY ACTIVE)
    // ==========================================
    
    const uploadDir = join(process.cwd(), "public", "uploads");

    // Ensure the upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalExt = file.name.split('.').pop() || "png";
    const filename = `product-${uniqueSuffix}.${originalExt}`;
    const filePath = join(uploadDir, filename);

    // Save the file
    await writeFile(filePath, buffer);

    // The URL where the file can be accessed
    const fileUrl = `/uploads/${filename}`;

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

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to upload file." },
      { status: 500 }
    );
  }
}
