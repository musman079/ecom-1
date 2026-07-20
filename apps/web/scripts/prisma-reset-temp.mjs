import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.cartItem.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.productCategory.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  console.log('Deleted all products and related records.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
