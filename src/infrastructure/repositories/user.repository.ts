import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IUserRepository, IProfileRepository, UserEntity, UserProfile } from '../../domain';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async findBySlug(slug: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({ where: { slug } });
    if (!user) return null;
    return this.mapToEntity(user);
  }

  async create(data: { slug: string; email: string; password: string; roleId?: number; typeProfilId?: number }): Promise<UserEntity> {
    const user = await this.prisma.user.create({
      data: {
        slug: data.slug,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
        typeProfilId: data.typeProfilId,
      },
    });
    return this.mapToEntity(user);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        roleId: data.roleId,
        typeProfilId: data.typeProfilId,
      },
    });
    return this.mapToEntity(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getProfile(id: string): Promise<UserProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        typeProfil: true,
        medias: { include: { typeMedia: true } },
        parents: { include: { preferences: true } },
        nounus: { include: { preferences: true } },
        abonnements: true,
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      slug: user.slug,
      role: user.role ? { id: user.role.id, slug: user.role.slug || '', name: user.role.name } : undefined,
      typeProfil: user.typeProfil ? { id: user.typeProfil.id, slug: user.typeProfil.slug || '', name: user.typeProfil.name } : undefined,
      medias: user.medias.map((m) => ({
        id: m.id,
        originalName: m.originalName,
        filename: m.filename,
        path: m.path,
        originalUrl: m.originalUrl || undefined,
        userId: m.userId || undefined,
        typeMediaId: m.typeMediaId || undefined,
      })),
      parent: user.parents,
      nounu: user.nounus,
      abonnements: user.abonnements,
    };
  }

  async findParameterBySlug(slug: string): Promise<{ id: number; slug: string; name: string } | null> {
    const parameter = await this.prisma.parameter.findFirst({ where: { slug } });
    if (!parameter) return null;
    return { id: parameter.id, slug: parameter.slug, name: parameter.name };
  }

  private mapToEntity(user: any): UserEntity {
    return {
      id: user.id,
      slug: user.slug,
      email: user.email,
      password: user.password,
      accessToken: user.accessToken || undefined,
      refreshToken: user.refreshToken || undefined,
      roleId: user.roleId || undefined,
      typeProfilId: user.typeProfilId || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt || undefined,
    };
  }
}

