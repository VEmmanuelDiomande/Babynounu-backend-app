import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcryptjs';
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

async function findOrCreateTypeParameter(slug: string, name: string) {
  const existing = await prisma.typeParameter.findFirst({ where: { slug } });
  if (existing) return existing;
  return prisma.typeParameter.create({ data: { slug, name } });
}

async function findOrCreateParameter(name: string, slug: string, priority?: number, typeParameterId?: number) {
  const existing = await prisma.parameter.findFirst({ where: { slug } });
  if (existing) return existing;
  return prisma.parameter.create({ data: { name, slug, priority, typeParameterId } });
}

async function getParamBySlug(slug: string) {
  return prisma.parameter.findFirst({ where: { slug } });
}

// ============================================================
//  SEED: TypeParameter
// ============================================================

async function seedTypeParameters() {
  console.log('📦 Seeding TypeParameters...');

  const types = [
    { slug: 'role', name: 'Rôle utilisateur' },
    { slug: 'type_profil', name: 'Type de profil' },
    { slug: 'type_media', name: 'Type de média' },
    { slug: 'horaire', name: 'Horaire disponible' },
    { slug: 'zone', name: 'Zone de travail' },
    { slug: 'type_service', name: 'Type de service' },
    { slug: 'equipement', name: 'Équipement ménager' },
    { slug: 'criteres', name: 'Critères spécifiques' },
    { slug: 'certifications', name: 'Certifications' },
    { slug: 'tranche_age', name: "Tranche d'âge des enfants" },
    { slug: 'besoins', name: 'Besoins spécifiques' },
    { slug: 'garde', name: 'Garde enfants' },
    { slug: 'aide_menagere', name: 'Aide ménagère' },
    { slug: 'frequence', name: 'Fréquence des services' },
    { slug: 'horaire_souhaite', name: 'Horaires souhaités' },
    { slug: 'adresse', name: 'Adresse' },
    { slug: 'disponibilite', name: 'Disponibilité du prestataire' },
    { slug: 'zone_geo', name: 'Zone géographique du prestataire' },
    { slug: 'competence', name: 'Compétence spécifique' },
    { slug: 'mode_paiement', name: 'Mode de paiement' },
    { slug: 'taches', name: 'Tâches' },
    { slug: 'langue', name: 'Langue parlée' },
    { slug: 'criteres_selection', name: 'Critères de sélection' },
    { slug: 'subscription_type', name: "Type d'abonnement" },
  ];

  for (const t of types) {
    await findOrCreateTypeParameter(t.slug, t.name);
  }

  console.log(`✅ ${types.length} TypeParameters seeded`);
}

// ============================================================
//  SEED: Parameters
// ============================================================

