import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import slugify from 'slugify';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ============================================================
//  HELPERS
// ============================================================

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

function makeSlug(text: string): string {
  return slugify(text, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 8);
}

async function getParamBySlug(slug: string) {
  return prisma.parameter.findFirst({ where: { slug } });
}

function pick<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

function pickOne<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 2) / 2;
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    if (fs.existsSync(destPath)) return true;
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    fs.writeFileSync(destPath, response.data);
    return true;
  } catch {
    return false;
  }
}

// ============================================================
//  DATA POOLS
// ============================================================

const firstNames = [
  'Aïcha', 'Fatou', 'Mariam', 'Adjoua', 'Awa', 'Grace', 'Salimata', 'Brigitte',
  'Akissi', 'Aminata', 'Awa', 'Bintou', 'Comfora', 'Coumba', 'Djeneba', 'Fanta',
  'Hawa', 'Kadidja', 'Kadiatou', 'Koffi', 'Larissa', 'Madelaine', 'Maimouna',
  'Mariame', 'Nadège', 'Nadine', 'Nguessan', 'Odette', 'Pascale', 'Rokia',
  'Salimata', 'Saratou', 'Siaka', 'Solange', 'Tanou', 'Tchimou', 'Yasmine',
  'Yeo', 'Zalika', 'Zoumba', 'Adjoa', 'Affoué', 'Ahou', 'Aké', 'Aya', 'Cécile',
  'Christelle', 'Claudine', 'Comfort', 'Désirée', 'Edwige', 'Eliane', 'Emmanuelle',
  'Estelle', 'Flore', 'Francine', 'Gisèle', 'Gloria', 'Hélène', 'Irène',
  'Jeanne', 'Josiane', 'Julienne', 'Justine', 'Léa', 'Lucie', 'Madeleine',
  'Marguerite', 'Marie', 'Martine', 'Monique', 'Murielle', 'Nadège', 'Nathalie',
  'Nicole', 'Olivier', 'Patricia', 'Pauline', 'Prisca', 'Rachelle', 'Reine',
  'Rosalie', 'Sabine', 'Sandra', 'Sylvie', 'Thérèse', 'Valérie', 'Véronique',
  'Victoire', 'Yolande', 'Aminata', 'Bassiratou', 'Diaratou', 'Hadjara',
  'Kadiatou', 'Mamounata', 'Nimatou', 'Rokiatou', 'Safiatou', 'Tenin',
];

const lastNames = [
  'Koné', 'Diabaté', 'Traoré', 'Kouassi', 'Bamba', 'Cissé', 'Koffi', 'Aya',
  'Brou', 'Yao', 'Nguessan', 'Diomandé', 'Touré', 'Sangaré', 'Kouamé',
  'Doumbia', 'Coulibaly', 'Diallo', 'Bakayoko', 'Soro', 'Tiémoko', 'Yéo',
  'Zadi', 'Kouadio', 'Aka', 'Assemian', 'Brou', 'Dadié', 'Essis', 'Fofana',
  'Gnagne', 'Gbagbo', 'Guéi', 'Konan', 'Koulibaly', 'Méné', 'Nguessan',
  'Ngoran', 'Ouattara', 'Sangaré', 'Sylla', 'Tano', 'Touré', 'Yapi',
  'Zebi', 'Adou', 'Affé', 'Ahoussé', 'Aké', 'Assoh', 'Bakary', 'Bamba',
  'Bangoura', 'Barry', 'Cissé', 'Dabila', 'Dakia', 'Dassi', 'Diakité',
  'Diarra', 'Diby', 'Djédjé', 'Djigbéré', 'Drogba', 'Fofana', 'Gbagbo',
  'Gnagne', 'Gnammi', 'Gueï', 'Irié', 'Kaboré', 'Kamagaté', 'Karamoko',
  'Koffi', 'Kokoré', 'Komla', 'Konan', 'Kouadio', 'Kouakou', 'Kouamé',
  'Kouassi', 'Krou', 'Lago', 'Lougué', 'Méné', 'Mabiala', 'Mahoua',
  'Nguessan', 'Ngoran', 'Nguessan', 'Niamké', 'Ouattara', 'Oulai',
  'Sangaré', 'Sawadogo', 'Soro', 'Séri', 'Tano', 'Tiémoko', 'Touré',
  'Yapi', 'Yéo', 'Zadi', 'Zebi', 'Zoumba',
];

