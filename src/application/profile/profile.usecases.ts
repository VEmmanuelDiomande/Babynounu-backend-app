import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { IUserRepository, IProfileRepository } from '../../domain';
import { PaginationUtil } from '../../shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

const PREFERENCE_PARAM_FIELDS: Record<
  string,
  { typeSlug: string; nestedField: string }
> = {
  // Nounu
  adress: { typeSlug: 'adresse', nestedField: 'adress' },
  zone_de_travail: { typeSlug: 'zone', nestedField: 'zoneDeTravail' },
  horaire_disponible: { typeSlug: 'horaire', nestedField: 'horaireDisponible' },
  tranche_age_enfants: { typeSlug: 'tranche_age', nestedField: 'trancheAgeEnfants' },
  competance_specifique: { typeSlug: 'competence', nestedField: 'competanceSpecifique' },
  langue_parler: { typeSlug: 'langue', nestedField: 'langueParler' },
  certifications_criteres: { typeSlug: 'certifications', nestedField: 'certificationsCriteres' },
  // Parent
  type_services: { typeSlug: 'type_service', nestedField: 'typeServices' },
  besions_specifiques: { typeSlug: 'besoins', nestedField: 'besionsSpecifiques' },
  garde_enfants: { typeSlug: 'garde', nestedField: 'gardeEnfants' },
  aide_menagere: { typeSlug: 'aide_menagere', nestedField: 'aideMenagere' },
  frequence_des_services: { typeSlug: 'frequence', nestedField: 'frequenceDesServices' },
  horaire_souhaites: { typeSlug: 'horaire_souhaite', nestedField: 'horaireSouhaites' },
  zone_geographique_prestataire: { typeSlug: 'zone_geo', nestedField: 'zoneGeographiquePrestataire' },
  disponibility_du_prestataire: { typeSlug: 'disponibilite', nestedField: 'disponibilityPrestataire' },
  mode_de_paiement: { typeSlug: 'mode_paiement', nestedField: 'modeDePaiement' },
  taches: { typeSlug: 'taches', nestedField: 'taches' },
  criteres_selections: { typeSlug: 'criteres_selection', nestedField: 'criteresSelections' },
};

async function resolvePreferenceItemId(
  prisma: PrismaService,
  field: string,
  item: any,
): Promise<number | null> {
  if (item == null) return null;
  if (typeof item === 'number') return item;

  const config = PREFERENCE_PARAM_FIELDS[field];
  if (!config) return null;

  if (typeof item === 'string') {
    const param = await prisma.parameter.findFirst({
      where: {
        name: item,
        typeParameter: { slug: config.typeSlug },
        deletedAt: null,
      },
    });
    if (!param) {
      console.warn(`[resolvePreferenceItemId] Parameter not found for ${field} with name "${item}"`);
    }
    return param?.id ?? null;
  }

  if (typeof item === 'object') {
    const nested = item[config.nestedField];
    if (nested && nested.id != null) {
      return Number(nested.id);
    }
    if (item.id != null) {
      return Number(item.id);
    }
  }

  return null;
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string) {
    const profile = await this.userRepo.getProfile(userId);
    if (!profile) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return profile;
  }
}

@Injectable()
export class CreateParentProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    userId: string,
    data: {
      fullname?: string;
      email: string;
      phone: string;
      numberOfChildren: string;
      budgetEstimated: string;
      informationsComplementaires?: string;
    },
    rawData?: any,
    files: Express.Multer.File[] = [],
  ) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const existing = await this.profileRepo.findParentByUserId(userId);
    if (existing) throw new BadRequestException('Profil parent déjà existant');

    const parsed = await this.extractPreferences(rawData || {});

    const profile = await this.profileRepo.createParent({
      ...data,
      userId,
    });

    if (parsed.preferences.length > 0) {
      await this.createPreferences(profile.id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(userId, files);
    }

    return this.profileRepo.findParentById(profile.id);
  }

  private async extractPreferences(raw: any) {
    const prefMap: Record<string, string> = {
      type_services: 'typeServicesId',
      besions_specifiques: 'besionsSpecifiquesId',
      garde_enfants: 'gardeEnfantsId',
      aide_menagere: 'aideMenagereId',
      frequence_des_services: 'frequenceDesServicesId',
      horaire_souhaites: 'horaireSouhaitesId',
      adress: 'adressId',
      zone_geographique_prestataire: 'zoneGeographiquePrestataireId',
      competance_specifique: 'competanceSpecifiqueId',
      langue_parler: 'langueParlerId',
      disponibility_du_prestataire: 'disponibilityPrestataireId',
      mode_de_paiement: 'modeDePaiementId',
      taches: 'tachesId',
      criteres_selections: 'criteresSelectionsId',
    };

    const preferences: any[] = [];
    for (const [snakeKey, prismaField] of Object.entries(prefMap)) {
      const value = raw[snakeKey];
      if (!value) continue;
      try {
        const items = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(items)) {
          for (const item of items) {
            const paramId = await resolvePreferenceItemId(this.prisma, snakeKey, item);
            if (paramId != null) {
              preferences.push({ [prismaField]: paramId });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { preferences };
  }

  private async createPreferences(parentId: string, preferences: any[]) {
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { parentId, ...pref },
      });
    }
  }

  private async createMedia(userId: string, files: Express.Multer.File[]) {
    const fieldToTypeSlug: Record<string, string> = {
      imageParent: 'photo_profil',
    };

    for (const file of files) {
      const typeSlug = fieldToTypeSlug[file.fieldname];
      const typeMedia = typeSlug
        ? await this.prisma.parameter.findFirst({ where: { slug: typeSlug, deletedAt: null } })
        : null;

      await this.prisma.media.create({
        data: {
          userId,
          originalName: file.originalname,
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          originalUrl: `/uploads/${file.filename}`,
          typeMediaId: typeMedia?.id,
        },
      });
    }
  }
}

