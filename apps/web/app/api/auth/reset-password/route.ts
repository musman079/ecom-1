import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getMongoDb } from "../../../../src/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { token, password } = (await request.json()) as { token: string; password?: string };
    
    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Valid token and a password of at least 6 characters are required." }, 
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    
    // Find user with this token and ensure token hasn't expired
    const user = await db.collection("users").findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token." }, 
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hash(password, 10);
    
    // Update the user document
    await db.collection("users").updateOne(
      { _id: user._id },
      { 
        $set: { 
          passwordHash, 
          updatedAt: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: ""
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