async function seedParameters() {
  console.log('📦 Seeding Parameters...');

  const typeBySlug = async (slug: string) => {
    return prisma.typeParameter.findFirst({ where: { slug } });
  };

  // Rôles
  const roleType = await typeBySlug('role');
  const roles = [
    { name: 'Administrateur', slug: 'admin', priority: 0 },
    { name: 'Nounou', slug: 'nounou', priority: 1 },
    { name: 'Parent', slug: 'parent', priority: 2 },
  ];
  for (const r of roles) {
    await findOrCreateParameter(r.name, r.slug, r.priority, roleType?.id);
  }

  // Types de profil
  const profilType = await typeBySlug('type_profil');
  const profils = [
    { name: 'Administrateur', slug: 'administrateur', priority: 0 },
    { name: 'Prestataire (Nounou)', slug: 'prestataire', priority: 1 },
    { name: 'Client (Parent)', slug: 'client', priority: 2 },
  ];
  for (const p of profils) {
    await findOrCreateParameter(p.name, p.slug, p.priority, profilType?.id);
  }

  // Types de média
  const mediaType = await typeBySlug('type_media');
  const medias = [
    { name: 'Photo de profil', slug: 'photo_profil', priority: 0 },
    { name: 'Bannière', slug: 'photo_banniere', priority: 1 },
    { name: "Photo d'identité", slug: 'photo_identite', priority: 2 },
    { name: 'Document', slug: 'document', priority: 3 },
    { name: 'Photo de travail', slug: 'photo_travail', priority: 4 },
    { name: 'Galerie', slug: 'type_galery', priority: 5 },
  ];
  for (const m of medias) {
    await findOrCreateParameter(m.name, m.slug, m.priority, mediaType?.id);
  }

  // Horaires
  const horaireType = await typeBySlug('horaire');
  const horaires = [
    { name: 'Plein temps', slug: 'plein-temps' },
    { name: 'Demi-journée', slug: 'demi-journee' },
    { name: 'Soirée', slug: 'soiree' },
    { name: 'Nuit', slug: 'nuit' },
    { name: 'Weekend', slug: 'weekend' },
  ];
  for (const h of horaires) {
    await findOrCreateParameter(h.name, h.slug, undefined, horaireType?.id);
  }

  // Zones
  const zoneType = await typeBySlug('zone');
  const zones = [
    { name: 'Cocody', slug: 'cocody' },
    { name: 'Plateau', slug: 'plateau' },
    { name: 'Yopougon', slug: 'yopougon' },
    { name: 'Marcory', slug: 'marcory' },
    { name: 'Treichville', slug: 'treichville' },
    { name: 'Abobo', slug: 'abobo' },
    { name: 'Adjamé', slug: 'adjame' },
    { name: 'Koumassi', slug: 'koumassi' },
  ];
  for (const z of zones) {
    await findOrCreateParameter(z.name, z.slug, undefined, zoneType?.id);
  }

  // Types de service
  const serviceType = await typeBySlug('type_service');
  const services = [
    { name: 'Garde enfants', slug: 'garde-enfants' },
    { name: 'Aide ménagère', slug: 'aide-menagere' },
    { name: 'Cuisine', slug: 'cuisine' },
  ];
  for (const s of services) {
    await findOrCreateParameter(s.name, s.slug, undefined, serviceType?.id);
  }

  // Tranches d'âge
  const trancheType = await typeBySlug('tranche_age');
  const tranches = [
    { name: '0-1 an', slug: '0-1-an' },
    { name: '1-3 ans', slug: '1-3-ans' },
    { name: '3-6 ans', slug: '3-6-ans' },
    { name: '6-12 ans', slug: '6-12-ans' },
  ];
  for (const t of tranches) {
    await findOrCreateParameter(t.name, t.slug, undefined, trancheType?.id);
  }

  // Langues
  const langueType = await typeBySlug('langue');
  const langues = [
    { name: 'Français', slug: 'francais' },
    { name: 'Anglais', slug: 'anglais' },
    { name: 'Dioula', slug: 'dioula' },
    { name: 'Bété', slug: 'bete' },
    { name: 'Baoulé', slug: 'baoule' },
  ];
  for (const l of langues) {
    await findOrCreateParameter(l.name, l.slug, undefined, langueType?.id);
  }

  // Fréquences
  const frequenceType = await typeBySlug('frequence');
  const frequences = [
    { name: 'Quotidien', slug: 'quotidien' },
    { name: 'Hebdomadaire', slug: 'hebdomadaire' },
    { name: 'Mensuel', slug: 'mensuel' },
    { name: 'Occasionnel', slug: 'occasionnel' },
  ];
  for (const f of frequences) {
    await findOrCreateParameter(f.name, f.slug, undefined, frequenceType?.id);
  }

  // Types d'abonnement
  const subType = await typeBySlug('subscription_type');
  const subTypes = [
    { name: 'Gratuit', slug: 'gratuit', priority: 0 },
    { name: 'Premium', slug: 'premium', priority: 1 },
    { name: 'Pro', slug: 'pro', priority: 2 },
  ];
  for (const s of subTypes) {
    await findOrCreateParameter(s.name, s.slug, s.priority, subType?.id);
  }

  // Modes de paiement
  const paiementType = await typeBySlug('mode_paiement');
  const paiements = [
    { name: 'Orange Money', slug: 'orange-money' },
    { name: 'MTN Money', slug: 'mtn-money' },
    { name: 'Moov Money', slug: 'moov-money' },
    { name: 'Wave', slug: 'wave' },
    { name: 'Espèces', slug: 'especes' },
  ];
  for (const p of paiements) {
    await findOrCreateParameter(p.name, p.slug, undefined, paiementType?.id);
  }

  // Adresses (mêmes zones que les zones de travail)
  const adresseType = await typeBySlug('adresse');
  const adresses = [
    { name: 'Cocody', slug: 'cocody-adresse' },
    { name: 'Plateau', slug: 'plateau-adresse' },
    { name: 'Yopougon', slug: 'yopougon-adresse' },
    { name: 'Marcory', slug: 'marcory-adresse' },
    { name: 'Treichville', slug: 'treichville-adresse' },
    { name: 'Abobo', slug: 'abobo-adresse' },
    { name: 'Adjamé', slug: 'adjame-adresse' },
    { name: 'Koumassi', slug: 'koumassi-adresse' },
  ];
  for (const a of adresses) {
    await findOrCreateParameter(a.name, a.slug, undefined, adresseType?.id);
  }

  // Tâches
  const tachesType = await typeBySlug('taches');
  const tachesList = [
    { name: 'Garde d\'enfants', slug: 'garde-enfants-tache' },
    { name: 'Préparation des repas', slug: 'preparation-repas' },
    { name: 'Aide aux devoirs', slug: 'aide-devoirs' },
    { name: 'Bain et habillage', slug: 'bain-habillage' },
    { name: 'Promenade', slug: 'promenade' },
    { name: 'Activités éducatives', slug: 'activites-educatives' },
    { name: 'Ménage léger', slug: 'menage-leger' },
    { name: 'Lessive', slug: 'lessive' },
    { name: 'Courses', slug: 'courses' },
    { name: 'Cuisine', slug: 'cuisine-tache' },
  ];
  for (const t of tachesList) {
    await findOrCreateParameter(t.name, t.slug, undefined, tachesType?.id);
  }

  // Équipement ménager
  const equipementType = await typeBySlug('equipement');
  const equipements = [
    { name: 'Aspirateur', slug: 'aspirateur' },
    { name: 'Balai', slug: 'balai' },
    { name: 'Serpillière', slug: 'serpilliere' },
    { name: 'Produits de nettoyage', slug: 'produits-nettoyage' },
    { name: 'Machine à laver', slug: 'machine-laver' },
    { name: 'Fer à repasser', slug: 'fer-repasser' },
  ];
  for (const e of equipements) {
    await findOrCreateParameter(e.name, e.slug, undefined, equipementType?.id);
  }

  // Critères spécifiques
  const criteresType = await typeBySlug('criteres');
  const criteresList = [
    { name: 'Non-fumeur', slug: 'non-fumeur' },
    { name: 'Vacciné(e)', slug: 'vaccine' },
    { name: 'Permis de conduire', slug: 'permis-conduire' },
    { name: 'Véhiculé(e)', slug: 'vehicule' },
    { name: 'Premiers secours', slug: 'premiers-secours' },
    { name: 'Références vérifiables', slug: 'references-verifiables' },
  ];
  for (const c of criteresList) {
    await findOrCreateParameter(c.name, c.slug, undefined, criteresType?.id);
  }

  // Certifications
  const certifsType = await typeBySlug('certifications');
  const certifs = [
    { name: 'CAP Petite Enfance', slug: 'cap-petite-enfance' },
    { name: 'Auxiliaire de puériculture', slug: 'auxiliaire-puericulture' },
    { name: 'Diplôme d\'État d\'éducateur', slug: 'de-educateur' },
    { name: 'Formation premiers secours', slug: 'formation-premiers-secours' },
    { name: 'Aucune certification', slug: 'aucune-certification' },
  ];
  for (const c of certifs) {
    await findOrCreateParameter(c.name, c.slug, undefined, certifsType?.id);
  }

  // Besoins spécifiques
  const besoinsType = await typeBySlug('besoins');
  const besoinsList = [
    { name: 'Allergies alimentaires', slug: 'allergies-alimentaires' },
    { name: 'Régime spécial', slug: 'regime-special' },
    { name: 'Handicap', slug: 'handicap' },
    { name: 'Médical (injections, etc.)', slug: 'medical' },
    { name: 'Accompagnement scolaire', slug: 'accompagnement-scolaire' },
    { name: 'Aucun besoin spécial', slug: 'aucun-besoin-special' },
  ];
  for (const b of besoinsList) {
    await findOrCreateParameter(b.name, b.slug, undefined, besoinsType?.id);
  }

  // Garde enfants
  const gardeType = await typeBySlug('garde');
  const gardes = [
    { name: 'Garde à domicile', slug: 'garde-domicile' },
    { name: 'Garde partagée', slug: 'garde-partagee' },
    { name: 'Garde périscolaire', slug: 'garde-periscolaire' },
    { name: 'Garde occasionnelle', slug: 'garde-occasionnelle' },
    { name: 'Sortie d\'école', slug: 'sortie-ecole' },
  ];
  for (const g of gardes) {
    await findOrCreateParameter(g.name, g.slug, undefined, gardeType?.id);
  }

  // Aide ménagère
  const aideMenagereType = await typeBySlug('aide_menagere');
  const aideMenageres = [
    { name: 'Ménage complet', slug: 'menage-complet' },
    { name: 'Repassage', slug: 'repassage' },
    { name: 'Vaisselle', slug: 'vaisselle' },
    { name: 'Rangement', slug: 'rangement' },
    { name: 'Nettoyage vitres', slug: 'nettoyage-vitres' },
    { name: 'Grand ménage', slug: 'grand-menage' },
  ];
  for (const a of aideMenageres) {
    await findOrCreateParameter(a.name, a.slug, undefined, aideMenagereType?.id);
  }

  // Horaires souhaités
  const horaireSouhaiteType = await typeBySlug('horaire_souhaite');
  const horairesSouhaites = [
    { name: 'Matin (6h-12h)', slug: 'matin' },
    { name: 'Après-midi (12h-18h)', slug: 'apres-midi' },
    { name: 'Soirée (18h-22h)', slug: 'soiree' },
    { name: 'Nuit (22h-6h)', slug: 'nuit' },
    { name: 'Journée complète', slug: 'journee-complete' },
    { name: 'Weekend', slug: 'weekend-souhaite' },
  ];
  for (const h of horairesSouhaites) {
    await findOrCreateParameter(h.name, h.slug, undefined, horaireSouhaiteType?.id);
  }

  // Compétences spécifiques
  const competenceType = await typeBySlug('competence');
  const competences = [
    { name: 'Premiers secours', slug: 'premiers-secours-comp' },
    { name: 'Aide aux devoirs', slug: 'aide-devoirs-comp' },
    { name: 'Activités manuelles', slug: 'activites-manuelles' },
    { name: 'Musique', slug: 'musique' },
    { name: 'Sport', slug: 'sport' },
    { name: 'Langues étrangères', slug: 'langues-etrangeres' },
    { name: 'Cuisine', slug: 'cuisine-comp' },
  ];
  for (const c of competences) {
    await findOrCreateParameter(c.name, c.slug, undefined, competenceType?.id);
  }

  // Critères de sélection
  const criteresSelectionType = await typeBySlug('criteres_selection');
  const criteresSelections = [
    { name: 'Disponibilité immédiate', slug: 'disponibilite-immediate' },
    { name: 'Références requises', slug: 'references-requises' },
    { name: 'Casier judiciaire vierge', slug: 'casier-vierge' },
    { name: 'Expérience avec bébés', slug: 'experience-bebes' },
    { name: 'Expérience avec jumeaux', slug: 'experience-jumeaux' },
    { name: 'Patiente et pédagogue', slug: 'patiente-pedagogue' },
  ];
  for (const c of criteresSelections) {
    await findOrCreateParameter(c.name, c.slug, undefined, criteresSelectionType?.id);
  }

  // Disponibilité du prestataire
  const disponibiliteType = await typeBySlug('disponibilite');
  const disponibilites = [
    { name: 'Immédiate', slug: 'immediate' },
    { name: 'Sous 1 semaine', slug: 'sous-1-semaine' },
    { name: 'Sous 2 semaines', slug: 'sous-2-semaines' },
    { name: 'Sous 1 mois', slug: 'sous-1-mois' },
    { name: 'À convenir', slug: 'a-convenir' },
  ];
  for (const d of disponibilites) {
    await findOrCreateParameter(d.name, d.slug, undefined, disponibiliteType?.id);
  }

  // Zone géographique du prestataire
  const zoneGeoType = await typeBySlug('zone_geo');
  const zoneGeos = [
    { name: 'Abidjan', slug: 'abidjan' },
    { name: 'Bouaké', slug: 'bouake' },
    { name: 'Yamoussoukro', slug: 'yamoussoukro' },
    { name: 'San-Pédro', slug: 'san-pedro' },
    { name: 'Korhogo', slug: 'korhogo' },
  ];
  for (const z of zoneGeos) {
    await findOrCreateParameter(z.name, z.slug, undefined, zoneGeoType?.id);
  }

  console.log('✅ Parameters seeded');
}