@Injectable()
export class UpdateParentProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, data: any, rawData?: any, files: Express.Multer.File[] = []) {
    const profile = await this.profileRepo.findParentByUserId(userId);
    if (!profile) throw new NotFoundException('Profil parent introuvable');

    const { id } = profile;
    await this.profileRepo.updateParent(id, data);

    const parsed = await this.extractPreferences(rawData || {});
    if (parsed.preferences.length > 0) {
      await this.replacePreferences(id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(profile.userId, files);
    }

    return this.profileRepo.findParentById(id);
  }

  async updateById(id: string, data: any, userId?: string, rawData?: any, files: Express.Multer.File[] = []) {
    const profile = await this.profileRepo.findParentById(id);
    if (!profile) throw new NotFoundException('Profil parent introuvable');
    if (userId && profile.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce profil");
    }

    await this.profileRepo.updateParent(id, data);

    const parsed = await this.extractPreferences(rawData || {});
    if (parsed.preferences.length > 0) {
      await this.replacePreferences(id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(profile.userId, files);
    }

    return this.profileRepo.findParentById(id);
  }

  private async extractPreferences(raw: any) {
    const prefMap: Record<string, string> = {
      type_services: 'typeServicesId',
      besions_specifiques: 'besionsSpecifiquesId',
      garde_enfants: 'gardeEnfantsId',
      aide_menagere: 'aideMenagereId',
      frequence_des_services: 'frequenceDesServicesId',
      horaire_souhaites: 'horaireSouhaitesId',
      adress: 'adressId',
      zone_geographique_prestataire: 'zoneGeographiquePrestataireId',
      competance_specifique: 'competanceSpecifiqueId',
      langue_parler: 'langueParlerId',
      disponibility_du_prestataire: 'disponibilityPrestataireId',
      mode_de_paiement: 'modeDePaiementId',
      taches: 'tachesId',
      criteres_selections: 'criteresSelectionsId',
    };

    const preferences: any[] = [];
    for (const [snakeKey, prismaField] of Object.entries(prefMap)) {
      const value = raw[snakeKey];
      if (!value) continue;
      try {
        const items = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(items)) {
          for (const item of items) {
            const paramId = await resolvePreferenceItemId(this.prisma, snakeKey, item);
            if (paramId != null) {
              preferences.push({ [prismaField]: paramId });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { preferences };
  }

  private async replacePreferences(parentId: string, preferences: any[]) {
    await this.prisma.preference.deleteMany({ where: { parentId } });
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { parentId, ...pref },
      });
    }
  }

  private async createMedia(userId: string, files: Express.Multer.File[]) {
    const fieldToTypeSlug: Record<string, string> = {
      imageParent: 'photo_profil',
    };

    for (const file of files) {
      const typeSlug = fieldToTypeSlug[file.fieldname];
      const typeMedia = typeSlug
        ? await this.prisma.parameter.findFirst({ where: { slug: typeSlug, deletedAt: null } })
        : null;

      await this.prisma.media.create({
        data: {
          userId,
          originalName: file.originalname,
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          originalUrl: `/uploads/${file.filename}`,
          typeMediaId: typeMedia?.id,
        },
      });
    }
  }
}

@Injectable()
export class CreateNounuProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    userId: string,
    data: {
      fullname: string;
      age: string;
      phone: string;
      anneesExperience: string;
      tarifHoraire: string;
      tarifMensuel: string;
      evaluationPrecedentes?: string;
      references?: string;
      courteBiographie?: string;
      status?: string;
      certif?: string;
    },
    rawData?: any,
    files: Express.Multer.File[] = [],
  ) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new BadRequestException('Utilisateur introuvable');

