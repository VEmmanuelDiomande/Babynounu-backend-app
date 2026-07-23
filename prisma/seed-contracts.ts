import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ============================================================
//  HELPERS
// ============================================================

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pick<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateStr(daysOffset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// ============================================================
//  SEED: Contracts with proper data
// ============================================================

async function seedContractsBatch() {
  console.log('📦 Seeding Contracts (prestations)...');

  const nounouRole = await prisma.parameter.findFirst({ where: { slug: 'nounou' } });
  const parentRole = await prisma.parameter.findFirst({ where: { slug: 'parent' } });

  const nounouUsers = await prisma.user.findMany({
    where: { roleId: nounouRole?.id },
    include: { nounus: true },
  });

  const parentUsers = await prisma.user.findMany({
    where: { roleId: parentRole?.id },
    include: { parents: true },
  });

  if (nounouUsers.length === 0 || parentUsers.length === 0) {
    console.log('  ⏭️  No nounou or parent users found, skipping');
    return;
  }

  // Valid nounu/parent pairs with profiles
  const validNounus = nounouUsers.filter((u) => u.nounus.length > 0);
  const validParents = parentUsers.filter((u) => u.parents.length > 0);

  if (validNounus.length === 0 || validParents.length === 0) {
    console.log('  ⏭️  No valid nounu/parent profiles found, skipping');
    return;
  }

  let contractsCreated = 0;
  let roomsCreated = 0;
  let messagesCreated = 0;

  const descriptions = [
    'Garde enfants 3 et 5 ans — Cocody',
    'Aide ménagère + garde bébé 8 mois',
    'Sortie d\'école et garde jusqu\'à 18h',
    'Garde ponctuelle le weekend',
    'Nounou à domicile plein temps',
    'Aide ménagère 3 fois par semaine',
    'Garde de nuit pour nourrisson',
    'Cuisinière + aide à domicile',
    'Garde partagée 2 familles',
    'Aide matinale 6h-9h + sortie d\'école',
  ];

  const periodes = ['jour', 'semaine', 'mois', 'weekend'];
  const schedules = ['8h-17h', '7h-18h', '9h-16h', '6h-9h et 15h-18h', '18h-22h', 'Weekend complet'];

  // For each nounu, create 2-5 contracts with different parents
  for (const nounu of validNounus) {
    const contractCount = randomInt(2, 5);
    const parentSubset = pick(validParents, contractCount);

    for (const parent of parentSubset) {
      const nounuProfil = nounu.nounus[0];
      const parentProfil = parent.parents[0];

      // Check if room already exists between these two
      let room = await prisma.room.findFirst({
        where: {
          OR: [
            { senderId: parent.id, receiverId: nounu.id },
            { senderId: nounu.id, receiverId: parent.id },
          ],
          deletedAt: null,
        },
      });

      if (!room) {
        room = await prisma.room.create({
          data: {
            senderId: parent.id,
            receiverId: nounu.id,
            parentId: parentProfil.id,
            nounuId: nounuProfil.id,
          },
        });
        roomsCreated++;
      }

      // Check if contract already exists for this room
      const existingContract = await prisma.contract.findFirst({
        where: { roomId: room.id, deletedAt: null },
      });
      if (existingContract) continue;

      // Determine contract status and date
      // Mix of past, current, and future contracts
      const dateRange = pickOne([
        { offset: randomInt(-60, -15), status: 'Accepted' as const },   // past - completed
        { offset: randomInt(-14, -3), status: 'Accepted' as const },    // recent past
        { offset: randomInt(-2, 0), status: 'Accepted' as const },      // current
        { offset: randomInt(1, 7), status: 'Accepted' as const },       // upcoming confirmed
        { offset: randomInt(3, 14), status: 'Pending' as const },       // pending future
        { offset: randomInt(-30, -10), status: 'Canceled' as const },   // canceled past
      ]);

      const dateStr = randomDateStr(dateRange.offset);
      const montant = randomInt(50000, 250000);
      const periode = pickOne(periodes);
      const schedule = pickOne(schedules);
      const description = pickOne(descriptions);

      // Create proposition message
      const propositionContent = `Je propose ${montant} FCFA/${periode} pour ${description}. Horaire: ${schedule}.`;

      const message = await prisma.message.create({
        data: {
          content: propositionContent,
          senderId: nounu.id,
          roomId: room.id,
          type: 'Proposition',
          isProposition: true,
          propositionExpired: dateStr,
          proposalStatus: dateRange.status === 'Accepted' ? 'Accepted' : 'Pending',
          montant: montant,
          periode: periode,
          createdAt: new Date(Date.now() + dateRange.offset * 86400000 - 86400000),
        },
      });
      messagesCreated++;

      // Also create a few regular messages in the room if it's new
      if (roomsCreated > 0) {
        const baseMsgDate = new Date(Date.now() + dateRange.offset * 86400000 - 3 * 86400000);
        const regularMessages = [
          {
            content: `Bonjour, êtes-vous disponible pour ${description} ?`,
            senderId: parent.id,
            roomId: room.id,
            type: 'Message' as const,
            isRead: true,
            createdAt: baseMsgDate,
          },
          {
            content: `Bonjour ! Oui, je suis disponible. ${pickOne(['Mon tarif est de ' + montant + ' FCFA/' + periode + '.', 'Je peux commencer dès maintenant.', 'J\'ai l\'habitude avec ce type de mission.'])}`,
            senderId: nounu.id,
            roomId: room.id,
            type: 'Message' as const,
            isRead: true,
            createdAt: new Date(baseMsgDate.getTime() + 3600000),
          },
        ];

        // Only add regular messages if the room was just created
        const existingMsgCount = await prisma.message.count({ where: { roomId: room.id, isProposition: false } });
        if (existingMsgCount === 0) {
          await prisma.message.createMany({ data: regularMessages });
          messagesCreated += regularMessages.length;
        }
      }

      // Create contract
      await prisma.contract.create({
        data: {
          roomId: room.id,
          messageId: message.id,
          status: dateRange.status,
          createdAt: new Date(Date.now() + dateRange.offset * 86400000 - 2 * 86400000),
        },
      });
      contractsCreated++;
    }
  }

  console.log(`✅ ${contractsCreated} Contracts, ${roomsCreated} Rooms, ${messagesCreated} Messages created`);
}

// ============================================================
//  MAIN
// ============================================================

async function fixOldContracts() {
  console.log('🔧 Fixing old contracts (montant & dates)...');

  const oldContracts = await prisma.contract.findMany({
    where: { deletedAt: null },
    include: { message: true, room: true },
  });

  let fixed = 0;
  for (const contract of oldContracts) {
    if (!contract.message) continue;

    const needsMontant = contract.message.montant === null || contract.message.montant === undefined;
    const needsDate = !contract.message.propositionExpired || contract.message.propositionExpired === '2025-07-10';

    if (needsMontant || needsDate) {
      const montant = randomInt(50000, 200000);
      const dateOffset = pickOne([-60, -30, -14, -7, -3, 0, 3, 7, 14, 30]);
      const dateStr = randomDateStr(dateOffset);
      const periode = pickOne(['jour', 'semaine', 'mois', 'weekend']);

      await prisma.message.update({
        where: { id: contract.message.id },
        data: {
          montant: montant,
          periode: periode,
          propositionExpired: dateStr,
          proposalStatus: contract.status === 'Accepted' ? 'Accepted' : 'Pending',
        },
      });

      if (contract.status === 'Pending' && dateOffset < 0) {
        await prisma.contract.update({
          where: { id: contract.id },
          data: { status: pickOne(['Accepted', 'Canceled']) },
        });
      }
      fixed++;
    }
  }
  console.log(`✅ Fixed ${fixed} old contracts`);
}

async function main() {
  console.log('\n🌱 Starting batch seeding of Contracts (Prestations)...\n');
  await fixOldContracts();
  await seedContractsBatch();
  console.log('\n🎉 Contract seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
