import { NextResponse } from "next/server";

import { AuthError, requireAdminSession } from "../../../../src/lib/admin-auth";
import { getMongoDb } from "../../../../src/lib/mongodb";
import { sendEmail } from "../../../../src/lib/email-sender";

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(Number(limitParam ?? 10), 200));

  try {
    const db = await getMongoDb();
    const queue = db.collection("notification_email_queue");

    const items = await queue.find({ status: "pending" }).sort({ createdAt: 1 }).limit(limit).toArray();
    const results: Array<{ id: string; status: string; info?: unknown }> = [];

    for (const item of items) {
      if (!item.recipientEmail) {
        await queue.updateOne({ _id: item._id }, { $set: { status: "permanently_failed", failureReason: "Missing recipient", processedAt: new Date(), updatedAt: new Date() } });
        results.push({ id: item._id.toHexString(), status: "permanently_failed" });
        continue;
      }

      try {
        const sendResult = await sendEmail({
          to: item.recipientEmail,
          subject: item.subject,
          text: item.body,
          html: undefined,
        });

        if (sendResult.ok) {
          await queue.updateOne({ _id: item._id }, { $set: { status: "sent", processedAt: new Date(), updatedAt: new Date(), messageId: sendResult.messageId ?? null } });
          results.push({ id: item._id.toHexString(), status: "sent", info: sendResult.messageId });
        } else {
          const attempts = (item.attemptCount ?? 0) + 1;
          const nextStatus = attempts >= 3 ? "permanently_failed" : "failed";
          await queue.updateOne({ _id: item._id }, { $set: { status: nextStatus, attemptCount: attempts, failureReason: sendResult.error, processedAt: new Date(), updatedAt: new Date() } });
          results.push({ id: item._id.toHexString(), status: nextStatus, info: sendResult.error });
        }
      } catch (err) {
        const attempts = (item.attemptCount ?? 0) + 1;
        const nextStatus = attempts >= 3 ? "permanently_failed" : "failed";
        await queue.updateOne({ _id: item._id }, { $set: { status: nextStatus, attemptCount: attempts, failureReason: (err instanceof Error ? err.message : String(err)), processedAt: new Date(), updatedAt: new Date() } });
        results.push({ id: item._id.toHexString(), status: nextStatus, info: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (err) {
    console.error("Failed processing email queue:", err);
    return NextResponse.json({ error: "Failed to process queue" }, { status: 500 });
  }
}