const communes = ['cocody', 'plateau', 'marcory', 'yopougon', 'abobo', 'treichville', 'koumassi', 'adjame', 'port-bouet', 'bingerville'];

const biographies = [
  "Nounou expérimentée et passionnée, j'adore travailler avec les enfants et organiser des activités éducatives.",
  "Aide ménagère sérieuse et rigoureuse, je garantis un environnement propre et sain pour votre famille.",
  "Nounou diplômée avec plusieurs années d'expérience dans la garde d'enfants de tous âges.",
  "Jeune femme dynamique et patiente, je propose mes services pour la garde de vos enfants.",
  "Professionnelle de la petite enfance, je m'occupe des enfants avec amour et attention.",
  "Cuisinière et aide ménagère, je prépare des repas équilibrés et entretiens votre maison.",
  "Nounou certifiée aux premiers secours, disponible pour des gardes régulières ou ponctuelles.",
  "Maman expérimentée, je mets mon savoir-faire au service de votre famille.",
  "Aide ménagère dévouée, ponctuelle et discrète. Maison impeccable garantie.",
  "Nounou patiente et créative, j'organise des activités ludiques et éducatives pour les enfants.",
  "Femme de confiance avec 10 ans d'expérience dans la garde d'enfants et l'entretien de la maison.",
  "Passionnée par les enfants, je propose un accompagnement bienveillant et éducatif.",
  "Aide à domicile polyvalente, je gère la maison et m'occupe des enfants avec professionnalisme.",
  "Nounou expérimentée spécialisée dans les nourrissons et jeunes enfants.",
  "Travailleuse acharnée, je garantis satisfaction dans l'entretien de votre domicile.",
];

const horaireSlugs = ['plein-temps', 'demi-journee', 'soiree', 'nuit', 'weekend'];
const zoneSlugs = communes;
const serviceSlugs = ['garde-enfants', 'aide-menagere', 'cuisine'];
const trancheSlugs = ['0-1-an', '1-3-ans', '3-6-ans', '6-12-ans'];
const langueSlugs = ['francais', 'anglais', 'dioula', 'baoule', 'bete'];
const frequenceSlugs = ['quotidien', 'hebdomadaire', 'occasionnel'];
const dispoSlugs = ['immediate', 'sous-1-semaine', 'sous-2-semaines', 'a-convenir'];
const competenceSlugs = ['premiers-secours-comp', 'aide-devoirs-comp', 'activites-manuelles', 'cuisine-comp', 'musique', 'sport', 'langues-etrangeres'];
const tacheSlugs = ['garde-enfants-tache', 'preparation-repas', 'bain-habillage', 'activites-educatives', 'aide-devoirs', 'menage-leger', 'lessive', 'repassage', 'vaisselle', 'promenade', 'cuisine-tache', 'rangement', 'courses'];
const critereSlugs = ['non-fumeur', 'vaccine', 'premiers-secours', 'references-verifiables', 'permis-conduire', 'vehicule'];
const certSlugs = ['cap-petite-enfance', 'auxiliaire-puericulture', 'formation-premiers-secours', 'aucune-certification'];
const gardeSlugs = ['garde-domicile', 'garde-partagee', 'garde-periscolaire', 'garde-occasionnelle', 'sortie-ecole'];
const aideSlugs = ['menage-leger', 'menage-complet', 'repassage', 'vaisselle', 'rangement', 'lessive', 'nettoyage-vitres', 'grand-menage'];

// ============================================================
//  GENERATE 100 NOUNU PROFILES
// ============================================================