// ============================================================
//  SEED: Users + Profiles
// ============================================================

async function seedUsersAndProfiles() {
  console.log('📦 Seeding Users & Profiles...');

  const adminRole = await getParamBySlug('admin');
  const nounouRole = await getParamBySlug('nounou');
  const parentRole = await getParamBySlug('parent');
  const adminProfil = await getParamBySlug('administrateur');
  const prestataireProfil = await getParamBySlug('prestataire');
  const clientProfil = await getParamBySlug('client');

  const hashedAdminPwd = await hashPassword('admin-nxs-20');
  const hashedNounouPwd = await hashPassword('nounou123');
  const hashedParentPwd = await hashPassword('parent123');

  // --- Admin ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@babynounu.com' },
    update: {},
    create: {
      slug: 'admin-01',
      email: 'admin@babynounu.com',
      password: hashedAdminPwd,
      roleId: adminRole?.id,
      typeProfilId: adminProfil?.id,
    },
  });

  // --- Nounous ---
  const nounousData = [
    {
      fullname: 'Aïcha Koné',
      email: 'aicha.kone@babynounu.com',
      phone: '+2250701020301',
      age: '28',
      anneesExperience: '5',
      tarifHoraire: '1500',
      tarifMensuel: '90000',
      status: 'disponible' as const,
      certif: 'Approved' as const,
      flexibiliteTarifaire: true,
      urgences: true,
      courteBiographie: 'Nounou expérimentée avec 5 ans d\'expérience dans la garde d\'enfants de 0 à 6 ans.',
      references: 'Famille Kouassi, Famille Bamba',
      evaluationPrecedentes: '4.5/5 — Très satisfaisante',
    },
    {
      fullname: 'Fatou Diabaté',
      email: 'fatou.diabate@babynounu.com',
      phone: '+2250701020302',
      age: '32',
      anneesExperience: '8',
      tarifHoraire: '2000',
      tarifMensuel: '120000',
      status: 'disponible' as const,
      certif: 'Approved' as const,
      flexibiliteTarifaire: false,
      urgences: false,
      courteBiographie: 'Aide ménagère et nounou, spécialisée dans les enfants en bas âge.',
      references: 'Famille Touré, Famille Cissé',
      evaluationPrecedentes: '5/5 — Excellente',
    },
    {
      fullname: 'Mariam Traoré',
      email: 'mariam.traore@babynounu.com',
      phone: '+2250701020303',
      age: '25',
      anneesExperience: '3',
      tarifHoraire: '1200',
      tarifMensuel: '75000',
      status: 'indisponible' as const,
      certif: 'Pending' as const,
      flexibiliteTarifaire: true,
      urgences: false,
      courteBiographie: 'Jeune nounou dynamique, disponible pour des gardes ponctuelles.',
      references: 'Famille Sangaré',
      evaluationPrecedentes: '4/5 — Bonne',
    },
    {
      fullname: 'Adjoua Kouassi',
      email: 'adjoua.kouassi@babynounu.com',
      phone: '+2250701020304',
      age: '35',
      anneesExperience: '10',
      tarifHoraire: '2500',
      tarifMensuel: '150000',
      status: 'disponible' as const,
      certif: 'Approved' as const,
      flexibiliteTarifaire: false,
      urgences: true,
      courteBiographie: 'Nounou professionnelle certifiée, plus de 10 ans d\'expérience.',
      references: 'Famille Brou, Famille N\'Guessan, Famille Yao',
      evaluationPrecedentes: '5/5 — Exceptionnelle',
    },
  ];

  const nounouUsers: { user: any; profil: any }[] = [];

  for (const n of nounousData) {
    const user = await prisma.user.upsert({
      where: { email: n.email },
      update: {},
      create: {
        slug: makeSlug(n.fullname),
        email: n.email,
        password: hashedNounouPwd,
        roleId: nounouRole?.id,
        typeProfilId: prestataireProfil?.id,
      },
    });

    const profil = await prisma.profilNounu.upsert({
      where: { phone: n.phone },
      update: {},
      create: {
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
        courteBiographie: n.courteBiographie,
        references: n.references,
        evaluationPrecedentes: n.evaluationPrecedentes,
        userId: user.id,
      },
    });

    nounouUsers.push({ user, profil });
  }

  // --- Parents ---
  const parentsData = [
    {
      fullname: 'Koffi Brou',
      email: 'koffi.brou@babynounu.com',
      phone: '+2250701020401',
      numberOfChildren: '2',
      budgetEstimated: '100000',
      informationsComplementaires: 'Recherche nounou pour garde de mes deux enfants (3 et 5 ans) du lundi au vendredi.',
    },
    {
      fullname: 'Aya N\'Guessan',
      email: 'aya.nguessan@babynounu.com',
      phone: '+2250701020402',
      numberOfChildren: '1',
      budgetEstimated: '80000',
      informationsComplementaires: 'Recherche aide ménagère à temps plein pour mon bébé de 8 mois.',
    },
    {
      fullname: 'Serge Yao',
      email: 'serge.yao@babynounu.com',
      phone: '+2250701020403',
      numberOfChildren: '3',
      budgetEstimated: '150000',
      informationsComplementaires: 'Famille nombreuse, recherche nounou expérimentée pour 3 enfants.',
    },
  ];

  const parentUsers: { user: any; profil: any }[] = [];

  for (const p of parentsData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        slug: makeSlug(p.fullname),
        email: p.email,
        password: hashedParentPwd,
        roleId: parentRole?.id,
        typeProfilId: clientProfil?.id,
      },
    });

    const existingParent = await prisma.profilParent.findFirst({ where: { email: p.email } });
    const profil = existingParent ?? await prisma.profilParent.create({
      data: {
        fullname: p.fullname,
        email: p.email,
        phone: p.phone,
        numberOfChildren: p.numberOfChildren,
        budgetEstimated: p.budgetEstimated,
        informationsComplementaires: p.informationsComplementaires,
        userId: user.id,
      },
    });

    parentUsers.push({ user, profil });
  }

  console.log(`✅ ${nounouUsers.length} nounous, ${parentUsers.length} parents, 1 admin seeded`);
  return { admin, nounouUsers, parentUsers };
}

