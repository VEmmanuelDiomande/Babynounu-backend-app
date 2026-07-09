import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaJobRepository, PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PaginationUtil } from '../../shared';

@Injectable()
export class GetJobsUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(filters: any, page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.jobRepo.findAll(filters, PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetJobByIdUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(id: number) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Offre introuvable');
    return job;
  }
}

@Injectable()
export class CreateJobUseCase {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, data: any, files: Express.Multer.File[] = []) {
    const { preferences, jobFields } = await this.extractJobAndPreferences(data, userId);
    const job = await this.jobRepo.create(jobFields);

    if (preferences.length > 0) {
      await this.jobRepo.createPreferences(job.id, preferences);
    }

    if (files.length > 0) {
      await this.jobRepo.attachMedia(job.id, files);
    }

    return this.jobRepo.findById(job.id);
  }

  private async extractJobAndPreferences(data: any, userId: string) {
    const jobFields: any = {
      userId,
      titre: data.titre || '',
      description: data.description || '',
      moyensDeContact: data.moyens_de_contact || data.moyensDeContact || '',
      combinaisonService: this.parseBool(data.combinaison_service ?? data.combinaisonService),
      inclusWeekend: this.parseBool(data.inclus_weekend ?? data.inclusWeekend),
      nombreEnfants: data.nombre_enfants ?? data.nombreEnfants ?? null,
      experienceMinimun: this.parseBool(data.experience_minimun ?? data.experienceMinimun),
      anneeExperience: data.annee_experience ?? data.anneeExperience ?? null,
      tarifPropose: data.tarif ?? data.tarifPropose ?? null,
      negociable: this.parseBool(data.negociable),
      dateDebut: (data.date_debut ?? data.dateDebut) || '',
      missionUrgente: this.parseBool(data.mission_urgente ?? data.missionUrgente),
      descriptionComplementaire: (data.description_complementaire ?? data.descriptionComplementaire) || '',
      periode: data.periode ?? null,
    };

    const prefMap: Record<string, { prismaField: string; typeSlug: string }> = {
      adress: { prismaField: 'adressId', typeSlug: 'adresse' },
      zone_de_travail: { prismaField: 'zoneDeTravailId', typeSlug: 'zone' },
      type_services: { prismaField: 'typeServicesId', typeSlug: 'type_service' },
      taches: { prismaField: 'tachesId', typeSlug: 'taches' },
      frequence_des_services: { prismaField: 'frequenceDesServicesId', typeSlug: 'frequence' },
      horaire_souhaites: { prismaField: 'horaireSouhaitesId', typeSlug: 'horaire_souhaite' },
      garde_enfants: { prismaField: 'gardeEnfantsId', typeSlug: 'garde' },
      besions_specifiques: { prismaField: 'besionsSpecifiquesId', typeSlug: 'besoins' },
      competance_specifique: { prismaField: 'competanceSpecifiqueId', typeSlug: 'competence' },
      langue_parler: { prismaField: 'langueParlerId', typeSlug: 'langue' },
      aide_menagere: { prismaField: 'aideMenagereId', typeSlug: 'aide_menagere' },
      equipement_menager: { prismaField: 'equipementMenagerId', typeSlug: 'equipement' },
      certifications_criteres: { prismaField: 'certificationsCriteresId', typeSlug: 'certifications' },
      criteres_selections: { prismaField: 'criteresSelectionsId', typeSlug: 'criteres_selection' },
    };

    const preferences: any[] = [];
    for (const [snakeKey, { prismaField, typeSlug }] of Object.entries(prefMap)) {
      const raw = data[snakeKey];
      if (!raw) continue;
      try {
        const items = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(items)) {
          for (const item of items) {
            const id = await this.resolvePreferenceItemId(item, typeSlug);
            if (id !== null) {
              preferences.push({ [prismaField]: id });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { preferences, jobFields };
  }

  private async resolvePreferenceItemId(item: any, typeSlug: string): Promise<number | null> {
    if (item === null || item === undefined) return null;

    if (typeof item === 'number' && !isNaN(item)) return item;
    if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);

    if (typeof item === 'object') {
      const rawId = item?.id;
      if (rawId !== undefined && rawId !== null) {
        const idNum = typeof rawId === 'string' ? Number(rawId) : rawId;
        if (!isNaN(idNum)) return idNum;
      }
    }

    const name = typeof item === 'string' ? item : item?.name;
    if (!name || typeof name !== 'string') return null;

    const param = await this.prisma.parameter.findFirst({
      where: {
        name,
        typeParameter: { slug: typeSlug },
        deletedAt: null,
      },
    });

    return param?.id ?? null;
  }

  private parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true' || val === 'True';
    return false;
  }
}

@Injectable()
export class UpdateJobUseCase {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(id: number, userId: string, data: any, files: Express.Multer.File[] = []) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Offre introuvable');
    if (job.userId !== userId) throw new BadRequestException('Vous n\'êtes pas autorisé à modifier cette offre');

    const { preferences, jobFields } = await this.extractJobAndPreferences(data);
    await this.jobRepo.update(id, jobFields);

    if (preferences.length > 0) {
      await this.jobRepo.replacePreferences(id, preferences);
    }

    if (files.length > 0) {
      await this.jobRepo.attachMedia(id, files);
    }

    return this.jobRepo.findById(id);
  }

  private async extractJobAndPreferences(data: any) {
    const jobFields: any = {};

    if (data.titre !== undefined) jobFields.titre = data.titre;
    if (data.description !== undefined) jobFields.description = data.description;
    if (data.moyens_de_contact !== undefined) jobFields.moyensDeContact = data.moyens_de_contact;
    if (data.combinaison_service !== undefined) jobFields.combinaisonService = this.parseBool(data.combinaison_service);
    if (data.inclus_weekend !== undefined) jobFields.inclusWeekend = this.parseBool(data.inclus_weekend);
    if (data.nombre_enfants !== undefined) jobFields.nombreEnfants = data.nombre_enfants;
    if (data.experience_minimun !== undefined) jobFields.experienceMinimun = this.parseBool(data.experience_minimun);
    if (data.annee_experience !== undefined) jobFields.anneeExperience = data.annee_experience;
    if (data.tarif !== undefined) jobFields.tarifPropose = data.tarif;
    if (data.negociable !== undefined) jobFields.negociable = this.parseBool(data.negociable);
    if (data.date_debut !== undefined) jobFields.dateDebut = data.date_debut;
    if (data.mission_urgente !== undefined) jobFields.missionUrgente = this.parseBool(data.mission_urgente);
    if (data.description_complementaire !== undefined) jobFields.descriptionComplementaire = data.description_complementaire;
    if (data.periode !== undefined) jobFields.periode = data.periode;

    const prefMap: Record<string, { prismaField: string; typeSlug: string }> = {
      adress: { prismaField: 'adressId', typeSlug: 'adresse' },
      zone_de_travail: { prismaField: 'zoneDeTravailId', typeSlug: 'zone' },
      type_services: { prismaField: 'typeServicesId', typeSlug: 'type_service' },
      taches: { prismaField: 'tachesId', typeSlug: 'taches' },
      frequence_des_services: { prismaField: 'frequenceDesServicesId', typeSlug: 'frequence' },
      horaire_souhaites: { prismaField: 'horaireSouhaitesId', typeSlug: 'horaire_souhaite' },
      garde_enfants: { prismaField: 'gardeEnfantsId', typeSlug: 'garde' },
      besions_specifiques: { prismaField: 'besionsSpecifiquesId', typeSlug: 'besoins' },
      competance_specifique: { prismaField: 'competanceSpecifiqueId', typeSlug: 'competence' },
      langue_parler: { prismaField: 'langueParlerId', typeSlug: 'langue' },
      aide_menagere: { prismaField: 'aideMenagereId', typeSlug: 'aide_menagere' },
      equipement_menager: { prismaField: 'equipementMenagerId', typeSlug: 'equipement' },
      certifications_criteres: { prismaField: 'certificationsCriteresId', typeSlug: 'certifications' },
      criteres_selections: { prismaField: 'criteresSelectionsId', typeSlug: 'criteres_selection' },
    };

    const preferences: any[] = [];
    for (const [snakeKey, { prismaField, typeSlug }] of Object.entries(prefMap)) {
      const raw = data[snakeKey];
      if (!raw) continue;
      try {
        const items = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(items)) {
          for (const item of items) {
            const id = await this.resolvePreferenceItemId(item, typeSlug);
            if (id !== null) {
              preferences.push({ [prismaField]: id });
            }
          }
        }
      } catch {
        // skip malformed JSON
      }
    }

    return { preferences, jobFields };
  }

  private async resolvePreferenceItemId(item: any, typeSlug: string): Promise<number | null> {
    if (item === null || item === undefined) return null;

    if (typeof item === 'number' && !isNaN(item)) return item;
    if (typeof item === 'string' && !isNaN(Number(item))) return Number(item);

    if (typeof item === 'object') {
      const rawId = item?.id;
      if (rawId !== undefined && rawId !== null) {
        const idNum = typeof rawId === 'string' ? Number(rawId) : rawId;
        if (!isNaN(idNum)) return idNum;
      }
    }

    const name = typeof item === 'string' ? item : item?.name;
    if (!name || typeof name !== 'string') return null;

    const param = await this.prisma.parameter.findFirst({
      where: {
        name,
        typeParameter: { slug: typeSlug },
        deletedAt: null,
      },
    });

    return param?.id ?? null;
  }

  private parseBool(val: any): boolean {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val === 'true' || val === 'True';
    return false;
  }
}

