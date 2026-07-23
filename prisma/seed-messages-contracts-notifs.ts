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

function randomDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgo));
  d.setHours(randomInt(7, 20), randomInt(0, 59), 0, 0);
  return d;
}

// ============================================================
//  DATA POOLS
// ============================================================

const parentMessages = [
  'Bonjour, êtes-vous disponible pour garder mes enfants la semaine prochaine ?',
  'J\'ai vu votre profil et j\'aimerais discuter pour une garde régulière.',
  'Bonsoir, chercherais-je une nounou pour mon bébé de 6 mois, êtes-vous disponible ?',
  'Bonjour, pouvez-vous venir faire un essai ce weekend ?',
  'Votre expérience me plaît, pourriez-vous me donner vos tarifs ?',
  'Salut, j\'ai besoin d\'une aide ménagère 3 fois par semaine, êtes-vous intéressée ?',
  'Bonjour, je recherche quelqu\'un pour la sortie d\'école de mes enfants.',
  'Est-ce que vous acceptez les gardes le soir ? J\'ai parfois des réunions tardives.',
  'Bonjour, je voudrais savoir si vous êtes disponible en août pour mes 2 enfants.',
  'Votre profil est très intéressant. Pouvez-vous me contacter pour en discuter ?',
  'Bonjour, j\'ai une annonce pour une garde à Cocody, êtes-vous dans le coin ?',
  'Salut, cherchez-vous du travail en ce moment ? J\'ai besoin d\'une nounou.',
  'Bonjour, mon enfant a 3 ans, avez-vous l\'habitude avec cet âge ?',
  'Pouvez-vous me dire si vous avez vos vaccins à jour ?',
  'Bonjour, je cherche quelqu\'un de disponible immédiatement. C\'est votre cas ?',
  'J\'aime beaucoup votre biographie. Êtes-vous disponible pour un entretien ?',
  'Bonjour, je cherche une aide pour la maison et la garde de mon fils de 5 ans.',
  'Est-ce que vous acceptez les familles nombreuses ? J\'ai 3 enfants.',
  'Bonjour, pourriez-vous faire la cuisine en plus de la garde ?',
  'Salut, je voudrais savoir si vous avez des références vérifiables.',
];

const nounouMessages = [
  'Bonjour ! Oui, je suis disponible. Pouvez-vous me donner plus de détails ?',
  'Avec plaisir ! Quel est l\'âge de vos enfants ?',
  'Bonjour, oui je suis disponible immédiatement. N\'hésitez pas à me contacter.',
  'Oui, je peux faire un essai ce weekend. Quel horaire vous convient ?',
  'Mon tarif est de 1500 FCFA/heure ou 90000 FCFA/mois. Ça vous convient ?',
  'Bonjour, oui je suis intéressée. Pouvez-vous me dire le quartier ?',
  'Oui, je fais la sortie d\'école régulièrement. Quelle école ?',
  'Oui, j\'accepte les gardes le soir jusqu\'à 22h.',
  'Bonjour, oui je suis disponible en août. Pour combien d\'enfants ?',
  'Merci ! Oui, on peut se contacter par téléphone. Voici mon numéro.',
  'Oui, je suis à Cocody. Quelle zone exactement ?',
  'Oui, je cherche du travail en ce moment. Quand auriez-vous besoin de moi ?',
  'Oui, j\'ai l\'habitude avec les enfants de 3 ans. J\'ai 5 ans d\'expérience.',
  'Oui, tous mes vaccins sont à jour. J\'ai aussi la formation premiers secours.',
  'Bonjour, oui je suis disponible dès maintenant.',
  'Avec plaisir pour un entretien. Quand seriez-vous disponible ?',
  'Bonjour, oui je peux faire la cuisine et la garde. C\'est mon domaine.',
  'Oui, j\'ai déjà travaillé avec des familles nombreuses. Pas de problème.',
  'Oui, je fais la cuisine en plus. Quels types de repas préférez-vous ?',
  'Oui, j\'ai des références vérifiables. Je peux vous les transmettre.',
];