// ============================================================
//  SEED: Preferences
// ============================================================

async function seedPreferences(
  nounouUsers: { user: any; profil: any }[],
  parentUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Preferences...');

  const getParam = async (slug: string) => {
    return getParamBySlug(slug);
  };

  const cocody = await getParam('cocody');
  const plateau = await getParam('plateau');
  const marcory = await getParam('marcory');
  const pleinTemps = await getParam('plein-temps');
  const weekend = await getParam('weekend');
  const gardeEnfants = await getParam('garde-enfants');
  const aideMenagere = await getParam('aide-menagere');
  const cuisine = await getParam('cuisine');
  const francais = await getParam('francais');
  const anglais = await getParam('anglais');
  const quotidien = await getParam('quotidien');
  const tranche1 = await getParam('1-3-ans');
  const tranche2 = await getParam('3-6-ans');

  // Preferences for nounous
  for (let i = 0; i < nounouUsers.length; i++) {
    const np = nounouUsers[i];
    await prisma.preference.create({
      data: {
        nounuId: np.profil.id,
        horaireDisponibleId: pleinTemps?.id,
        zoneDeTravailId: i % 2 === 0 ? cocody?.id : plateau?.id,
        typeServicesId:
          i % 3 === 0
            ? gardeEnfants?.id
            : i % 3 === 1
            ? aideMenagere?.id
            : cuisine?.id,
        trancheAgeEnfantsId: i % 2 === 0 ? tranche1?.id : tranche2?.id,
        langueParlerId: i % 2 === 0 ? francais?.id : anglais?.id,
        frequenceDesServicesId: quotidien?.id,
      },
    });
  }

  // Preferences for parents
  for (let i = 0; i < parentUsers.length; i++) {
    const pp = parentUsers[i];
    await prisma.preference.create({
      data: {
        parentId: pp.profil.id,
        horaireSouhaitesId: pleinTemps?.id,
        adressId: i % 2 === 0 ? cocody?.id : marcory?.id,
        typeServicesId: gardeEnfants?.id,
        trancheAgeEnfantsId: tranche2?.id,
        frequenceDesServicesId: quotidien?.id,
      },
    });
  }

  console.log('✅ Preferences seeded');
}

