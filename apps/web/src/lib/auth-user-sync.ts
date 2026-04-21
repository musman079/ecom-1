import { ObjectId, type OptionalId } from "mongodb";

import { getMongoDb } from "./mongodb";

export async function ensureMongoCustomerUser(input: {
  email: string;
  fullName: string;
  phone: string | null;
  passwordHash: string;
  isActive: boolean;
}) {
  const db = await getMongoDb();
  type MongoAuthUser = {
    _id: ObjectId;
    email: string;
    fullName: string;
    phone?: string;
    passwordHash: string;
    roles?: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  const users = db.collection<OptionalId<MongoAuthUser>>("users");

  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date();

  const existing = await users.findOne({ email: normalizedEmail });
  if (existing) {
    const currentRoles = Array.isArray(existing.roles) ? existing.roles : [];
    const mergedRoles = Array.from(new Set([...currentRoles, "CUSTOMER"]));

    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          fullName: input.fullName,
          phone: input.phone ?? undefined,
          passwordHash: input.passwordHash,
          roles: mergedRoles,
          isActive: input.isActive,
          updatedAt: now,
        },
      },
    );

    return {
      mongoUserId: existing._id.toHexString(),
      roles: mergedRoles,
    };
  }

  const insertResult = await users.insertOne({
    email: normalizedEmail,
    fullName: input.fullName,
    phone: input.phone ?? undefined,
    passwordHash: input.passwordHash,
    roles: ["CUSTOMER"],
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  });

  return {
    mongoUserId: insertResult.insertedId.toHexString(),
    roles: ["CUSTOMER"],
  };
}