@Injectable()
export class PrismaProfileRepository implements IProfileRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findParentByUserId(userId: string) {
    return this.prisma.profilParent.findFirst({
      where: { userId },
      include: {
        user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
        preferences: {
          include: {
            adress: true,
            zoneDeTravail: true,
            horaireDisponible: true,
            trancheAgeEnfants: true,
            competanceSpecifique: true,
            langueParler: true,
            typeServices: true,
            frequenceDesServices: true,
            horaireSouhaites: true,
            gardeEnfants: true,
            aideMenagere: true,
            modeDePaiement: true,
            taches: true,
            equipementMenager: true,
            disponibilityPrestataire: true,
            zoneGeographiquePrestataire: true,
            criteresSelections: true,
            certificationsCriteres: true,
            besionsSpecifiques: true,
            criteresSpecifiques: true,
          },
        },
      },
    });
  }

  async findNounuByUserId(userId: string) {
    return this.prisma.profilNounu.findFirst({
      where: { userId },
      include: {
        user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
        preferences: {
          include: {
            adress: true,
            zoneDeTravail: true,
            horaireDisponible: true,
            trancheAgeEnfants: true,
            competanceSpecifique: true,
            langueParler: true,
            typeServices: true,
            frequenceDesServices: true,
            horaireSouhaites: true,
            gardeEnfants: true,
            aideMenagere: true,
            modeDePaiement: true,
            taches: true,
            equipementMenager: true,
            disponibilityPrestataire: true,
            zoneGeographiquePrestataire: true,
            criteresSelections: true,
            certificationsCriteres: true,
            besionsSpecifiques: true,
            criteresSpecifiques: true,
          },
        },
      },
    });
  }

  async findNounuById(id: string) {
    return this.prisma.profilNounu.findUnique({
      where: { id },
      include: {
        user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
        preferences: {
          include: {
            adress: true,
            zoneDeTravail: true,
            horaireDisponible: true,
            trancheAgeEnfants: true,
            competanceSpecifique: true,
            langueParler: true,
            typeServices: true,
            frequenceDesServices: true,
            horaireSouhaites: true,
            gardeEnfants: true,
            aideMenagere: true,
            modeDePaiement: true,
            taches: true,
            equipementMenager: true,
            disponibilityPrestataire: true,
            zoneGeographiquePrestataire: true,
            criteresSelections: true,
            certificationsCriteres: true,
            besionsSpecifiques: true,
            criteresSpecifiques: true,
          },
        },
      },
    });
  }

  async findParentById(id: string) {
    return this.prisma.profilParent.findUnique({
      where: { id },
      include: {
        user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
        preferences: {
          include: {
            adress: true,
            zoneDeTravail: true,
            horaireDisponible: true,
            trancheAgeEnfants: true,
            competanceSpecifique: true,
            langueParler: true,
            typeServices: true,
            frequenceDesServices: true,
            horaireSouhaites: true,
            gardeEnfants: true,
            aideMenagere: true,
            modeDePaiement: true,
            taches: true,
            equipementMenager: true,
            disponibilityPrestataire: true,
            zoneGeographiquePrestataire: true,
            criteresSelections: true,
            certificationsCriteres: true,
            besionsSpecifiques: true,
            criteresSpecifiques: true,
          },
        },
      },
    });
  }

  async createParent(data: any) {
    return this.prisma.profilParent.create({ data });
  }

  async updateParent(id: string, data: any) {
    return this.prisma.profilParent.update({ where: { id }, data });
  }

  async createNounu(data: any) {
    return this.prisma.profilNounu.create({ data });
  }

  async updateNounu(id: string, data: any) {
    return this.prisma.profilNounu.update({ where: { id }, data });
  }

  async findAllNounus(filters: any, skip: number, limit: number) {
    const where: any = { deletedAt: null };

    if (filters.search) {
      where.fullname = { contains: filters.search };
    }
    if (filters.city) {
      where.preferences = { some: { adress: { slug: { contains: filters.city } } } };
    }
    if (filters.availability) {
      where.status = filters.availability;
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.type && filters.type !== 'all') {
      where.user = { typeProfil: { slug: filters.type } };
    }

    const [rawData, total] = await Promise.all([
      this.prisma.profilNounu.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
          preferences: {
            include: {
              adress: true,
              zoneDeTravail: true,
              horaireDisponible: true,
              trancheAgeEnfants: true,
              competanceSpecifique: true,
              langueParler: true,
              typeServices: true,
              frequenceDesServices: true,
              horaireSouhaites: true,
              gardeEnfants: true,
              aideMenagere: true,
              modeDePaiement: true,
              taches: true,
              equipementMenager: true,
              disponibilityPrestataire: true,
              zoneGeographiquePrestataire: true,
              criteresSelections: true,
              certificationsCriteres: true,
              besionsSpecifiques: true,
              criteresSpecifiques: true,
            },
          },
        },
      }),
      this.prisma.profilNounu.count({ where }),
    ]);

    const data = rawData.map((item: any) => this.mapNounuForFrontend(item));

    return { data, total };
  }

  async findAllParents(filters: any, skip: number, limit: number) {
    const where: any = { deletedAt: null };

    if (filters.search) {
      where.fullname = { contains: filters.search };
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }

    const [data, total] = await Promise.all([
      this.prisma.profilParent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
          preferences: true,
        },
      }),
      this.prisma.profilParent.count({ where }),
    ]);

    return { data, total };
  }

  async searchNounus(data: any, skip: number, limit: number) {
    const where: any = { deletedAt: null };

    if (data.fullname) {
      where.fullname = { contains: data.fullname };
    }

    if (data.adress && data.adress.length > 0) {
      where.preferences = { some: { adressId: { in: data.adress } } };
    }
    if (data.zone_de_travail && data.zone_de_travail.length > 0) {
      where.preferences = { some: { zoneDeTravailId: { in: data.zone_de_travail } } };
    }
    if (data.horaire_disponible && data.horaire_disponible.length > 0) {
      where.preferences = { some: { horaireDisponibleId: { in: data.horaire_disponible } } };
    }
    if (data.tranche_age_enfants && data.tranche_age_enfants.length > 0) {
      where.preferences = { some: { trancheAgeEnfantsId: { in: data.tranche_age_enfants } } };
    }
    if (data.competance_specifique && data.competance_specifique.length > 0) {
      where.preferences = { some: { competanceSpecifiqueId: { in: data.competance_specifique } } };
    }
    if (data.langue_parler && data.langue_parler.length > 0) {
      where.preferences = { some: { langueParlerId: { in: data.langue_parler } } };
    }

    const [rawResult, total] = await Promise.all([
      this.prisma.profilNounu.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
          preferences: {
            include: {
              adress: true,
              zoneDeTravail: true,
              horaireDisponible: true,
              trancheAgeEnfants: true,
              competanceSpecifique: true,
              langueParler: true,
              typeServices: true,
              frequenceDesServices: true,
              horaireSouhaites: true,
              gardeEnfants: true,
              aideMenagere: true,
              modeDePaiement: true,
              taches: true,
              equipementMenager: true,
              disponibilityPrestataire: true,
              zoneGeographiquePrestataire: true,
              criteresSelections: true,
              certificationsCriteres: true,
              besionsSpecifiques: true,
              criteresSpecifiques: true,
            },
          },
        },
      }),
      this.prisma.profilNounu.count({ where }),
    ]);

    const result = rawResult.map((item: any) => this.mapNounuForFrontend(item));

    return { data: result, total };
  }

  async deleteNounu(id: string) {
    await this.prisma.profilNounu.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deleteParent(id: string) {
    await this.prisma.profilParent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapNounuForFrontend(item: any) {
    const medias = (item.user?.medias || []).filter((m: any) => !m.deletedAt);
    const profileImage = medias.find((m: any) => m.typeMedia?.slug === 'profil' || m.typeMedia?.slug === 'photo_profil') || medias[0];
    const image = profileImage
      ? { ...profileImage, originalUrl: profileImage.originalUrl || profileImage.path || profileImage.url || '' }
      : medias[0]
        ? { ...medias[0], originalUrl: medias[0].originalUrl || medias[0].path || medias[0].url || '' }
        : undefined;

    const preferences = item.preferences?.map((pref: any) => ({
      ...pref,
      adress: pref.adress ? [pref.adress] : [],
      horaire_disponible: pref.horaireDisponible ? [pref.horaireDisponible] : [],
      zone_de_travail: pref.zoneDeTravail ? [pref.zoneDeTravail] : [],
      tranche_age_enfants: pref.trancheAgeEnfants ? [pref.trancheAgeEnfants] : [],
      competance_specifique: pref.competanceSpecifique ? [pref.competanceSpecifique] : [],
      langue_parler: pref.langueParler ? [pref.langueParler] : [],
      type_services: pref.typeServices ? [pref.typeServices] : [],
      frequence_des_services: pref.frequenceDesServices ? [pref.frequenceDesServices] : [],
    }));

    const certifMap: Record<string, string> = {
      'Approved': 'Accepted',
      'Pending': 'Pending',
      'Rejected': 'Rejected',
    };

    return {
      id: item.id,
      fullname: item.fullname,
      age: item.age,
      bio: item.bio,
      status: item.status,
      certif: certifMap[item.certif] || item.certif,
      rating: item.rating,
      annees_experience: item.anneesExperience,
      tarif_horaire: item.tarifHoraire,
      tarif_mensuel: item.tarifMensuel,
      courte_biographie: item.courteBiographie,
      evaluation_precedentes: item.evaluationPrecedentes,
      flexibilite_tarifaire: item.flexibiliteTarifaire,
      type: 'nounu',
      userId: item.userId,
      image,
      preferences,
    };
  }
}