// ============================================================
//  SEED: Jobs
// ============================================================

async function seedJobs(parentUsers: { user: any; profil: any }[]) {
  console.log('📦 Seeding Jobs...');

  const jobsData = [
    {
      titre: 'Garde enfants 3 et 5 ans — Cocody',
      description: 'Recherche nounou pour garde de mes deux enfants (3 et 5 ans) du lundi au vendredi, 8h-17h.',
      moyensDeContact: 'Téléphone: 0701020401, Email: koffi.brou@babynounu.com',
      nombreEnfants: '2',
      tarifPropose: '100000',
      negociable: true,
      dateDebut: '2025-07-01',
      descriptionComplementaire: 'Logement possible si nécessaire. Cuisine requise pour les enfants.',
      userIdx: 0,
    },
    {
      titre: 'Aide ménagère + garde bébé 8 mois — Plateau',
      description: 'Recherche aide ménagère à temps plein pour s\'occuper de mon bébé de 8 mois et tâches ménagères légères.',
      moyensDeContact: 'Téléphone: 0701020402, Email: aya.nguessan@babynounu.com',
      nombreEnfants: '1',
      tarifPropose: '80000',
      negociable: false,
      dateDebut: '2025-07-15',
      descriptionComplementaire: 'Expérience avec bébés requise. Références obligatoires.',
      userIdx: 1,
    },
    {
      titre: 'Nounou expérimentée pour 3 enfants — Marcory',
      description: 'Famille nombreuse cherche nounou expérimentée pour 3 enfants (2, 4 et 7 ans).',
      moyensDeContact: 'Téléphone: 0701020403, Email: serge.yao@babynounu.com',
      nombreEnfants: '3',
      tarifPropose: '150000',
      negociable: true,
      dateDebut: '2025-08-01',
      descriptionComplementaire: 'Mission urgente. Aide aux devoirs incluse. Weekends occasionnels.',
      userIdx: 2,
    },
  ];

  const jobs: any[] = [];

  for (const j of jobsData) {
    const job = await prisma.job.create({
      data: {
        titre: j.titre,
        description: j.description,
        moyensDeContact: j.moyensDeContact,
        nombreEnfants: j.nombreEnfants,
        tarifPropose: j.tarifPropose,
        negociable: j.negociable,
        dateDebut: j.dateDebut,
        descriptionComplementaire: j.descriptionComplementaire,
        missionUrgente: j.userIdx === 2,
        inclusWeekend: j.userIdx === 2,
        userId: parentUsers[j.userIdx].user.id,
      },
    });
    jobs.push(job);
  }

  console.log(`✅ ${jobs.length} Jobs seeded`);
  return jobs;
}