interface GeneratedNounu {
  fullname: string;
  email: string;
  phone: string;
  age: string;
  anneesExperience: string;
  tarifHoraire: string;
  tarifMensuel: string;
  status: 'disponible' | 'indisponible';
  certif: 'Approved' | 'Pending' | 'Rejected';
  flexibiliteTarifaire: boolean;
  urgences: boolean;
  points: number;
  courteBiographie: string;
  references: string;
  evaluationPrecedentes: string;
  profileImage: string;
  bannerImage: string;
  galleryImages: string[];
  horaireDisponible: string[];
  zoneDeTravail: string[];
  typeServices: string[];
  trancheAgeEnfants: string[];
  langueParler: string[];
  frequenceDesServices: string;
  disponibilite: string;
  zoneGeo: string;
  competences: string[];
  taches: string[];
  criteres: string[];
  certifications: string[];
  gardeEnfants: string[];
  aideMenagere: string[];
}

function generateNounus(count: number): GeneratedNounu[] {
  const nounus: GeneratedNounu[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let fullname = '';
    let attempts = 0;
    do {
      fullname = `${pickOne(firstNames)} ${pickOne(lastNames)}`;
      attempts++;
    } while (usedNames.has(fullname) && attempts < 50);
    usedNames.add(fullname);

    const slug = slugify(fullname, { lower: true, strict: true });
    const age = randomInt(22, 45);
    const experience = randomInt(1, 15);
    const tarifH = randomInt(1000, 3000);
    const tarifM = tarifH * randomInt(20, 30);
    const randomPortraitId = randomInt(0, 99);

    nounus.push({
      fullname,
      email: `${slug}@babynounu.com`,
      phone: `+22507${String(randomInt(10000000, 99999999)).padStart(8, '0')}`,
      age: String(age),
      anneesExperience: String(experience),
      tarifHoraire: String(tarifH),
      tarifMensuel: String(tarifM),
      status: Math.random() > 0.3 ? 'disponible' : 'indisponible',
      certif: Math.random() > 0.4 ? 'Approved' : Math.random() > 0.5 ? 'Pending' : 'Rejected',
      flexibiliteTarifaire: Math.random() > 0.5,
      urgences: Math.random() > 0.6,
      points: randomFloat(3.0, 5.0),
      courteBiographie: pickOne(biographies),
      references: `Famille ${pickOne(lastNames)} (${pickOne(communes)}) - ${randomInt(1, 5)} ans`,
      evaluationPrecedentes: `${randomFloat(3.0, 5.0)}/5 — ${pickOne(['Très satisfaisante', 'Bonne', 'Excellente', 'Professionnelle', 'Ponctuelle et fiable'])}.`,
      profileImage: `https://randomuser.me/api/portraits/women/${randomPortraitId}.jpg`,
      bannerImage: `https://picsum.photos/seed/${slug}-banner/800/300`,
      galleryImages: Array.from({ length: randomInt(1, 3) }, (_, j) => `https://picsum.photos/seed/${slug}-gal${j + 1}/400/400`),
      horaireDisponible: pick(horaireSlugs, randomInt(1, 3)),
      zoneDeTravail: pick(zoneSlugs, randomInt(1, 3)),
      typeServices: pick(serviceSlugs, randomInt(1, 2)),
      trancheAgeEnfants: pick(trancheSlugs, randomInt(1, 3)),
      langueParler: pick(langueSlugs, randomInt(1, 3)),
      frequenceDesServices: pickOne(frequenceSlugs),
      disponibilite: pickOne(dispoSlugs),
      zoneGeo: 'abidjan',
      competences: pick(competenceSlugs, randomInt(1, 4)),
      taches: pick(tacheSlugs, randomInt(2, 5)),
      criteres: pick(critereSlugs, randomInt(1, 4)),
      certifications: pick(certSlugs, randomInt(1, 2)),
      gardeEnfants: pick(gardeSlugs, randomInt(1, 3)),
      aideMenagere: pick(aideSlugs, randomInt(1, 4)),
    });
  }

  return nounus;
}

// ============================================================
//  DOWNLOAD IMAGES
// ============================================================