const propositionMessages = [
  'Je propose 90000 FCFA/mois pour la garde de vos enfants. Ça vous convient ?',
  'Je propose 120000 FCFA/mois pour du lundi au vendredi, 8h-17h.',
  'Je propose 1500 FCFA/heure pour les gardes ponctuelles.',
  'Je propose 100000 FCFA/mois, du lundi au samedi. Weekends en option.',
  'Je propose 75000 FCFA/mois pour une aide ménagère 3 fois par semaine.',
  'Je propose 130000 FCFA/mois pour 2 enfants, avec cuisine et ménage inclus.',
  'Je propose 2000 FCFA/heure pour les gardes du soir et weekend.',
  'Je propose 110000 FCFA/mois pour la sortie d\'école + garde jusqu\'à 18h.',
];

const notificationTypes = [
  { type: 'new_message', title: 'Nouveau message', messages: [
    'Vous avez reçu un nouveau message',
    'Un parent vous a envoyé un message',
    'Vous avez un message non lu',
  ]},
  { type: 'job_application', title: 'Nouvelle candidature', messages: [
    'Une nounou a postulé à votre annonce',
    'Nouvelle candidature reçue pour votre annonce',
    'Quelqu\'un a postulé à votre offre',
  ]},
  { type: 'certif_update', title: 'Certification', messages: [
    'Votre certification a été approuvée !',
    'Mise à jour de votre statut de certification',
    'Votre dossier a été validé',
  ]},
  { type: 'contract_update', title: 'Contrat', messages: [
    'Un contrat a été accepté',
    'Mise à jour sur votre contrat',
    'Nouveau contrat en attente de validation',
  ]},
  { type: 'review_received', title: 'Avis', messages: [
    'Vous avez reçu un nouvel avis',
    'Un parent a laissé un commentaire sur votre profil',
    'Nouvelle évaluation reçue',
  ]},
  { type: 'subscription_expired', title: 'Abonnement', messages: [
    'Votre abonnement expire bientôt',
    'Renouvelez votre abonnement pour continuer à recevoir des demandes',
    'Rappel : votre pack Premium expire dans 3 jours',
  ]},
];

// ============================================================
//  SEED: Rooms & Messages
// ============================================================

async function seedRoomsAndMessages() {
  console.log('📦 Seeding Rooms & Messages...');

  const nounouRole = await prisma.parameter.findFirst({ where: { slug: 'nounou' } });
  const parentRole = await prisma.parameter.findFirst({ where: { slug: 'parent' } });

  const nounouUsers = await prisma.user.findMany({
    where: { roleId: nounouRole?.id },
    include: { nounus: true },
    take: 50,
  });

  const parentUsers = await prisma.user.findMany({
    where: { roleId: parentRole?.id },
    include: { parents: true },
    take: 20,
  });

  if (nounouUsers.length === 0 || parentUsers.length === 0) {
    console.log('  ⏭️  No nounou or parent users found, skipping');
    return;
  }

  let roomsCreated = 0;
  let messagesCreated = 0;
  let unreadCreated = 0;

  // Create rooms: each parent talks to 3-5 random nounus
  for (const parent of parentUsers) {
    const nounouSubset = pick(nounouUsers, randomInt(3, 5));

    for (const nounu of nounouSubset) {
      if (!parent.parents?.length || !nounu.nounus?.length) continue;

      // Check if room already exists
      const existingRoom = await prisma.room.findFirst({
        where: {
          senderId: parent.id,
          receiverId: nounu.id,
          deletedAt: null,
        },
      });

      if (existingRoom) continue;

      const room = await prisma.room.create({
        data: {
          senderId: parent.id,
          receiverId: nounu.id,
          parentId: parent.parents[0].id,
          nounuId: nounu.nounus[0].id,
        },
      });
      roomsCreated++;

      // Generate 4-10 messages per room
      const msgCount = randomInt(4, 10);
      const baseDate = randomDate(15);
      const messages: any[] = [];
      let hasProposition = false;

      for (let i = 0; i < msgCount; i++) {
        const isParentTurn = i % 2 === 0;
        const senderId = isParentTurn ? parent.id : nounu.id;
        const msgDate = new Date(baseDate);
        msgDate.setMinutes(msgDate.getMinutes() + i * randomInt(5, 30));

        // Insert a proposition around 60% of the way through
        if (i === Math.floor(msgCount * 0.6) && !hasProposition && Math.random() > 0.4) {
          const propMsg = pickOne(propositionMessages);
          const montant = randomInt(75000, 200000);
          messages.push({
            content: propMsg,
            senderId: nounu.id,
            roomId: room.id,
            type: 'Proposition',
            isProposition: true,
            propositionExpired: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            proposalStatus: pickOne(['Pending', 'Accepted', 'Pending']),
            montant: montant,
            periode: 'mois',
            createdAt: msgDate,
          });
          hasProposition = true;
        } else {
          const msgPool = isParentTurn ? parentMessages : nounouMessages;
          messages.push({
            content: pickOne(msgPool),
            senderId,
            roomId: room.id,
            type: 'Message',
            isRead: Math.random() > 0.4,
            createdAt: msgDate,
          });
        }
      }

      await prisma.message.createMany({ data: messages });
      messagesCreated += messages.length;

      // Unread counts
      const unreadForParent = messages.filter(m => m.senderId === nounu.id && !m.isRead).length;
      const unreadForNounu = messages.filter(m => m.senderId === parent.id && !m.isRead).length;

      if (unreadForParent > 0) {
        await prisma.roomUnreadCount.create({
          data: { roomId: room.id, userId: parent.id, count: unreadForParent },
        });
        unreadCreated++;
      }
      if (unreadForNounu > 0) {
        await prisma.roomUnreadCount.create({
          data: { roomId: room.id, userId: nounu.id, count: unreadForNounu },
        });
        unreadCreated++;
      }

      // Create contract if proposition was accepted
      if (hasProposition) {
        const propMsg = await prisma.message.findFirst({
          where: { roomId: room.id, isProposition: true },
          orderBy: { createdAt: 'desc' },
        });

        if (propMsg) {
          const contractStatus = pickOne(['Pending', 'Pending', 'Accepted', 'Canceled']);
          const existingContract = await prisma.contract.findFirst({
            where: { roomId: room.id },
          });

          if (!existingContract) {
            await prisma.contract.create({
              data: {
                roomId: room.id,
                messageId: propMsg.id,
                status: contractStatus,
              },
            });
          }
        }
      }
    }
  }

  console.log(`✅ ${roomsCreated} Rooms, ${messagesCreated} Messages, ${unreadCreated} UnreadCounts created`);
}