// ============================================================
//  SEED: Job Applications
// ============================================================

async function seedJobApplications(
  jobs: any[],
  nounouUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Job Applications...');

  const apps = [
    { jobIdx: 0, nounouIdx: 0, isApply: true },
    { jobIdx: 0, nounouIdx: 3, isApply: true },
    { jobIdx: 1, nounouIdx: 1, isApply: true },
    { jobIdx: 1, nounouIdx: 2, isApply: false },
    { jobIdx: 2, nounouIdx: 3, isApply: true },
  ];

  for (const a of apps) {
    await prisma.jobApplication.create({
      data: {
        jobId: jobs[a.jobIdx].id,
        userId: nounouUsers[a.nounouIdx].user.id,
        isApply: a.isApply,
        limit: 5,
      },
    });
  }

  console.log(`✅ ${apps.length} Job Applications seeded`);
}

// ============================================================
//  SEED: Rooms & Messages
// ============================================================

async function seedRoomsAndMessages(
  nounouUsers: { user: any; profil: any }[],
  parentUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Rooms & Messages...');

  // Room between parent 0 and nounou 0
  const room1 = await prisma.room.create({
    data: {
      senderId: parentUsers[0].user.id,
      receiverId: nounouUsers[0].user.id,
      parentId: parentUsers[0].profil.id,
      nounuId: nounouUsers[0].profil.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        content: 'Bonjour Aïcha, êtes-vous disponible pour garder mes enfants en juillet ?',
        senderId: parentUsers[0].user.id,
        roomId: room1.id,
        type: 'Message',
      },
      {
        content: 'Bonjour ! Oui, je suis disponible. Pouvez-vous me donner plus de détails ?',
        senderId: nounouUsers[0].user.id,
        roomId: room1.id,
        type: 'Message',
      },
      {
        content: 'Ce serait du lundi au vendredi, 8h-17h, pour mes 2 enfants (3 et 5 ans).',
        senderId: parentUsers[0].user.id,
        roomId: room1.id,
        type: 'Message',
      },
      {
        content: 'Parfait, je propose 100000 FCFA/mois. Ça vous convient ?',
        senderId: nounouUsers[0].user.id,
        roomId: room1.id,
        type: 'Proposition',
        isProposition: true,
        propositionExpired: '2025-07-10',
      },
    ],
  });

  // Room between parent 1 and nounou 1
  const room2 = await prisma.room.create({
    data: {
      senderId: parentUsers[1].user.id,
      receiverId: nounouUsers[1].user.id,
      parentId: parentUsers[1].profil.id,
      nounuId: nounouUsers[1].profil.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        content: 'Bonjour Fatou, j\'ai vu votre profil et j\'aimerais discuter pour une garde de mon bébé.',
        senderId: parentUsers[1].user.id,
        roomId: room2.id,
        type: 'Message',
      },
      {
        content: 'Bonjour ! Avec plaisir. Quel est l\'âge de votre bébé ?',
        senderId: nounouUsers[1].user.id,
        roomId: room2.id,
        type: 'Message',
      },
    ],
  });

  // Room between parent 2 and nounou 3
  const room3 = await prisma.room.create({
    data: {
      senderId: parentUsers[2].user.id,
      receiverId: nounouUsers[3].user.id,
      parentId: parentUsers[2].profil.id,
      nounuId: nounouUsers[3].profil.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        content: 'Bonjour Adjoua, votre expérience semble parfaite pour ma famille. Êtes-vous disponible en août ?',
        senderId: parentUsers[2].user.id,
        roomId: room3.id,
        type: 'Message',
      },
      {
        content: 'Bonjour ! Oui, je suis disponible. J\'ai déjà travaillé avec des familles nombreuses.',
        senderId: nounouUsers[3].user.id,
        roomId: room3.id,
        type: 'Message',
      },
      {
        content: 'Je propose 150000 FCFA/mois pour 3 enfants, du lundi au samedi. Weekends possibles.',
        senderId: nounouUsers[3].user.id,
        roomId: room3.id,
        type: 'Proposition',
        isProposition: true,
        propositionExpired: '2025-07-20',
        proposalStatus: 'Pending',
      },
    ],
  });

  // Unread counts
  await prisma.roomUnreadCount.createMany({
    data: [
      { roomId: room1.id, userId: parentUsers[0].user.id, count: 1 },
      { roomId: room2.id, userId: nounouUsers[1].user.id, count: 1 },
      { roomId: room3.id, userId: parentUsers[2].user.id, count: 2 },
    ],
  });

  console.log('✅ 3 Rooms, 9 Messages, 3 UnreadCounts seeded');
}

// ============================================================
//  SEED: Contracts
// ============================================================

async function seedContracts(
  nounouUsers: { user: any; profil: any }[],
  parentUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Contracts...');

  const room = await prisma.room.findFirst({
    where: { senderId: parentUsers[0].user.id, receiverId: nounouUsers[0].user.id },
  });

  if (room) {
    const propositionMsg = await prisma.message.findFirst({
      where: { roomId: room.id, isProposition: true },
    });

    if (propositionMsg) {
      await prisma.contract.create({
        data: {
          roomId: room.id,
          messageId: propositionMsg.id,
          status: 'Pending',
        },
      });
    }
  }

  console.log('✅ Contracts seeded');
}

