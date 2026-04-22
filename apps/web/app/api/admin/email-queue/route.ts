/**
 * GET /api/admin/email-queue
 * Inspect the notification email queue (admin only).
 * Query params: status (pending|sent|failed|permanently_failed), limit
 */
import { NextResponse } from "next/server";

import { AuthError, requireAdminSession } from "../../../../src/lib/admin-auth";
import { getMongoDb } from "../../../../src/lib/mongodb";

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const limitParam = url.searchParams.get("limit");
  const limit = Math.max(1, Math.min(Number(limitParam ?? 50), 200));

  const validStatuses = ["pending", "sent", "failed", "permanently_failed"];
  const filterStatus = validStatuses.includes(statusParam ?? "") ? statusParam : null;

  try {
    const db = await getMongoDb();
    const queue = db.collection("notification_email_queue");

    const filter: Record<string, unknown> = {};
    if (filterStatus) {
      filter.status = filterStatus;
    }

    const [items, counts] = await Promise.all([
      queue.find(filter).sort({ createdAt: -1 }).limit(limit).toArray(),
      queue
        .aggregate<{ _id: string; count: number }>([{ $group: { _id: "$status", count: { $sum: 1 } } }])
        .toArray(),
    ]);

    const statusCounts: Record<string, number> = {
      pending: 0,
      sent: 0,
      failed: 0,
      permanently_failed: 0,
    };
    for (const row of counts) {
      if (row._id) statusCounts[row._id] = row.count;
    }

    return NextResponse.json({
      statusCounts,
      items: items.map((item) => ({
        id: item._id.toHexString(),
        kind: item.kind,
        subject: item.subject,
        recipientEmail: item.recipientEmail ?? null,
        status: item.status,
        attemptCount: item.attemptCount ?? 0,
        failureReason: item.failureReason ?? null,
        processedAt: item.processedAt ? (item.processedAt as Date).toISOString() : null,
        createdAt: (item.createdAt as Date).toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch email queue." }, { status: 500 });
  }
}
