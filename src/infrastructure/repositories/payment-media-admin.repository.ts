import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaPaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip: number, limit: number) {
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: true, subscriptions: true },
      }),
      this.prisma.payment.count({ where: { deletedAt: null } }),
    ]);
    return { data, total };
  }

  async findByUser(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId, deletedAt: null },
      include: { subscriptions: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { user: true, subscriptions: true },
    });
  }

  async create(data: {
    userId: string;
    amount: number;
    status?: string;
    paymentMethod?: string;
    paymentType?: string;
    currency?: string;
    transactionId?: string;
    paymentToken?: string;
    metadata?: any;
  }) {
    return this.prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType,
        currency: data.currency,
        transactionId: data.transactionId,
        paymentToken: data.paymentToken,
        metadata: data.metadata,
      },
      include: { subscriptions: true },
    });
  }

  async updateStatus(id: string, status: string, transactionId?: string) {
    return this.prisma.payment.update({
      where: { id },
      data: { status, transactionId },
      include: { subscriptions: true, user: true },
    });
  }

  async findByTransactionId(transactionId: string) {
    return this.prisma.payment.findUnique({
      where: { transactionId },
      include: { user: true, subscriptions: true },
    });
  }

  async updatePayment(id: string, data: {
    status?: string;
    transactionId?: string;
    operatorId?: string;
    paymentDate?: Date;
    paymentMethod?: string;
    metadata?: any;
  }) {
    return this.prisma.payment.update({
      where: { id },
      data: {
        status: data.status,
        transactionId: data.transactionId,
        operatorId: data.operatorId,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        metadata: data.metadata,
      },
      include: { subscriptions: true, user: true },
    });
  }
}