// ============================================================
//  SEED: Notifications
// ============================================================

async function seedNotifications(
  nounouUsers: { user: any; profil: any }[],
  parentUsers: { user: any; profil: any }[],
  jobs: any[],
) {
  console.log('📦 Seeding Notifications...');

  const notifications = [
    {
      type: 'job_application',
      message: 'Aïcha Koné a postulé à votre annonce "Garde enfants 3 et 5 ans — Cocody"',
      userId: parentUsers[0].user.id,
      senderId: nounouUsers[0].user.id,
      jobId: jobs[0].id,
      isActions: true,
    },
    {
      type: 'job_application',
      message: 'Adjoua Kouassi a postulé à votre annonce "Garde enfants 3 et 5 ans — Cocody"',
      userId: parentUsers[0].user.id,
      senderId: nounouUsers[3].user.id,
      jobId: jobs[0].id,
      isActions: true,
    },
    {
      type: 'new_message',
      message: 'Vous avez reçu un nouveau message de Koffi Brou',
      userId: nounouUsers[0].user.id,
      senderId: parentUsers[0].user.id,
    },
    {
      type: 'certif_update',
      message: 'Votre certification a été approuvée !',
      userId: nounouUsers[0].user.id,
    },
    {
      type: 'job_application',
      message: 'Fatou Diabaté a postulé à votre annonce "Aide ménagère + garde bébé 8 mois"',
      userId: parentUsers[1].user.id,
      senderId: nounouUsers[1].user.id,
      jobId: jobs[1].id,
      isActions: true,
    },
    {
      type: 'new_message',
      message: 'Vous avez reçu un nouveau message de Serge Yao',
      userId: nounouUsers[3].user.id,
      senderId: parentUsers[2].user.id,
    },
  ];

  for (const n of notifications) {
    await prisma.notification.create({ data: n });
  }

  console.log(`✅ ${notifications.length} Notifications seeded`);
}

// ============================================================
//  SEED: Payments & Subscriptions
// ============================================================

async function seedPaymentsAndSubscriptions(
  nounouUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Payments & Subscriptions...');

  const premiumType = await getParamBySlug('premium');
  const proType = await getParamBySlug('pro');

  // Payment + Subscription for nounou 0 (Premium)
  const payment1 = await prisma.payment.upsert({
    where: { transactionId: 'TXN-SEED-001' },
    update: {},
    create: {
      transactionId: 'TXN-SEED-001',
      operatorId: 'OP-SEED-001',
      paymentDate: new Date(),
      amount: 5000,
      currency: 'XOF',
      status: 'success',
      paymentType: 'subscription',
      paymentMethod: 'Orange Money',
      userId: nounouUsers[0].user.id,
    },
  });

  const existingSub1 = await prisma.subscription.findFirst({ where: { paymentId: payment1.id } });
  if (!existingSub1) {
    await prisma.subscription.create({
      data: {
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: nounouUsers[0].user.id,
        paymentId: payment1.id,
        typeId: premiumType?.id,
      },
    });
  }

  // Payment + Subscription for nounu 3 (Pro)
  const payment2 = await prisma.payment.upsert({
    where: { transactionId: 'TXN-SEED-002' },
    update: {},
    create: {
      transactionId: 'TXN-SEED-002',
      operatorId: 'OP-SEED-002',
      paymentDate: new Date(),
      amount: 10000,
      currency: 'XOF',
      status: 'success',
      paymentType: 'subscription',
      paymentMethod: 'MTN Money',
      userId: nounouUsers[3].user.id,
    },
  });

  const existingSub2 = await prisma.subscription.findFirst({ where: { paymentId: payment2.id } });
  if (!existingSub2) {
    await prisma.subscription.create({
      data: {
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        userId: nounouUsers[3].user.id,
        paymentId: payment2.id,
        typeId: proType?.id,
      },
    });
  }

  console.log('✅ 2 Payments, 2 Subscriptions seeded');
}

// ============================================================
//  SEED: Medias
// ============================================================

async function seedMedias(
  nounouUsers: { user: any; profil: any }[],
) {
  console.log('📦 Seeding Medias...');

  const photoProfilType = await getParamBySlug('photo_profil');
  const docType = await getParamBySlug('document');

  const medias = [
    {
      originalName: 'aicha-profile.jpg',
      filename: 'aicha-profile.jpg',
      path: '/uploads/profiles/aicha-profile.jpg',
      originalUrl: '/uploads/profiles/aicha-profile.jpg',
      userId: nounouUsers[0].user.id,
      typeMediaId: photoProfilType?.id,
    },
    {
      originalName: 'aicha-cni.jpg',
      filename: 'aicha-cni.jpg',
      path: '/uploads/documents/aicha-cni.jpg',
      originalUrl: '/uploads/documents/aicha-cni.jpg',
      userId: nounouUsers[0].user.id,
      typeMediaId: docType?.id,
    },
    {
      originalName: 'fatou-profile.jpg',
      filename: 'fatou-profile.jpg',
      path: '/uploads/profiles/fatou-profile.jpg',
      originalUrl: '/uploads/profiles/fatou-profile.jpg',
      userId: nounouUsers[1].user.id,
      typeMediaId: photoProfilType?.id,
    },
    {
      originalName: 'adjoua-profile.jpg',
      filename: 'adjoua-profile.jpg',
      path: '/uploads/profiles/adjoua-profile.jpg',
      originalUrl: '/uploads/profiles/adjoua-profile.jpg',
      userId: nounouUsers[3].user.id,
      typeMediaId: photoProfilType?.id,
    },
  ];

  for (const m of medias) {
    await prisma.media.create({ data: m });
  }

  console.log(`✅ ${medias.length} Medias seeded`);
}

