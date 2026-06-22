import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getMongoDb } from "../../../../src/lib/mongodb";
import { sendEmail } from "../../../../src/lib/email-sender";

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email: string };
    
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const db = await getMongoDb();
    const normalizedEmail = email.toLowerCase().trim();
    
    const user = await db.collection("users").findOne({ email: normalizedEmail });
    
    if (user) {
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      
      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            resetToken, 
            resetTokenExpiry,
            updatedAt: new Date()
          } 
        }
      );
      
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
      
      await sendEmail({
        to: user.email,
        subject: "USolstice - Reset Your Password",
        text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email. This link will expire in 1 hour.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #050505; color: #fff; padding: 40px;">
            <h1 style="color: #C8A96E; font-size: 24px; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; margin-bottom: 30px;">USolstice</h1>
            <h2 style="font-size: 18px; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="color: #ccc; line-height: 1.6; margin-bottom: 30px;">We received a request to reset your password. Click the button below to choose a new password.</p>
            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${resetUrl}" style="background-color: #C8A96E; color: #050505; text-decoration: none; padding: 14px 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.</p>
          </div>
        `
      });
    }

    // Always return success even if user not found (security best practice)
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to process request." }, { status: 500 });
  }
}
