import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaJobRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: any, skip: number, limit: number) {
    const where: any = { deletedAt: null, suspended: false };

    if (filters.titre) where.titre = { contains: filters.titre };
    if (filters.description) where.description = { contains: filters.description };
    if (filters.missionUrgente !== undefined) where.missionUrgente = filters.missionUrgente === 'true' || filters.missionUrgente === true;
    if (filters.negociable !== undefined) where.negociable = filters.negociable === 'true' || filters.negociable === true;
    if (filters.inclusWeekend !== undefined) where.inclusWeekend = filters.inclusWeekend === 'true' || filters.inclusWeekend === true;
    if (filters.experienceMinimun !== undefined) where.experienceMinimun = filters.experienceMinimun === 'true' || filters.experienceMinimun === true;
    if (filters.combinaisonService !== undefined) where.combinaisonService = filters.combinaisonService === 'true' || filters.combinaisonService === true;
    if (filters.nombreEnfants) where.nombreEnfants = { contains: filters.nombreEnfants };
    if (filters.userId) where.userId = filters.userId;

    const [rawData, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, parents: true, nounus: true } },
          medias: true,
          preferences: {
            include: {
              horaireDisponible: true,
              zoneDeTravail: true,
              typeServices: true,
              equipementMenager: true,
              criteresSpecifiques: true,
              certificationsCriteres: true,
              trancheAgeEnfants: true,
              besionsSpecifiques: true,
              gardeEnfants: true,
              aideMenagere: true,
              frequenceDesServices: true,
              horaireSouhaites: true,
              adress: true,
              competanceSpecifique: true,
              taches: true,
              langueParler: true,
              criteresSelections: true,
            },
          },
        },
        distinct: ['id'],
      }),
      this.prisma.job.count({ where }),
    ]);

    const seen = new Set<number>();
    const data = rawData.filter((job) => {
      if (seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    });

    return { data, total };
  }

  async findById(id: number) {
    return this.prisma.job.findUnique({
      where: { id },
      include: {
        user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, parents: true, nounus: true } },
        medias: true,
        preferences: {
          include: {
            horaireDisponible: true,
            zoneDeTravail: true,
            typeServices: true,
            equipementMenager: true,
            criteresSpecifiques: true,
            certificationsCriteres: true,
            trancheAgeEnfants: true,
            besionsSpecifiques: true,
            gardeEnfants: true,
            aideMenagere: true,
            frequenceDesServices: true,
            horaireSouhaites: true,
            adress: true,
            competanceSpecifique: true,
            taches: true,
            langueParler: true,
            criteresSelections: true,
          },
        },
        jobApplications: { include: { user: { include: { medias: { where: { deletedAt: null } } } } } },
      },
    });
  }

  async create(data: any) {
    return this.prisma.job.create({
      data,
      include: { user: true, medias: true },
    });
  }

  async createPreferences(jobId: number, preferences: any[]) {
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { jobId, ...pref },
      });
    }
  }

  async replacePreferences(jobId: number, preferences: any[]) {
    await this.prisma.preference.deleteMany({ where: { jobId } });
    for (const pref of preferences) {
      await this.prisma.preference.create({
        data: { jobId, ...pref },
      });
    }
  }

  async attachMedia(jobId: number, files: Express.Multer.File[]) {
    for (const file of files) {
      await this.prisma.media.create({
        data: {
          originalName: file.originalname,
          filename: file.filename,
          path: `/uploads/jobs/${file.filename}`,
          jobId,
        },
      });
    }
  }

  async update(id: number, data: any) {
    return this.prisma.job.update({
      where: { id },
      data,
      include: { user: true, medias: true },
    });
  }

  async delete(id: number) {
    return this.prisma.job.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findApplicationsByUser(userId: string) {
    return this.prisma.jobApplication.findMany({
      where: { userId },
      include: { job: { include: { user: true, medias: true } } },
    });
  }

  async findApplicationsByJob(jobId: number) {
    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: { user: { include: { medias: true } } },
    });
  }

  async findApplicationsByJobOwner(ownerUserId: string) {
    return this.prisma.jobApplication.findMany({
      where: { job: { userId: ownerUserId, deletedAt: null } },
      include: {
        user: {
          include: {
            medias: { where: { deletedAt: null }, include: { typeMedia: true } },
            nounus: { where: { deletedAt: null } },
          },
        },
        job: { include: { medias: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applyToJob(userId: string, jobId: number) {
    const existing = await this.prisma.jobApplication.findFirst({
      where: { userId, jobId },
    });
    if (existing) return existing;

    return this.prisma.jobApplication.create({
      data: { userId, jobId, isApply: true },
    });
  }

  async unapplyFromJob(userId: string, jobId: number) {
    return this.prisma.jobApplication.deleteMany({
      where: { userId, jobId },
    });
  }
}

@Injectable()
export class PrismaRoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findConversationsByUser(userId: string) {
    return this.prisma.room.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, nounus: true, parents: true } },
        receiver: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, nounus: true, parents: true } },
        nounu: true,
        parent: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        unreadCounts: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async findById(id: number) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        sender: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, nounus: true, parents: true } },
        receiver: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } }, nounus: true, parents: true } },
        nounu: true,
        parent: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { include: { medias: true } } },
        },
        unreadCounts: true,
      },
    });
  }

  async findOrCreate(senderId: string, receiverId: string, nounuId?: string, parentId?: string) {
    const existing = await this.prisma.room.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) return existing;

    return this.prisma.room.create({
      data: { senderId, receiverId, nounuId, parentId },
    });
  }

  async getMessages(roomId: number, skip = 0, limit = 50) {
    return this.prisma.message.findMany({
      where: { roomId, deletedAt: null },
      skip,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { sender: { include: { medias: true } } },
    });
  }

  async sendMessage(data: {
    roomId: number;
    senderId: string;
    content: string;
    type?: string;
    isProposition?: boolean;
    propositionExpired?: string;
    proposalStatus?: string;
    montant?: number;
    periode?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) {
    const message = await this.prisma.message.create({
      data: {
        roomId: data.roomId,
        senderId: data.senderId,
        content: data.content,
        type: (data.type as any) || 'Message',
        isProposition: data.isProposition || false,
        propositionExpired: data.propositionExpired,
        proposalStatus: (data.proposalStatus as any) || 'Pending',
        montant: data.montant || null,
        periode: data.periode || null,
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
        attachmentType: data.attachmentType || null,
      },
      include: { sender: true, room: true },
    });

    const room = await this.prisma.room.findUnique({ where: { id: data.roomId } });
    let receiverId: string | null = null;
    let notification: any = null;
    if (room) {
      receiverId = room.senderId === data.senderId ? room.receiverId : room.senderId;
      notification = await this.prisma.notification.create({
        data: {
          type: data.isProposition ? 'PROPOSITION' : 'MESSAGE',
          title: data.isProposition ? 'Nouvelle proposition' : 'Nouveau message',
          message: data.isProposition
            ? `Nouvelle proposition: ${data.content.substring(0, 50)}`
            : `Nouveau message: ${data.content.substring(0, 50)}`,
          userId: receiverId,
          senderId: data.senderId,
          tolinkId: String(data.roomId),
          isActions: data.isProposition || false,
        },
      });
    }

    return { message, receiverId, notification };
  }

  async markAsRead(roomId: number, userId: string) {
    await this.prisma.message.updateMany({
      where: { roomId, isRead: false, senderId: { not: userId } },
      data: { isRead: true },
    });

    // Mark related message notifications as read since the user has seen the messages
    await this.prisma.notification.updateMany({
      where: { userId, tolinkId: String(roomId), type: { in: ['MESSAGE', 'PROPOSITION'] }, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.roomUnreadCount.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { count: 0 },
      create: { roomId, userId, count: 0 },
    });
  }

  async getUnreadCount(userId: string) {
    const counts = await this.prisma.roomUnreadCount.findMany({
      where: { userId, count: { gt: 0 } },
    });
    return counts.reduce((sum, c) => sum + c.count, 0);
  }

  async incrementUnread(roomId: number, userId: string) {
    return this.prisma.roomUnreadCount.upsert({
      where: { roomId_userId: { roomId, userId } },
      update: { count: { increment: 1 } },
      create: { roomId, userId, count: 1 },
    });
  }
}

@Injectable()
export class PrismaNotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, skip = 0, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { sender: { include: { medias: true } }, job: true },
      }),
      this.prisma.notification.count({ where: { userId, isDeleted: false } }),
    ]);
    return { data, total };
  }

  async create(data: {
    type: string;
    title?: string;
    message: string;
    userId: string;
    senderId?: string;
    jobId?: number;
    tolinkId?: string;
    isActions?: boolean;
  }) {
    return this.prisma.notification.create({
      data,
    });
  }

  async markAsRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false, isDeleted: false },
    });
  }
}
