import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const products = await prisma.product.findMany();
console.log('Total products in database:', products.length);
console.log('');
console.log('Product details:');
products.forEach(p => console.log(JSON.stringify(p, null, 2)));
await prisma.$disconnect();