@Injectable()
export class DeleteJobUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(id: number, userId: string) {
    const job = await this.jobRepo.findById(id);
    if (!job) throw new NotFoundException('Offre introuvable');
    if (job.userId !== userId) throw new BadRequestException('Vous n\'êtes pas autorisé à supprimer cette offre');
    return this.jobRepo.delete(id);
  }
}

@Injectable()
export class ApplyToJobUseCase {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(userId: string, jobId: number) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) throw new NotFoundException('Offre introuvable');
    if (job.userId === userId) throw new BadRequestException('Vous ne pouvez pas postuler à votre propre offre');
    const application = await this.jobRepo.applyToJob(userId, jobId);

    await this.notifRepo.create({
      type: 'CANDIDATURE',
      title: 'Nouvelle candidature',
      message: `Un nouveau candidat a postulé à votre offre: ${job.titre}`,
      userId: job.userId,
      senderId: userId,
      jobId,
      tolinkId: String(jobId),
    });

    return application;
  }
}

@Injectable()
export class GetJobApplicationsUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(jobId: number) {
    return this.jobRepo.findApplicationsByJob(jobId);
  }
}

@Injectable()
export class GetMyApplicationsUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(userId: string) {
    return this.jobRepo.findApplicationsByUser(userId);
  }
}

@Injectable()
export class GetJobOwnerApplicationsUseCase {
  constructor(private readonly jobRepo: PrismaJobRepository) {}

  async execute(ownerUserId: string) {
    return this.jobRepo.findApplicationsByJobOwner(ownerUserId);
  }
}
