import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: 'aicha.kone@babynounu.com' },
    include: { nounus: true },
  });

  if (!u) {
    console.log('User NOT FOUND');
    return;
  }

  console.log('User ID:', u.id);
  console.log('Nounu profiles:', u.nounus.length);

  const rooms = await prisma.room.findMany({
    where: { OR: [{ senderId: u.id }, { receiverId: u.id }], deletedAt: null },
    include: { contracts: { include: { message: true } } },
  });

  console.log('Rooms:', rooms.length);
  console.log('Contracts:', rooms.reduce((s, r) => s + r.contracts.length, 0));

  for (const r of rooms) {
    for (const c of r.contracts) {
      console.log(`  Contract #${c.id} status=${c.status} montant=${c.message?.montant} date=${c.message?.propositionExpired}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