// ============================================================
//  SEED: Notifications
// ============================================================

async function seedNotifications() {
  console.log('📦 Seeding Notifications...');

  const nounouRole = await prisma.parameter.findFirst({ where: { slug: 'nounou' } });
  const parentRole = await prisma.parameter.findFirst({ where: { slug: 'parent' } });

  const nounouUsers = await prisma.user.findMany({
    where: { roleId: nounouRole?.id },
    take: 50,
  });

  const parentUsers = await prisma.user.findMany({
    where: { roleId: parentRole?.id },
    take: 20,
  });

  if (nounouUsers.length === 0 || parentUsers.length === 0) {
    console.log('  ⏭️  No nounou or parent users found, skipping');
    return;
  }

  const allUsers = [...nounouUsers, ...parentUsers];
  let count = 0;

  // 3-6 notifications per user
  for (const user of allUsers) {
    const notifCount = randomInt(3, 6);

    for (let i = 0; i < notifCount; i++) {
      const notifType = pickOne(notificationTypes);
      const sender = user.roleId === nounouRole?.id
        ? pickOne(parentUsers)
        : pickOne(nounouUsers);

      const existingNotif = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: notifType.type,
          message: pickOne(notifType.messages),
          createdAt: { gt: new Date(Date.now() - 30 * 86400000) },
        },
      });

      if (existingNotif) continue;

      await prisma.notification.create({
        data: {
          type: notifType.type,
          title: notifType.title,
          message: pickOne(notifType.messages),
          userId: user.id,
          senderId: Math.random() > 0.3 ? sender.id : null,
          isRead: Math.random() > 0.5,
          isActions: notifType.type === 'job_application' || notifType.type === 'contract_update',
          createdAt: randomDate(20),
        },
      });
      count++;
    }
  }

  console.log(`✅ ${count} Notifications created`);
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  console.log('\n🌱 Starting batch seeding of Messages, Contracts & Notifications...\n');

  await seedRoomsAndMessages();
  await seedNotifications();

  console.log('\n🎉 Batch seeding completed!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
