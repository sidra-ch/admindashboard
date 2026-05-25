import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const p = await db.permission.count();
const u = await db.user.count();
const r = await db.role.count();
console.log(`permissions: ${p}  users: ${u}  roles: ${r}`);
await db.$disconnect();