async function downloadAllImages(
  nounus: GeneratedNounu[],
): Promise<Map<string, { profile: string; banner: string; gallery: string[] }>> {
  console.log('📦 Downloading images for 100 nounus...');
  const seedDir = path.join(process.cwd(), 'uploads', 'seed');
  if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });

  const imageMap = new Map<string, { profile: string; banner: string; gallery: string[] }>();
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < nounus.length; i++) {
    const n = nounus[i];
    const slug = slugify(n.fullname, { lower: true, strict: true });
    const images: { profile: string; banner: string; gallery: string[] } = { profile: '', banner: '', gallery: [] };

    const profilePath = path.join(seedDir, `${slug}-profile.jpg`);
    if (await downloadImage(n.profileImage, profilePath)) {
      images.profile = `/uploads/seed/${slug}-profile.jpg`;
      downloaded++;
    } else {
      failed++;
    }

    const bannerPath = path.join(seedDir, `${slug}-banner.jpg`);
    if (await downloadImage(n.bannerImage, bannerPath)) {
      images.banner = `/uploads/seed/${slug}-banner.jpg`;
    } else {
      failed++;
    }

    for (let j = 0; j < n.galleryImages.length; j++) {
      const galleryPath = path.join(seedDir, `${slug}-gallery-${j + 1}.jpg`);
      if (await downloadImage(n.galleryImages[j], galleryPath)) {
        images.gallery.push(`/uploads/seed/${slug}-gallery-${j + 1}.jpg`);
      }
    }

    imageMap.set(n.email, images);

    if ((i + 1) % 10 === 0) {
      console.log(`  📊 Progress: ${i + 1}/${nounus.length} profiles processed (downloaded: ${downloaded}, failed: ${failed})`);
    }
  }

  console.log(`✅ Images done (downloaded: ${downloaded}, failed: ${failed})`);
  return imageMap;
}

// ============================================================
//  SEED: Create Users + Profiles + Medias + Preferences
// ============================================================