    const existing = await this.profileRepo.findNounuByUserId(userId);
    if (existing) throw new BadRequestException('Profil nounou déjà existant');

    const parsed = await this.extractPreferences(rawData || {});

    const profile = await this.profileRepo.createNounu({
      ...data,
      userId,
      status: data.status || 'disponible',
      certif: data.certif || 'Pending',
      points: 0,
      flexibiliteTarifaire: parsed.flexibiliteTarifaire,
      urgences: parsed.urgences,
      evaluationPrecedentes: data.evaluationPrecedentes || '',
      references: data.references || '',
      courteBiographie: data.courteBiographie || '',
    });

    if (parsed.preferences.length > 0) {
      await this.createPreferences(profile.id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(userId, files);
    }

    return this.profileRepo.findNounuById(profile.id);
  }

  private parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true' || val === 'True';
    return false;
  }

  private async extractPreferences(raw: any) {
    const flexibiliteTarifaire = this.parseBool(raw.flexibilite_tarifaire ?? raw.flexibiliteTarifaire);
    const urgences = this.parseBool(raw.urgences);

    const prefMap: Record<string, string> = {
      adress: 'adressId',
      zone_de_travail: 'zoneDeTravailId',
      horaire_disponible: 'horaireDisponibleId',
      tranche_age_enfants: 'trancheAgeEnfantsId',
      competance_specifique: 'competanceSpecifiqueId',
      langue_parler: 'langueParlerId',
      certifications_criteres: 'certificationsCriteresId',
    };

    const preferences: any[] = [];
    for (const [snakeKey, prismaField] of Object.entries(prefMap)) {
      const value = raw[snakeKey];
      if (!value) continue;
      try {
        const items = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(items)) {
          for (const item of items) {
            const paramId = await resolvePreferenceItemId(this.prisma, snakeKey, item);
            if (paramId != null) {
              preferences.push({ [prismaField]: paramId });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { flexibiliteTarifaire, urgences, preferences };
  }

  private async createPreferences(nounuId: string, preferences: any[]) {
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { nounuId, ...pref },
      });
    }
  }

  private async createMedia(userId: string, files: Express.Multer.File[]) {
    const fieldToTypeSlug: Record<string, string> = {
      imageNounu: 'photo_profil',
      documents: 'document',
      gallery: 'type_galery',
    };

    for (const file of files) {
      const typeSlug = fieldToTypeSlug[file.fieldname];
      const typeMedia = typeSlug
        ? await this.prisma.parameter.findFirst({ where: { slug: typeSlug, deletedAt: null } })
        : null;

      await this.prisma.media.create({
        data: {
          userId,
          originalName: file.originalname,
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          originalUrl: `/uploads/${file.filename}`,
          typeMediaId: typeMedia?.id,
        },
      });
    }
  }
}

