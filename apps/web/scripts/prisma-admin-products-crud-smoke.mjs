import { PrismaClient, ProductStatus } from "@prisma/client";

const ts = Date.now();
const sku = `CRUD-TEST-${ts}`;
const slug = `crud-test-${ts}`;

async function run() {
  const p1 = new PrismaClient();
  const created = await p1.product.create({
    data: {
      title: "CRUD Test Product",
      slug,
      description: "temporary test product",
      taxCategory: "Standard Goods (20%)",
      collection: "Test",
      lowStockAlert: false,
      status: ProductStatus.DRAFT,
      variants: {
        create: {
          sku,
          title: "CRUD Test Product",
          priceInCents: 12345,
          stockQuantity: 7,
          isActive: true,
        },
      },
    },
    include: {
      variants: true,
    },
  });
  await p1.$disconnect();

  const p2 = new PrismaClient();
  const foundAfterReconnect = await p2.product.findUnique({
    where: { id: created.id },
    include: { variants: true },
  });

  if (!foundAfterReconnect || foundAfterReconnect.variants.length === 0) {
    await p2.$disconnect();
    throw new Error("Created product not found after reconnect.");
  }

  await p2.productVariant.update({
    where: { id: foundAfterReconnect.variants[0].id },
    data: { stockQuantity: 11 },
  });
  await p2.$disconnect();

  const p3 = new PrismaClient();
  const updated = await p3.product.findUnique({
    where: { id: created.id },
    include: { variants: true },
  });

  await p3.product.delete({ where: { id: created.id } });
  const deletedCheck = await p3.product.findUnique({
    where: { id: created.id },
    select: { id: true },
  });
  await p3.$disconnect();

  console.log(
    JSON.stringify(
      {
        createdId: created.id,
        sku,
        persistedAcrossReconnect: Boolean(foundAfterReconnect?.id),
        updatedStock: updated?.variants?.[0]?.stockQuantity ?? null,
        deleted: deletedCheck === null,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error("CRUD smoke test failed.");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
});
