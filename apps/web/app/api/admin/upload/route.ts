import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

import { requireAdminSession } from "../../../../src/lib/admin-auth";
import { AuthError } from "../../../../src/lib/auth-session";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = "force-dynamic";

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
    // CLOUDINARY UPLOAD
    // ==========================================
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "usolstice-products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      uploadedUrls.push((result as any).secure_url);
    }

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