@Injectable()
export class UpdateNounuProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    userId: string,
    data: any,
    rawData?: any,
    files: Express.Multer.File[] = [],
  ) {
    const profile = await this.profileRepo.findNounuByUserId(userId);
    if (!profile) throw new NotFoundException('Profil nounou introuvable');

    const { id } = profile;
    const parsed = await this.extractPreferences(rawData || {});

    const profileData: any = { ...data };
    if (rawData) {
      if ('flexibilite_tarifaire' in rawData || 'flexibiliteTarifaire' in rawData) {
        profileData.flexibiliteTarifaire = parsed.flexibiliteTarifaire;
      }
      if ('urgences' in rawData) {
        profileData.urgences = parsed.urgences;
      }
    }

    await this.profileRepo.updateNounu(id, profileData);

    if (parsed.preferences.length > 0) {
      await this.replacePreferences(id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(userId, files);
    }

    return this.profileRepo.findNounuById(id);
  }

  async updateById(id: string, data: any, userId?: string, rawData?: any, files: Express.Multer.File[] = []) {
    const profile = await this.profileRepo.findNounuById(id);
    if (!profile) throw new NotFoundException('Profil nounou introuvable');
    if (userId && profile.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à modifier ce profil");
    }

    const parsed = await this.extractPreferences(rawData || {});

    const profileData: any = { ...data };
    if (rawData) {
      if ('flexibilite_tarifaire' in rawData || 'flexibiliteTarifaire' in rawData) {
        profileData.flexibiliteTarifaire = parsed.flexibiliteTarifaire;
      }
      if ('urgences' in rawData) {
        profileData.urgences = parsed.urgences;
      }
    }

    await this.profileRepo.updateNounu(id, profileData);

    if (parsed.preferences.length > 0) {
      await this.replacePreferences(id, parsed.preferences);
    }

    if (files.length > 0) {
      await this.createMedia(profile.userId, files);
    }

    return this.profileRepo.findNounuById(id);
  }

  private parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true' || val === 'True';
    return false;
  }

  private async extractPreferences(raw: any) {
    const flexibiliteTarifaire = this.parseBool(raw.flexibilite_tarifaire ?? raw.flexibiliteTarifaire);
    const urgences = this.parseBool(raw.urgences);

    const prefMap: Record<string, string> = {
      adress: 'adressId',
      zone_de_travail: 'zoneDeTravailId',
      horaire_disponible: 'horaireDisponibleId',
      tranche_age_enfants: 'trancheAgeEnfantsId',
      competance_specifique: 'competanceSpecifiqueId',
      langue_parler: 'langueParlerId',
      certifications_criteres: 'certificationsCriteresId',
    };

    const preferences: any[] = [];
    for (const [snakeKey, prismaField] of Object.entries(prefMap)) {
      const value = raw[snakeKey];
      if (!value) continue;
      try {
        const items = typeof value === 'string' ? JSON.parse(value) : value;
        if (Array.isArray(items)) {
          for (const item of items) {
            const paramId = await resolvePreferenceItemId(this.prisma, snakeKey, item);
            if (paramId != null) {
              preferences.push({ [prismaField]: paramId });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { flexibiliteTarifaire, urgences, preferences };
  }

  private async replacePreferences(nounuId: string, preferences: any[]) {
    await this.prisma.preference.deleteMany({ where: { nounuId } });
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { nounuId, ...pref },
      });
    }
  }

  private async createMedia(userId: string, files: Express.Multer.File[]) {
    const fieldToTypeSlug: Record<string, string> = {
      imageNounu: 'photo_profil',
      documents: 'document',
      gallery: 'type_galery',
    };

    for (const file of files) {
      const typeSlug = fieldToTypeSlug[file.fieldname];

      if (typeSlug === 'photo_profil') {
        const typeMedia = await this.prisma.parameter.findFirst({
          where: { slug: typeSlug, deletedAt: null },
        });
        if (typeMedia) {
          await this.prisma.media.updateMany({
            where: { userId, typeMediaId: typeMedia.id, deletedAt: null },
            data: { deletedAt: new Date() },
          });
        }
      }

      const typeMedia = typeSlug
        ? await this.prisma.parameter.findFirst({ where: { slug: typeSlug, deletedAt: null } })
        : null;

      await this.prisma.media.create({
        data: {
          userId,
          originalName: file.originalname,
          filename: file.filename,
          path: `/uploads/${file.filename}`,
          originalUrl: `/uploads/${file.filename}`,
          typeMediaId: typeMedia?.id,
        },
      });
    }
  }
}

@Injectable()
export class GetNounuProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(nounuId: string) {
    const profile = await this.profileRepo.findNounuById(nounuId);
    if (!profile) throw new NotFoundException('Profil nounou introuvable');
    return profile;
  }
}

@Injectable()
export class GetMyNounuProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(userId: string) {
    const profile = await this.profileRepo.findNounuByUserId(userId);
    if (!profile) throw new NotFoundException('Profil nounou introuvable');
    return profile;
  }
}

@Injectable()
export class GetMyParentProfileUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(userId: string) {
    const profile = await this.profileRepo.findParentByUserId(userId);
    if (!profile) throw new NotFoundException('Profil parent introuvable');
    return profile;
  }
}

@Injectable()
export class GetAllNounusUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(filters: any, page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.profileRepo.findAllNounus(filters, PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class SearchNounusUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(data: any, page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data: result, total } = await this.profileRepo.searchNounus(data, PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(result, total, options);
  }
}

@Injectable()
export class DeleteNounuUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(id: string, userId?: string) {
    const nounu = await this.profileRepo.findNounuById(id);
    if (!nounu) throw new NotFoundException('Profil nounou introuvable');
    if (userId && nounu.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer ce profil");
    }
    return this.profileRepo.deleteNounu(id);
  }
}

@Injectable()
export class GetParentByIdUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(id: string) {
    const profile = await this.profileRepo.findParentById(id);
    if (!profile) throw new NotFoundException('Profil parent introuvable');
    return profile;
  }
}

@Injectable()
export class GetAllParentsUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(filters: any, page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.profileRepo.findAllParents(filters, PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class DeleteParentUseCase {
  constructor(
    @Inject('IProfileRepository') private readonly profileRepo: IProfileRepository,
  ) {}

  async execute(id: string) {
    const parent = await this.profileRepo.findParentById(id);
    if (!parent) throw new NotFoundException('Profil parent introuvable');
    return this.profileRepo.deleteParent(id);
  }
}
