const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const products = await prisma.product.findMany();
  console.log('Total products:', products.length);
  console.log('');
  products.forEach(p => console.log('- ' + p.name));
  await prisma.$disconnect();
})();
