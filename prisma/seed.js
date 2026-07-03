require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient({ adapter: { provider: 'sqlite', url: process.env.DATABASE_URL } });

async function main() {
  const org = await prisma.org.create({ data: { name: 'Example Org', plan: 'starter', planStatus: 'active' } });
  const password = await hash('password123', 10);
  const user = await prisma.user.create({ data: { orgId: org.id, name: 'Admin User', email: 'admin@example.com', role: 'admin', password } });
  console.log('Seeded:', { orgId: org.id, userId: user.id });
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