// ============================================================
//  SEED: Permissions
// ============================================================

async function seedPermissions() {
  console.log('📦 Seeding Permissions...');

  const permissions = [
    // Admin - Dashboard
    { name: 'Voir le tableau de bord', slug: 'admin.dashboard.view', module: 'dashboard' },
    // Admin - Users
    { name: 'Lister les utilisateurs', slug: 'admin.users.read', module: 'users' },
    { name: 'Supprimer un utilisateur', slug: 'admin.users.delete', module: 'users' },
    { name: 'Restaurer un utilisateur', slug: 'admin.users.restore', module: 'users' },
    // Admin - Nounus
    { name: 'Voir les nounus en attente', slug: 'admin.nounus.read', module: 'nounus' },
    { name: 'Certifier un nounu', slug: 'admin.nounus.certify', module: 'nounus' },
    // Admin - Stats
    { name: 'Voir les statistiques', slug: 'admin.stats.read', module: 'stats' },
    // Admin - Settings
    { name: 'Voir les paramètres', slug: 'admin.settings.read', module: 'settings' },
    { name: 'Modifier les paramètres', slug: 'admin.settings.write', module: 'settings' },
  ];

  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.permission.create({ data: p });
    }
  }

  // Assign all permissions to admin role
  const adminRole = await prisma.parameter.findFirst({ where: { slug: 'admin' } });
  if (adminRole) {
    for (const p of permissions) {
      const perm = await prisma.permission.findUnique({ where: { slug: p.slug } });
      if (perm) {
        const existing = await prisma.rolePermission.findUnique({
          where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
        });
        if (!existing) {
          await prisma.rolePermission.create({
            data: { roleId: adminRole.id, permissionId: perm.id },
          });
        }
      }
    }
  }

  console.log(`✅ ${permissions.length} Permissions seeded and assigned to admin role`);
}

// ============================================================
//  SEED: App Settings
// ============================================================

async function seedAppSettings() {
  console.log('📦 Seeding AppSettings...');

  await prisma.appSetting.create({
    data: {
      appName: 'BabyNounu',
      version: '0.5.0',
      description: 'Plateforme de mise en relation parents et nounous',
      isActive: true,
      settings: {
        maxFreeJobApplications: 3,
        subscriptionDurationDays: 30,
        defaultCurrency: 'XOF',
        supportedLanguages: ['fr', 'en'],
      },
    },
  });

  console.log('✅ AppSettings seeded');
}

// ============================================================
//  PACKS
// ============================================================

async function seedPacks() {
  const essentialFeatures = [
    'view_profiles',
    'unlimited_messaging',
    'advanced_search',
  ];

  const premiumFeatures = [
    'view_profiles',
    'unlimited_messaging',
    'advanced_search',
    'priority_requests',
    'early_access_nounus',
    'priority_support',
  ];

  await prisma.pack.upsert({
    where: { slug: 'pack-essentiel' },
    update: {
      name: 'Pack Essentiel',
      description: 'Accédez aux profils des nounous et à la messagerie',
      price: 2000,
      currency: 'FCFA',
      durationDays: 0,
      priority: 0,
      isActive: true,
      features: essentialFeatures,
    },
    create: {
      name: 'Pack Essentiel',
      slug: 'pack-essentiel',
      description: 'Accédez aux profils des nounous et à la messagerie',
      price: 2000,
      currency: 'FCFA',
      durationDays: 0,
      priority: 0,
      isActive: true,
      features: essentialFeatures,
    },
  });

  await prisma.pack.upsert({
    where: { slug: 'pack-premium' },
    update: {
      name: 'Pack Premium',
      description: 'Toutes les fonctionnalités avec options prioritaires',
      price: 5000,
      currency: 'FCFA',
      durationDays: 0,
      priority: 1,
      isActive: true,
      features: premiumFeatures,
    },
    create: {
      name: 'Pack Premium',
      slug: 'pack-premium',
      description: 'Toutes les fonctionnalités avec options prioritaires',
      price: 5000,
      currency: 'FCFA',
      durationDays: 0,
      priority: 1,
      isActive: true,
      features: premiumFeatures,
    },
  });

  console.log('✅ Packs seeded/updated (Essentiel 2000 FCFA à vie, Premium 5000 FCFA à vie)');
}

// ============================================================
//  MAIN
// ============================================================

async function main() {
  console.log('\n🌱 Starting BabyNounu database seeding...\n');

  await seedTypeParameters();
  await seedParameters();
  const { nounouUsers, parentUsers } = await seedUsersAndProfiles();
  await seedPreferences(nounouUsers, parentUsers);
  const jobs = await seedJobs(parentUsers);
  await seedJobApplications(jobs, nounouUsers);
  await seedRoomsAndMessages(nounouUsers, parentUsers);
  await seedContracts(nounouUsers, parentUsers);
  await seedNotifications(nounouUsers, parentUsers, jobs);
  await seedPaymentsAndSubscriptions(nounouUsers);
  await seedMedias(nounouUsers);
  await seedPermissions();
  await seedAppSettings();
  await seedPacks();

  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('📋 Test credentials:');
  console.log('   Admin:   admin@babynounu.com / admin-nxs-20');
  console.log('   Nounou:  aicha.kone@babynounu.com / nounou123');
  console.log('   Parent:  koffi.brou@babynounu.com / parent123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