async function seedNounus(
  nounus: GeneratedNounu[],
  imageMap: Map<string, { profile: string; banner: string; gallery: string[] }>,
) {
  console.log('📦 Seeding 100 nounu profiles...');

  const nounouRole = await getParamBySlug('nounou');
  const prestataireProfil = await getParamBySlug('prestataire');
  const photoProfilType = await getParamBySlug('photo_profil');
  const photoBanniereType = await getParamBySlug('photo_banniere');
  const galleryType = await getParamBySlug('type_galery');

  const hashedPwd = await hashPassword('nounou123');
  let created = 0;
  let updated = 0;

  for (let i = 0; i < nounus.length; i++) {
    const n = nounus[i];

    const existingUser = await prisma.user.findUnique({ where: { email: n.email } });
    let user = existingUser;

    if (!user) {
      user = await prisma.user.create({
        data: {
          slug: makeSlug(n.fullname),
          email: n.email,
          password: hashedPwd,
          roleId: nounouRole?.id,
          typeProfilId: prestataireProfil?.id,
        },
      });
    }

    const existingProfil = await prisma.profilNounu.findUnique({ where: { phone: n.phone } });
    let profil = existingProfil;

    if (!profil) {
      profil = await prisma.profilNounu.create({
        data: {
          fullname: n.fullname,
          age: n.age,
          phone: n.phone,
          anneesExperience: n.anneesExperience,
          tarifHoraire: n.tarifHoraire,
          tarifMensuel: n.tarifMensuel,
          status: n.status,
          certif: n.certif,
          flexibiliteTarifaire: n.flexibiliteTarifaire,
          urgences: n.urgences,
          points: n.points,
          courteBiographie: n.courteBiographie,
          references: n.references,
          evaluationPrecedentes: n.evaluationPrecedentes,
          userId: user.id,
        },
      });
      created++;
    } else {
      profil = await prisma.profilNounu.update({
        where: { id: profil.id },
        data: {
          fullname: n.fullname,
          age: n.age,
          anneesExperience: n.anneesExperience,
          tarifHoraire: n.tarifHoraire,
          tarifMensuel: n.tarifMensuel,
          status: n.status,
          certif: n.certif,
          flexibiliteTarifaire: n.flexibiliteTarifaire,
          urgences: n.urgences,
          points: n.points,
          courteBiographie: n.courteBiographie,
          references: n.references,
          evaluationPrecedentes: n.evaluationPrecedentes,
        },
      });
      updated++;
    }

    // Medias
    const images = imageMap.get(n.email);
    if (images) {
      if (images.profile) {
        const existing = await prisma.media.findFirst({
          where: { userId: user.id, typeMediaId: photoProfilType?.id, deletedAt: null },
        });
        if (!existing) {
          await prisma.media.create({
            data: {
              originalName: `${slugify(n.fullname, { lower: true })}-profile.jpg`,
              filename: path.basename(images.profile),
              path: images.profile,
              originalUrl: images.profile,
              userId: user.id,
              typeMediaId: photoProfilType?.id,
            },
          });
        }
      }

      if (images.banner) {
        const existing = await prisma.media.findFirst({
          where: { userId: user.id, typeMediaId: photoBanniereType?.id, deletedAt: null },
        });
        if (!existing) {
          await prisma.media.create({
            data: {
              originalName: `${slugify(n.fullname, { lower: true })}-banner.jpg`,
              filename: path.basename(images.banner),
              path: images.banner,
              originalUrl: images.banner,
              userId: user.id,
              typeMediaId: photoBanniereType?.id,
            },
          });
        }
      }

      for (const galleryUrl of images.gallery) {
        const existing = await prisma.media.findFirst({
          where: { userId: user.id, path: galleryUrl, deletedAt: null },
        });
        if (!existing) {
          await prisma.media.create({
            data: {
              originalName: path.basename(galleryUrl),
              filename: path.basename(galleryUrl),
              path: galleryUrl,
              originalUrl: galleryUrl,
              userId: user.id,
              typeMediaId: galleryType?.id,
            },
          });
        }
      }
    }

    // Preferences
    await prisma.preference.deleteMany({ where: { nounuId: profil.id } });

    const resolveParam = async (slug: string) => (await getParamBySlug(slug))?.id;

    const frequenceId = await resolveParam(n.frequenceDesServices);
    const disponibiliteId = await resolveParam(n.disponibilite);
    const zoneGeoId = await resolveParam(n.zoneGeo);

    const multiPrefs: { slugs: string[]; field: string }[] = [
      { slugs: n.horaireDisponible, field: 'horaireDisponibleId' },
      { slugs: n.zoneDeTravail, field: 'zoneDeTravailId' },
      { slugs: n.typeServices, field: 'typeServicesId' },
      { slugs: n.trancheAgeEnfants, field: 'trancheAgeEnfantsId' },
      { slugs: n.langueParler, field: 'langueParlerId' },
      { slugs: n.competences, field: 'competanceSpecifiqueId' },
      { slugs: n.taches, field: 'tachesId' },
      { slugs: n.criteres, field: 'criteresSpecifiquesId' },
      { slugs: n.certifications, field: 'certificationsCriteresId' },
      { slugs: n.gardeEnfants, field: 'gardeEnfantsId' },
      { slugs: n.aideMenagere, field: 'aideMenagereId' },
    ];

    for (const mp of multiPrefs) {
      for (const slug of mp.slugs) {
        const paramId = await resolveParam(slug);
        if (paramId) {
          await prisma.preference.create({
            data: { nounuId: profil.id, [mp.field]: paramId },
          });
        }
      }
    }

    if (frequenceId || disponibiliteId || zoneGeoId) {
      await prisma.preference.create({
        data: {
          nounuId: profil.id,
          frequenceDesServicesId: frequenceId,
          disponibilityPrestataireId: disponibiliteId,
          zoneGeographiquePrestataireId: zoneGeoId,
        },
      });
    }

    if ((i + 1) % 10 === 0) {
      console.log(`  📊 Progress: ${i + 1}/${nounus.length} profiles seeded`);
    }
  }

  console.log(`✅ ${created} new profiles created, ${updated} updated`);
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  console.log('\n🌱 Starting batch seeding of 100 nounu profiles...\n');

  const nounus = generateNounus(100);
  console.log(`📋 Generated ${nounus.length} nounu profiles`);

  const imageMap = await downloadAllImages(nounus);
  await seedNounus(nounus, imageMap);

  console.log('\n🎉 Batch seeding completed!');
  console.log('📋 All nounu accounts password: nounou123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
