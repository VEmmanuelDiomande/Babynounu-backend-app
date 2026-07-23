import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ============================================================
//  HELPERS
// ============================================================

async function findOrCreateTypeParameter(slug: string, name: string) {
  const existing = await prisma.typeParameter.findFirst({ where: { slug } });
  if (existing) return existing;
  return prisma.typeParameter.create({ data: { slug, name } });
}

async function findOrCreateParameter(name: string, slug: string, priority?: number, typeParameterId?: number) {
  const existing = await prisma.parameter.findFirst({ where: { slug } });
  if (existing) {
    if (priority !== undefined || typeParameterId !== undefined) {
      await prisma.parameter.update({ where: { id: existing.id }, data: { priority, typeParameterId } });
    }
    return existing;
  }
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
//  SEED: Parameters (données de référence)
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

  // Adresses
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
//  SEED: Permissions
// ============================================================

async function seedPermissions() {
  console.log('📦 Seeding Permissions...');

  const permissions = [
    { name: 'Voir le tableau de bord', slug: 'admin.dashboard.view', module: 'dashboard' },
    { name: 'Lister les utilisateurs', slug: 'admin.users.read', module: 'users' },
    { name: 'Supprimer un utilisateur', slug: 'admin.users.delete', module: 'users' },
    { name: 'Restaurer un utilisateur', slug: 'admin.users.restore', module: 'users' },
    { name: 'Voir les nounus en attente', slug: 'admin.nounus.read', module: 'nounus' },
    { name: 'Certifier un nounu', slug: 'admin.nounus.certify', module: 'nounus' },
    { name: 'Voir les statistiques', slug: 'admin.stats.read', module: 'stats' },
    { name: 'Voir les paramètres', slug: 'admin.settings.read', module: 'settings' },
    { name: 'Modifier les paramètres', slug: 'admin.settings.write', module: 'settings' },
    { name: 'Gérer les packs', slug: 'admin.packs.write', module: 'packs' },
    { name: 'Gérer les abonnements', slug: 'admin.subscriptions.write', module: 'subscriptions' },
  ];

  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({ where: { slug: p.slug } });
    if (!existing) {
      await prisma.permission.create({ data: p });
    } else {
      await prisma.permission.update({ where: { slug: p.slug }, data: p });
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

  const existing = await prisma.appSetting.findFirst();

  const settingsData = {
    appName: 'BabyNounu',
    version: '1.0.0',
    description: 'Plateforme de mise en relation parents et nounous en Côte d\'Ivoire',
    isActive: true,
    settings: {
      maxFreeJobApplications: 3,
      defaultCurrency: 'XOF',
      supportedLanguages: ['fr', 'en'],
      paymentGateway: 'cinetpay',
      cinetpayApiKey: process.env.CINETPAY_API_KEY || '',
      cinetpaySiteId: process.env.CINETPAY_SITE_ID || '',
      cinetpayLang: process.env.CINETPAY_LANG || 'fr',
      supportEmail: 'support@babynounu.com',
      maxMediaUploads: 10,
      maxProfilePhotos: 5,
      jobApplicationLimit: 5,
      notificationRetentionDays: 90,
      features: {
        advanced_search: true,
        early_access_nounus: true,
        priority_requests: true,
        priority_support: true,
        view_profiles: true,
        unlimited_messaging: true,
      },
    },
  };

  if (existing) {
    await prisma.appSetting.update({ where: { id: existing.id }, data: settingsData });
  } else {
    await prisma.appSetting.create({ data: settingsData });
  }

  console.log('✅ AppSettings seeded');
}

// ============================================================
//  SEED: Packs
// ============================================================

async function seedPacks() {
  console.log('📦 Seeding Packs...');

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
      description: 'Accédez aux profils des nounous et à la messagerie illimitée. Idéal pour les parents qui cherchent une nounu.',
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
      description: 'Accédez aux profils des nounous et à la messagerie illimitée. Idéal pour les parents qui cherchent une nounu.',
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
      description: 'Toutes les fonctionnalités du Pack Essentiel + demandes prioritaires, accès anticipé aux nouvelles nounous et support prioritaire.',
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
      description: 'Toutes les fonctionnalités du Pack Essentiel + demandes prioritaires, accès anticipé aux nouvelles nounous et support prioritaire.',
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
  console.log('\n⚙️  Starting BabyNounu config seeding...\n');

  await seedTypeParameters();
  await seedParameters();
  await seedPermissions();
  await seedAppSettings();
  await seedPacks();

  console.log('\n🎉 Config seeding completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Config seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