@Injectable()
export class PrismaSubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subscription.findMany({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async findUserSubscription(userId: string) {
    return this.prisma.subscription.findFirst({
      where: { userId, status: 'active', deletedAt: null },
      include: { payment: true, type: true, pack: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSubscription(data: {
    userId: string;
    status: string;
    expiresAt?: Date;
    paymentId?: string;
    typeId?: number;
    packId?: number;
  }) {
    return this.prisma.subscription.create({
      data,
      include: { payment: true, type: true, pack: true },
    });
  }

  async findSubscriptionById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async updateSubscription(id: string, data: any) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async deleteSubscription(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}

@Injectable()
export class PrismaMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string) {
    return this.prisma.media.findMany({
      where: { userId, deletedAt: null },
      include: { typeMedia: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.media.findUnique({ where: { id } });
  }

  async create(data: {
    userId?: string;
    originalName: string;
    filename: string;
    path: string;
    originalUrl?: string;
    jobId?: number;
    typeMediaId?: number;
  }) {
    return this.prisma.media.create({ data });
  }

  async delete(id: string) {
    return this.prisma.media.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async deleteByUser(userId: string) {
    return this.prisma.media.updateMany({
      where: { userId },
      data: { deletedAt: new Date() },
    });
  }
}

@Injectable()
export class PrismaAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllUsers(skip: number, limit: number, roleId?: number, search?: string) {
    const where: any = {};
    if (roleId) where.roleId = roleId;
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { nounus: { some: { fullname: { contains: search, mode: 'insensitive' } } } },
        { parents: { some: { fullname: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          slug: true,
          email: true,
          accessToken: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          role: true,
          typeProfil: true,
          medias: true,
          nounus: true,
          parents: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  async findPendingNounus(skip: number, limit: number) {
    const where = { certif: 'Pending' as const, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.profilNounu.findMany({
        where,
        skip,
        take: limit,
        include: { user: { include: { medias: { include: { typeMedia: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profilNounu.count({ where }),
    ]);
    return { data, total };
  }

  async certifyNounu(id: string, status: 'Approved' | 'Rejected') {
    return this.prisma.profilNounu.update({
      where: { id },
      data: { certif: status },
      include: { user: true },
    });
  }

  async getStats() {
    const [totalUsers, totalNounus, totalParents, totalJobs, totalRooms, totalMessages, pendingNounus, totalPayments, totalSubscriptions] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.profilNounu.count({ where: { deletedAt: null } }),
      this.prisma.profilParent.count({ where: { deletedAt: null } }),
      this.prisma.job.count({ where: { deletedAt: null } }),
      this.prisma.room.count(),
      this.prisma.message.count({ where: { deletedAt: null } }),
      this.prisma.profilNounu.count({ where: { certif: 'Pending', deletedAt: null } }),
      this.prisma.payment.count({ where: { deletedAt: null } }),
      this.prisma.subscription.count({ where: { deletedAt: null } }),
    ]);

    return {
      totalUsers,
      totalNounus,
      totalParents,
      totalJobs,
      totalRooms,
      totalMessages,
      pendingNounus,
      totalPayments,
      totalSubscriptions,
    };
  }

  async deleteUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restoreUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async getSettings() {
    return this.prisma.appSetting.findFirst();
  }

  async updateSettings(data: any) {
    const existing = await this.prisma.appSetting.findFirst();
    if (existing) {
      return this.prisma.appSetting.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.appSetting.create({ data });
  }

  // ── TypeParameters CRUD ──
  async findAllTypeParameters(skip: number, limit: number) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.typeParameter.findMany({ where, skip, take: limit, orderBy: { id: 'asc' } }),
      this.prisma.typeParameter.count({ where }),
    ]);
    return { data, total };
  }

  async findTypeParameterById(id: number) {
    return this.prisma.typeParameter.findUnique({ where: { id }, include: { parameters: true } });
  }

  async createTypeParameter(data: { name: string; slug?: string }) {
    return this.prisma.typeParameter.create({ data });
  }

  async updateTypeParameter(id: number, data: { name?: string; slug?: string }) {
    return this.prisma.typeParameter.update({ where: { id }, data });
  }

  async deleteTypeParameter(id: number) {
    return this.prisma.typeParameter.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Parameters CRUD ──
  async findAllParameters(skip: number, limit: number, typeParameterId?: number) {
    const where: any = { deletedAt: null };
    if (typeParameterId) where.typeParameterId = typeParameterId;
    const [data, total] = await Promise.all([
      this.prisma.parameter.findMany({ where, skip, take: limit, include: { typeParameter: true }, orderBy: { id: 'asc' } }),
      this.prisma.parameter.count({ where }),
    ]);
    return { data, total };
  }

  async findParameterById(id: number) {
    return this.prisma.parameter.findUnique({ where: { id }, include: { typeParameter: true } });
  }

  async createParameter(data: { name: string; slug?: string; description?: string; priority?: number; typeParameterId?: number }) {
    return this.prisma.parameter.create({ data, include: { typeParameter: true } });
  }

  async updateParameter(id: number, data: { name?: string; slug?: string; description?: string; priority?: number; typeParameterId?: number }) {
    return this.prisma.parameter.update({ where: { id }, data, include: { typeParameter: true } });
  }

  async deleteParameter(id: number) {
    return this.prisma.parameter.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Permissions CRUD ──
  async findAllPermissions(skip: number, limit: number) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.permission.findMany({ where, skip, take: limit, include: { roles: true }, orderBy: { id: 'asc' } }),
      this.prisma.permission.count({ where }),
    ]);
    return { data, total };
  }

  async findPermissionById(id: number) {
    return this.prisma.permission.findUnique({ where: { id }, include: { roles: true } });
  }

  async createPermission(data: { name: string; slug: string; description?: string; module?: string }) {
    return this.prisma.permission.create({ data });
  }

  async updatePermission(id: number, data: { name?: string; slug?: string; description?: string; module?: string }) {
    return this.prisma.permission.update({ where: { id }, data });
  }

  async deletePermission(id: number) {
    return this.prisma.permission.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Role-Permission assignments ──
  async findRolePermissions(roleId: number) {
    return this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true, role: true },
    });
  }

  async assignPermissionToRole(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.create({ data: { roleId, permissionId } });
  }

  async removePermissionFromRole(roleId: number, permissionId: number) {
    return this.prisma.rolePermission.delete({ where: { roleId_permissionId: { roleId, permissionId } } });
  }

  // ── Jobs CRUD ──
  async findAllJobs(skip: number, limit: number) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.job.findMany({ where, skip, take: limit, include: { user: true, jobApplications: true }, orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.job.count({ where }),
    ]);
    return { data, total };
  }

  async findJobById(id: number) {
    return this.prisma.job.findUnique({ where: { id }, include: { user: true, jobApplications: true, preferences: true, medias: true } });
  }

  async createJob(data: any) {
    return this.prisma.job.create({ data, include: { user: true } });
  }

  async updateJob(id: number, data: any) {
    return this.prisma.job.update({ where: { id }, data, include: { user: true } });
  }

  async deleteJob(id: number) {
    return this.prisma.job.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Parents CRUD ──
  async findAllParents(skip: number, limit: number) {
    const where = { deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.profilParent.findMany({
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
      this.prisma.profilParent.count({ where }),
    ]);
    return { data, total };
  }

  async findParentById(id: string) {
    return this.prisma.profilParent.findUnique({ where: { id }, include: { user: true, preferences: true, rooms: true } });
  }

  async updateParent(id: string, data: any) {
    return this.prisma.profilParent.update({ where: { id }, data, include: { user: true } });
  }

  async deleteParent(id: string) {
    return this.prisma.profilParent.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  // ── Payments (admin overview) ──
  async findAllPayments(skip: number, limit: number, status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { include: { medias: true, nounus: true, parents: true, role: true } },
          subscriptions: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { data, total };
  }

  async findPaymentById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: { include: { medias: true, nounus: true, parents: true, role: true } },
        subscriptions: { include: { type: true } },
      },
    });
  }

  // ── Chat rooms (nounu <-> parent, admin chats on behalf of nounu) ──
  async findAllRooms(skip: number, limit: number) {
    const where = {
      deletedAt: null,
      OR: [
        { sender: { nounus: { some: {} } }, receiver: { parents: { some: {} } } },
        { sender: { parents: { some: {} } }, receiver: { nounus: { some: {} } } },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip,
        take: limit,
        include: {
          sender: { include: { medias: true, nounus: true, parents: true, role: true } },
          receiver: { include: { medias: true, nounus: true, parents: true, role: true } },
          nounu: true,
          parent: true,
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          unreadCounts: true,
        },
        orderBy: { id: 'desc' },
      }),
      this.prisma.room.count({ where }),
    ]);
    return { data, total };
  }

  async findRoomById(id: number) {
    return this.prisma.room.findUnique({
      where: { id },
      include: {
        sender: { include: { medias: true, nounus: true, parents: true, role: true } },
        receiver: { include: { medias: true, nounus: true, parents: true, role: true } },
        nounu: true,
        parent: true,
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { include: { medias: true } } } },
        unreadCounts: true,
      },
    });
  }

  async deleteRoom(id: number) {
    return this.prisma.room.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async sendMessageAsNounu(roomId: number, senderId: string, content: string, isProposition?: boolean, propositionExpired?: string, montant?: number, periode?: string, attachmentUrl?: string, attachmentName?: string, attachmentType?: string) {
    const message = await this.prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        type: isProposition ? 'Proposition' : 'Message',
        isProposition: isProposition || false,
        propositionExpired: propositionExpired || null,
        proposalStatus: 'Pending',
        montant: montant || null,
        periode: periode || null,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        attachmentType: attachmentType || null,
      },
      include: { sender: { include: { medias: true, nounus: true, parents: true } } },
    });
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    let receiverId: string | null = null;
    let notification: any = null;
    if (room) {
      receiverId = room.senderId === senderId ? room.receiverId : room.senderId;
      notification = await this.prisma.notification.create({
        data: {
          type: isProposition ? 'PROPOSITION' : 'MESSAGE',
          title: isProposition ? 'Nouvelle proposition' : 'Nouveau message',
          message: isProposition ? `Nouvelle proposition: ${content.substring(0, 50)}` : `Nouveau message: ${content.substring(0, 50)}`,
          userId: receiverId,
          senderId,
          tolinkId: String(roomId),
          isActions: isProposition || false,
        },
      });
    }
    return { message, receiverId, notification };
  }

  async markRoomAsRead(roomId: number, userId: string) {
    // Clear unread counts only for the admin user, not for the parent/nounu.
    await this.prisma.roomUnreadCount.updateMany({
      where: { roomId, userId },
      data: { count: 0 },
    });

    // Mark related message notifications as read since the user has seen the messages
    await this.prisma.notification.updateMany({
      where: { userId, tolinkId: String(roomId), type: { in: ['MESSAGE', 'PROPOSITION'] }, isRead: false },
      data: { isRead: true },
    });

    return this.prisma.room.findUnique({
      where: { id: roomId },
      include: { unreadCounts: true },
    });
  }

  async getAdminUnreadCount(adminId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [{ senderId: adminId }, { receiverId: adminId }],
        deletedAt: null,
      },
      select: { id: true },
    });
    const roomIds = rooms.map((r) => r.id);
    if (roomIds.length === 0) return 0;

    const unreadMessages = await this.prisma.message.count({
      where: {
        roomId: { in: roomIds },
        senderId: { not: adminId },
        isRead: false,
      },
    });
    return unreadMessages;
  }

  async updateProposalStatus(messageId: number, status: 'Accepted' | 'Refused') {
    return this.prisma.message.update({
      where: { id: messageId },
      data: { proposalStatus: status },
      include: { sender: { include: { medias: true, nounus: true, parents: true } } },
    });
  }

  // ── Nounus (full list) ──
  async findAllNounus(skip: number, limit: number, certif?: string) {
    const where: any = { deletedAt: null };
    if (certif) where.certif = certif;
    const [data, total] = await Promise.all([
      this.prisma.profilNounu.findMany({
        where,
        skip,
        take: limit,
        include: { user: { include: { medias: { include: { typeMedia: true } }, role: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.profilNounu.count({ where }),
    ]);
    return { data, total };
  }

  async findNounuById(id: string) {
    return this.prisma.profilNounu.findUnique({
      where: { id },
      include: { user: { include: { medias: { include: { typeMedia: true } }, role: true } }, preferences: true },
    });
  }

  async updateNounu(id: string, data: any) {
    return this.prisma.profilNounu.update({ where: { id }, data, include: { user: { include: { medias: { include: { typeMedia: true } }, role: true } } } });
  }

  async findNounuPropositions(nounuUserId: string) {
    return this.prisma.message.findMany({
      where: {
        senderId: nounuUserId,
        isProposition: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findNounuPayments(nounuUserId: string) {
    return this.prisma.payment.findMany({
      where: { userId: nounuUserId, deletedAt: null, paymentType: 'nounu_payout' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createNounuPayment(data: {
    userId: string;
    amount: number;
    paymentMethod?: string;
    currency?: string;
    description?: string;
    transactionId?: string;
    status?: string;
    metadata?: any;
  }) {
    return this.prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        status: data.status || 'Success',
        paymentMethod: data.paymentMethod || 'admin_manual',
        paymentType: 'nounu_payout',
        currency: data.currency || 'XOF',
        transactionId: data.transactionId,
        metadata: {
          ...(data.metadata || {}),
          description: data.description,
        },
        paymentDate: data.status === 'Success' ? new Date() : undefined,
      },
      include: { user: { include: { nounus: true, role: true } } },
    });
  }

  async findAdminRole() {
    return this.prisma.parameter.findFirst({
      where: { slug: 'admin', deletedAt: null },
    });
  }

  async createSubAdmin(data: {
    slug: string;
    email: string;
    password: string;
    roleId: number;
  }) {
    return this.prisma.user.create({
      data: {
        slug: data.slug,
        email: data.email,
        password: data.password,
        roleId: data.roleId,
        typeProfilId: 3,
      },
      include: { role: true },
    });
  }

  async assignPermissionsBulk(roleId: number, permissionIds: number[]) {
    if (permissionIds.length === 0) return [];
    return this.prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      skipDuplicates: true,
    });
  }

  // ── Subscriptions ──
  async createSubscription(data: {
    userId: string;
    status: string;
    expiresAt?: Date;
    paymentId?: string;
    typeId?: number;
    packId?: number;
  }) {
    return this.prisma.subscription.create({
      data,
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async findSubscriptionById(id: string) {
    return this.prisma.subscription.findUnique({
      where: { id },
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async updateSubscription(id: string, data: any) {
    return this.prisma.subscription.update({
      where: { id },
      data,
      include: { payment: true, type: true, pack: true, user: true },
    });
  }

  async deleteSubscription(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  // ── User detail ──
  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        typeProfil: true,
        medias: true,
        nounus: true,
        parents: true,
        jobs: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 10 },
        payments: { where: { deletedAt: null }, include: { subscriptions: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        abonnements: { where: { deletedAt: null }, include: { type: true }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // ── Subscriptions (admin overview) ──
  async findAllSubscriptions(skip: number, limit: number, status?: string) {
    const where: any = { deletedAt: null };
    if (status) where.status = status;
    const [data, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { include: { role: true, nounus: true, parents: true } },
          payment: true,
          type: true,
          pack: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { data, total };
  }
}

@Injectable()
export class PrismaPackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(skip?: number, limit?: number): Promise<{ data: any[]; total: number }> {
    const where = { deletedAt: null };
    if (skip !== undefined && limit !== undefined) {
      const [data, total] = await Promise.all([
        this.prisma.pack.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
        }),
        this.prisma.pack.count({ where }),
      ]);
      return { data, total };
    }
    const data = await this.prisma.pack.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    return { data, total: data.length };
  }

  async findActive() {
    return this.prisma.pack.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: number) {
    return this.prisma.pack.findUnique({ where: { id } });
  }

  async create(data: {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    currency?: string;
    durationDays?: number;
    features?: any;
    isActive?: boolean;
    priority?: number;
  }) {
    return this.prisma.pack.create({ data });
  }

  async update(id: number, data: any) {
    return this.prisma.pack.update({ where: { id }, data });
  }

  async softDelete(id: number) {
    return this.prisma.pack.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
