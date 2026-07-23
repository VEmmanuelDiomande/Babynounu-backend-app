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

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    if (fs.existsSync(destPath)) {
      console.log(`  ⏭️  Image already exists: ${path.basename(destPath)}`);
      return true;
    }
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
    fs.writeFileSync(destPath, response.data);
    console.log(`  ✅ Downloaded: ${path.basename(destPath)} (${(response.data.length / 1024).toFixed(1)} KB)`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Failed to download ${url}: ${err.message}`);
    return false;
  }
}

// ============================================================
//  NOUNU DATA — 8 profiles with full information
// ============================================================

interface NounuSeedData {
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
  // Image URLs
  profileImage: string;
  bannerImage: string;
  galleryImages: string[];
  // Preferences (slugs)
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

const nounusData: NounuSeedData[] = [
  {
    fullname: 'Aïcha Koné',
    email: 'aicha.kone@babynounu.com',
    phone: '+2250701020301',
    age: '28',
    anneesExperience: '5',
    tarifHoraire: '1500',
    tarifMensuel: '90000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: true,
    urgences: true,
    points: 4.5,
    courteBiographie: "Nounou expérimentée et passionnée, j'ai 5 ans d'expérience dans la garde d'enfants de 0 à 6 ans. Patiente, créative et responsable, j'organise des activités éducatives tout en assurant un environnement sécurisé.",
    references: 'Famille Kouassi (Cocody) - 2 ans|Famille Bamba (Plateau) - 3 ans',
    evaluationPrecedentes: '4.5/5 — Très satisfaisante. Les enfants l adorent, ponctuelle et fiable.',
    profileImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    bannerImage: 'https://picsum.photos/seed/aicha-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/aicha-gal1/400/400',
      'https://picsum.photos/seed/aicha-gal2/400/400',
      'https://picsum.photos/seed/aicha-gal3/400/400',
    ],
    horaireDisponible: ['plein-temps', 'weekend'],
    zoneDeTravail: ['cocody', 'plateau'],
    typeServices: ['garde-enfants'],
    trancheAgeEnfants: ['0-1-an', '1-3-ans', '3-6-ans'],
    langueParler: ['francais', 'dioula'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'immediate',
    zoneGeo: 'abidjan',
    competences: ['premiers-secours-comp', 'aide-devoirs-comp', 'activites-manuelles'],
    taches: ['garde-enfants-tache', 'preparation-repas', 'bain-habillage', 'activites-educatives'],
    criteres: ['non-fumeur', 'vaccine', 'premiers-secours'],
    certifications: ['cap-petite-enfance', 'formation-premiers-secours'],
    gardeEnfants: ['garde-domicile', 'garde-periscolaire'],
    aideMenagere: ['menage-leger', 'vaisselle'],
  },
  {
    fullname: 'Fatou Diabaté',
    email: 'fatou.diabate@babynounu.com',
    phone: '+2250701020302',
    age: '32',
    anneesExperience: '8',
    tarifHoraire: '2000',
    tarifMensuel: '120000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: false,
    urgences: false,
    points: 5.0,
    courteBiographie: "Aide ménagère et nounou diplômée, spécialisée dans les enfants en bas âge. 8 ans d'expérience avec des familles exigeantes. Organisée, rigoureuse et attentionnée.",
    references: 'Famille Touré (Marcory) - 4 ans|Famille Cissé (Yopougon) - 4 ans',
    evaluationPrecedentes: '5/5 — Excellente. Professionnelle, ponctuelle, les enfants sont en sécurité avec elle.',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    bannerImage: 'https://picsum.photos/seed/fatou-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/fatou-gal1/400/400',
      'https://picsum.photos/seed/fatou-gal2/400/400',
    ],
    horaireDisponible: ['plein-temps', 'demi-journee'],
    zoneDeTravail: ['plateau', 'marcory'],
    typeServices: ['aide-menagere', 'garde-enfants'],
    trancheAgeEnfants: ['0-1-an', '1-3-ans'],
    langueParler: ['francais', 'baoule'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'sous-1-semaine',
    zoneGeo: 'abidjan',
    competences: ['cuisine-comp', 'aide-devoirs-comp'],
    taches: ['preparation-repas', 'menage-leger', 'lessive', 'bain-habillage'],
    criteres: ['non-fumeur', 'references-verifiables', 'permis-conduire'],
    certifications: ['auxiliaire-puericulture'],
    gardeEnfants: ['garde-domicile'],
    aideMenagere: ['menage-complet', 'repassage', 'lessive'],
  },
  {
    fullname: 'Mariam Traoré',
    email: 'mariam.traore@babynounu.com',
    phone: '+2250701020303',
    age: '25',
    anneesExperience: '3',
    tarifHoraire: '1200',
    tarifMensuel: '75000',
    status: 'indisponible',
    certif: 'Pending',
    flexibiliteTarifaire: true,
    urgences: false,
    points: 4.0,
    courteBiographie: "Jeune nounou dynamique et pleine d'énergie, je propose mes services pour des gardes ponctuelles ou régulières. J'adore travailler avec les enfants et organiser des activités ludiques.",
    references: 'Famille Sangaré (Abobo) - 1 an',
    evaluationPrecedentes: '4/5 — Bonne. Jeune mais motivée, s occupe bien des enfants.',
    profileImage: 'https://randomuser.me/api/portraits/women/26.jpg',
    bannerImage: 'https://picsum.photos/seed/mariam-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/mariam-gal1/400/400',
    ],
    horaireDisponible: ['demi-journee', 'soiree', 'weekend'],
    zoneDeTravail: ['yopougon', 'abobo'],
    typeServices: ['garde-enfants'],
    trancheAgeEnfants: ['3-6-ans', '6-12-ans'],
    langueParler: ['francais', 'dioula'],
    frequenceDesServices: 'hebdomadaire',
    disponibilite: 'a-convenir',
    zoneGeo: 'abidjan',
    competences: ['activites-manuelles', 'musique', 'sport'],
    taches: ['garde-enfants-tache', 'aide-devoirs', 'promenade'],
    criteres: ['non-fumeur'],
    certifications: ['aucune-certification'],
    gardeEnfants: ['garde-occasionnelle', 'sortie-ecole'],
    aideMenagere: ['menage-leger'],
  },
  {
    fullname: 'Adjoua Kouassi',
    email: 'adjoua.kouassi@babynounu.com',
    phone: '+2250701020304',
    age: '35',
    anneesExperience: '10',
    tarifHoraire: '2500',
    tarifMensuel: '150000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: false,
    urgences: true,
    points: 5.0,
    courteBiographie: "Nounou professionnelle certifiée avec plus de 10 ans d'expérience. Spécialisée dans les familles nombreuses et les enfants ayant des besoins spécifiques. Références vérifiables et casier judiciaire vierge.",
    references: 'Famille Brou (Cocody) - 5 ans|Famille N Guessan (Plateau) - 3 ans|Famille Yao (Marcory) - 2 ans',
    evaluationPrecedentes: '5/5 — Exceptionnelle. Professionnelle, fiable, gère parfaitement les enfants.',
    profileImage: 'https://randomuser.me/api/portraits/women/52.jpg',
    bannerImage: 'https://picsum.photos/seed/adjoua-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/adjoua-gal1/400/400',
      'https://picsum.photos/seed/adjoua-gal2/400/400',
      'https://picsum.photos/seed/adjoua-gal3/400/400',
    ],
    horaireDisponible: ['plein-temps', 'nuit', 'weekend'],
    zoneDeTravail: ['cocody', 'plateau', 'marcory'],
    typeServices: ['garde-enfants', 'cuisine'],
    trancheAgeEnfants: ['0-1-an', '1-3-ans', '3-6-ans', '6-12-ans'],
    langueParler: ['francais', 'anglais', 'bete'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'immediate',
    zoneGeo: 'abidjan',
    competences: ['premiers-secours-comp', 'aide-devoirs-comp', 'langues-etrangeres', 'cuisine-comp'],
    taches: ['garde-enfants-tache', 'preparation-repas', 'aide-devoirs', 'bain-habillage', 'activites-educatives', 'cuisine-tache'],
    criteres: ['non-fumeur', 'vaccine', 'permis-conduire', 'vehicule', 'premiers-secours', 'references-verifiables'],
    certifications: ['cap-petite-enfance', 'auxiliaire-puericulture', 'formation-premiers-secours'],
    gardeEnfants: ['garde-domicile', 'garde-partagee', 'garde-periscolaire'],
    aideMenagere: ['menage-leger', 'vaisselle'],
  },
  {
    fullname: 'Awa Bamba',
    email: 'awa.bamba@babynounu.com',
    phone: '+2250701020305',
    age: '30',
    anneesExperience: '6',
    tarifHoraire: '1800',
    tarifMensuel: '108000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: true,
    urgences: false,
    points: 4.5,
    courteBiographie: "Aide ménagère dévouée avec 6 ans d'expérience. Spécialisée dans l'entretien de la maison et la préparation des repas. Travailleuse acharnée, ponctuelle et discrète.",
    references: 'Famille Diabaté (Treichville) - 3 ans|Famille Koné (Koumassi) - 3 ans',
    evaluationPrecedentes: '4.5/5 — Très bonne. Maison toujours propre, repas délicieux.',
    profileImage: 'https://randomuser.me/api/portraits/women/32.jpg',
    bannerImage: 'https://picsum.photos/seed/awa-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/awa-gal1/400/400',
      'https://picsum.photos/seed/awa-gal2/400/400',
    ],
    horaireDisponible: ['plein-temps', 'demi-journee'],
    zoneDeTravail: ['treichville', 'koumassi'],
    typeServices: ['aide-menagere', 'cuisine'],
    trancheAgeEnfants: ['3-6-ans', '6-12-ans'],
    langueParler: ['francais', 'dioula'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'sous-2-semaines',
    zoneGeo: 'abidjan',
    competences: ['cuisine-comp'],
    taches: ['preparation-repas', 'menage-leger', 'lessive', 'repassage', 'vaisselle', 'cuisine-tache'],
    criteres: ['non-fumeur', 'references-verifiables'],
    certifications: ['aucune-certification'],
    gardeEnfants: ['garde-occasionnelle'],
    aideMenagere: ['menage-complet', 'repassage', 'vaisselle', 'rangement', 'nettoyage-vitres', 'grand-menage'],
  },
  {
    fullname: 'Grace Aya',
    email: 'grace.aya@babynounu.com',
    phone: '+2250701020306',
    age: '27',
    anneesExperience: '4',
    tarifHoraire: '1500',
    tarifMensuel: '95000',
    status: 'disponible',
    certif: 'Pending',
    flexibiliteTarifaire: true,
    urgences: true,
    points: 4.0,
    courteBiographie: "Nounou jeune et énergique, j'ai travaillé avec 3 familles différentes. J'aime organiser des activités créatives avec les enfants et je suis disponible pour des gardes en soirée et le weekend.",
    references: 'Famille Brou (Abobo) - 2 ans|Famille Yao (Cocody) - 2 ans',
    evaluationPrecedentes: '4/5 — Bonne. Dynamique, les enfants ne s ennulent jamais avec elle.',
    profileImage: 'https://randomuser.me/api/portraits/women/90.jpg',
    bannerImage: 'https://picsum.photos/seed/grace-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/grace-gal1/400/400',
    ],
    horaireDisponible: ['soiree', 'nuit', 'weekend'],
    zoneDeTravail: ['abobo', 'adjame'],
    typeServices: ['garde-enfants'],
    trancheAgeEnfants: ['1-3-ans', '3-6-ans', '6-12-ans'],
    langueParler: ['francais', 'anglais'],
    frequenceDesServices: 'occasionnel',
    disponibilite: 'immediate',
    zoneGeo: 'abidjan',
    competences: ['activites-manuelles', 'musique', 'sport', 'aide-devoirs-comp'],
    taches: ['garde-enfants-tache', 'aide-devoirs', 'promenade', 'activites-educatives'],
    criteres: ['non-fumeur', 'vaccine'],
    certifications: ['formation-premiers-secours'],
    gardeEnfants: ['garde-occasionnelle', 'sortie-ecole', 'garde-periscolaire'],
    aideMenagere: ['menage-leger'],
  },
  {
    fullname: 'Salimata Cissé',
    email: 'salimata.cisse@babynounu.com',
    phone: '+2250701020307',
    age: '33',
    anneesExperience: '9',
    tarifHoraire: '2200',
    tarifMensuel: '132000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: false,
    urgences: false,
    points: 4.8,
    courteBiographie: "Cuisinière et aide ménagère expérimentée, je propose mes services pour la préparation des repas et l'entretien de la maison. 9 ans d'expérience dans des familles à Cocody et Plateau.",
    references: 'Famille Kouamé (Cocody) - 5 ans|Famille Bamba (Plateau) - 4 ans',
    evaluationPrecedentes: '4.8/5 — Excellente cuisinière, maison impeccable.',
    profileImage: 'https://randomuser.me/api/portraits/women/79.jpg',
    bannerImage: 'https://picsum.photos/seed/salimata-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/salimata-gal1/400/400',
      'https://picsum.photos/seed/salimata-gal2/400/400',
      'https://picsum.photos/seed/salimata-gal3/400/400',
    ],
    horaireDisponible: ['plein-temps', 'demi-journee'],
    zoneDeTravail: ['koumassi', 'marcory', 'treichville'],
    typeServices: ['cuisine', 'aide-menagere'],
    trancheAgeEnfants: ['3-6-ans', '6-12-ans'],
    langueParler: ['francais', 'dioula', 'bete'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'sous-1-semaine',
    zoneGeo: 'abidjan',
    competences: ['cuisine-comp', 'activites-manuelles'],
    taches: ['preparation-repas', 'cuisine-tache', 'menage-leger', 'lessive', 'courses'],
    criteres: ['non-fumeur', 'references-verifiables', 'premiers-secours'],
    certifications: ['aucune-certification'],
    gardeEnfants: [],
    aideMenagere: ['menage-complet', 'repassage', 'vaisselle', 'rangement'],
  },
  {
    fullname: 'Brigitte Koffi',
    email: 'brigitte.koffi@babynounu.com',
    phone: '+2250701020308',
    age: '29',
    anneesExperience: '6',
    tarifHoraire: '1700',
    tarifMensuel: '102000',
    status: 'disponible',
    certif: 'Approved',
    flexibiliteTarifaire: true,
    urgences: true,
    points: 4.5,
    courteBiographie: "Nounou certifiée avec 6 ans d'expérience. Spécialisée dans la garde des nourrissons et jeunes enfants. Formée aux premiers secours. Disponible immédiatement.",
    references: 'Famille Diomandé (Adjamé) - 3 ans|Famille Brou (Cocody) - 3 ans',
    evaluationPrecedentes: '4.5/5 — Très satisfaisante. S occupe très bien des bébés.',
    profileImage: 'https://randomuser.me/api/portraits/women/65.jpg',
    bannerImage: 'https://picsum.photos/seed/brigitte-banner/800/300',
    galleryImages: [
      'https://picsum.photos/seed/brigitte-gal1/400/400',
      'https://picsum.photos/seed/brigitte-gal2/400/400',
    ],
    horaireDisponible: ['plein-temps', 'nuit'],
    zoneDeTravail: ['adjame', 'cocody'],
    typeServices: ['garde-enfants', 'cuisine'],
    trancheAgeEnfants: ['0-1-an', '1-3-ans'],
    langueParler: ['francais', 'baoule'],
    frequenceDesServices: 'quotidien',
    disponibilite: 'immediate',
    zoneGeo: 'abidjan',
    competences: ['premiers-secours-comp', 'cuisine-comp', 'aide-devoirs-comp'],
    taches: ['garde-enfants-tache', 'preparation-repas', 'bain-habillage', 'menage-leger'],
    criteres: ['non-fumeur', 'vaccine', 'premiers-secours', 'references-verifiables'],
    certifications: ['cap-petite-enfance', 'formation-premiers-secours'],
    gardeEnfants: ['garde-domicile', 'garde-partagee', 'garde-occasionnelle'],
    aideMenagere: ['menage-leger', 'vaisselle'],
  },
];

// ============================================================
//  SEED: Download images
// ============================================================

async function downloadAllImages(nounus: NounuSeedData[]): Promise<Map<string, { profile: string; banner: string; gallery: string[] }>> {
  console.log('📦 Downloading images...');

  const seedDir = path.join(process.cwd(), 'uploads', 'seed');
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  const imageMap = new Map<string, { profile: string; banner: string; gallery: string[] }>();

  for (const n of nounus) {
    const slug = slugify(n.fullname, { lower: true, strict: true });
    const images: { profile: string; banner: string; gallery: string[] } = { profile: '', banner: '', gallery: [] };

    // Profile photo
    const profilePath = path.join(seedDir, `${slug}-profile.jpg`);
    if (await downloadImage(n.profileImage, profilePath)) {
      images.profile = `/uploads/seed/${slug}-profile.jpg`;
    }

    // Banner
    const bannerPath = path.join(seedDir, `${slug}-banner.jpg`);
    if (await downloadImage(n.bannerImage, bannerPath)) {
      images.banner = `/uploads/seed/${slug}-banner.jpg`;
    }

    // Gallery
    for (let i = 0; i < n.galleryImages.length; i++) {
      const galleryPath = path.join(seedDir, `${slug}-gallery-${i + 1}.jpg`);
      if (await downloadImage(n.galleryImages[i], galleryPath)) {
        images.gallery.push(`/uploads/seed/${slug}-gallery-${i + 1}.jpg`);
      }
    }

    imageMap.set(n.email, images);
  }

  console.log('✅ Images downloaded');
  return imageMap;
}

// ============================================================
//  SEED: Create Users + Profiles + Medias + Preferences
// ============================================================

async function seedNounusWithImages(
  nounus: NounuSeedData[],
  imageMap: Map<string, { profile: string; banner: string; gallery: string[] }>,
) {
  console.log('📦 Seeding Nounu profiles with images...');

  const nounouRole = await getParamBySlug('nounou');
  const prestataireProfil = await getParamBySlug('prestataire');
  const photoProfilType = await getParamBySlug('photo_profil');
  const photoBanniereType = await getParamBySlug('photo_banniere');
  const galleryType = await getParamBySlug('type_galery');

  const hashedNounouPwd = await hashPassword('nounou123');
  const createdNounus: { user: any; profil: any }[] = [];

  for (const n of nounus) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: n.email } });
    let user = existingUser;

    if (!user) {
      user = await prisma.user.create({
        data: {
          slug: makeSlug(n.fullname),
          email: n.email,
          password: hashedNounouPwd,
          roleId: nounouRole?.id,
          typeProfilId: prestataireProfil?.id,
        },
      });
    }

    // Check if profile already exists
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
    } else {
      // Update existing profile with new data
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
    }

    // Create medias
    const images = imageMap.get(n.email);
    if (images) {
      // Profile photo
      if (images.profile) {
        const existingProfileMedia = await prisma.media.findFirst({
          where: { userId: user.id, typeMediaId: photoProfilType?.id, deletedAt: null },
        });
        if (!existingProfileMedia) {
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

      // Banner
      if (images.banner) {
        const existingBannerMedia = await prisma.media.findFirst({
          where: { userId: user.id, typeMediaId: photoBanniereType?.id, deletedAt: null },
        });
        if (!existingBannerMedia) {
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

      // Gallery images
      for (const galleryUrl of images.gallery) {
        const existingGallery = await prisma.media.findFirst({
          where: { userId: user.id, path: galleryUrl, deletedAt: null },
        });
        if (!existingGallery) {
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

    // Create preferences
    // First, delete existing preferences for this nounu
    await prisma.preference.deleteMany({ where: { nounuId: profil.id } });

    const resolveParam = async (slug: string) => {
      const param = await getParamBySlug(slug);
      return param?.id;
    };

    // Single-value preferences
    const frequenceId = await resolveParam(n.frequenceDesServices);
    const disponibiliteId = await resolveParam(n.disponibilite);
    const zoneGeoId = await resolveParam(n.zoneGeo);

    // Multi-value preferences — create one Preference row per value
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
            data: {
              nounuId: profil.id,
              [mp.field]: paramId,
            },
          });
        }
      }
    }

    // Single-value preferences in a single row
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

    createdNounus.push({ user, profil });
    console.log(`  ✅ ${n.fullname} — profile, medias, preferences created`);
  }

  console.log(`✅ ${createdNounus.length} nounu profiles seeded with images and preferences`);
  return createdNounus;
}

// ============================================================
//  SEED: Reviews for nounus
// ============================================================

async function seedNounuReviews(nounuUsers: { user: any; profil: any }[]) {
  console.log('📦 Seeding reviews...');

  // Find parent users to act as reviewers
  const parentRole = await getParamBySlug('parent');
  const parents = await prisma.user.findMany({
    where: { roleId: parentRole?.id },
    take: 3,
  });

  if (parents.length === 0) {
    console.log('  ⏭️  No parent users found, skipping reviews');
    return;
  }

  const reviews = [
    { nounuIdx: 0, parentIdx: 0, rating: 5, comment: 'Aïcha est une nounou exceptionnelle. Mes enfants l adorent et elle est très ponctuelle.' },
    { nounuIdx: 0, parentIdx: 1, rating: 4, comment: 'Très bonne nounou, mais parfois en retard le matin.' },
    { nounuIdx: 1, parentIdx: 0, rating: 5, comment: 'Fatou est professionnelle et organisée. Je la recommande vivement.' },
    { nounuIdx: 3, parentIdx: 2, rating: 5, comment: 'Adjoua a pris soin de mes 3 enfants avec brio. Expérience inégalable.' },
    { nounuIdx: 3, parentIdx: 1, rating: 5, comment: 'La meilleure nounou que nous ayons eue. Les enfants sont en sécurité avec elle.' },
    { nounuIdx: 4, parentIdx: 0, rating: 4, comment: 'Awa fait un excellent travail à la maison. Repas toujours délicieux.' },
    { nounuIdx: 6, parentIdx: 2, rating: 5, comment: 'Salimata cuisine divinement bien et la maison est toujours impeccable.' },
    { nounuIdx: 7, parentIdx: 1, rating: 4, comment: 'Brigitte s occupe très bien de notre bébé. Formée aux premiers secours, c est rassurant.' },
  ];

  for (const r of reviews) {
    if (r.nounuIdx >= nounuUsers.length || r.parentIdx >= parents.length) continue;

    const existing = await prisma.review.findFirst({
      where: {
        reviewerId: parents[r.parentIdx].id,
        nounuId: nounuUsers[r.nounuIdx].profil.id,
      },
    });

    if (!existing) {
      await prisma.review.create({
        data: {
          rating: r.rating,
          comment: r.comment,
          reviewerId: parents[r.parentIdx].id,
          nounuId: nounuUsers[r.nounuIdx].profil.id,
        },
      });
    }
  }

  console.log(`✅ Reviews seeded`);
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  console.log('\n🌱 Starting BabyNounu nounu profiles seeding...\n');

  // Step 1: Download all images
  const imageMap = await downloadAllImages(nounusData);

  // Step 2: Create users, profiles, medias, preferences
  const nounuUsers = await seedNounusWithImages(nounusData, imageMap);

  // Step 3: Create reviews
  await seedNounuReviews(nounuUsers);

  console.log('\n🎉 Nounu profiles seeding completed!\n');
  console.log('📋 Nounu credentials (all same password): nounou123');
  for (const n of nounusData) {
    console.log(`   ${n.fullname}: ${n.email}`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
