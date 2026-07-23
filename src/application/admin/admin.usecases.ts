import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaAdminRepository, PrismaPackRepository, PrismaPaymentRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { GeniusPayService } from '../../infrastructure/services/geniuspay.service';
import { AppConfig } from '../../infrastructure/config/app.config';
import { PaginationUtil } from '../../shared';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class GetAllUsersUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number, roleId?: number, search?: string) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllUsers(PaginationUtil.getSkip(options), options.limit, roleId, search);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetPendingNounusUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findPendingNounus(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class CertifyNounuUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(id: string, status: 'Approved' | 'Rejected') {
    const nounu = await this.adminRepo.certifyNounu(id, status);

    if (nounu.userId) {
      await this.notifRepo.create({
        type: 'CERTIFICATION',
        title: status === 'Approved' ? 'Certification approuvée' : 'Certification refusée',
        message: status === 'Approved'
          ? 'Votre profil a été certifié avec succès.'
          : 'Votre demande de certification a été refusée. Veuillez vérifier vos informations.',
        userId: nounu.userId,
        tolinkId: id,
      });
    }

    return nounu;
  }
}

@Injectable()
export class GetStatsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute() {
    return this.adminRepo.getStats();
  }
}

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    return this.adminRepo.deleteUser(id);
  }
}

@Injectable()
export class RestoreUserUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    return this.adminRepo.restoreUser(id);
  }
}

@Injectable()
export class GetSettingsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute() {
    return this.adminRepo.getSettings();
  }
}

@Injectable()
export class UpdateSettingsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: any) {
    return this.adminRepo.updateSettings(data);
  }
}

// ============================================================
//  TYPE PARAMETERS
// ============================================================

@Injectable()
export class GetAllTypeParametersUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllTypeParameters(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetTypeParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const tp = await this.adminRepo.findTypeParameterById(id);
    if (!tp) throw new NotFoundException('Type de paramètre introuvable');
    return tp;
  }
}

@Injectable()
export class CreateTypeParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: { name: string; slug?: string }) {
    return this.adminRepo.createTypeParameter(data);
  }
}

@Injectable()
export class UpdateTypeParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number, data: { name?: string; slug?: string }) {
    const tp = await this.adminRepo.findTypeParameterById(id);
    if (!tp) throw new NotFoundException('Type de paramètre introuvable');
    return this.adminRepo.updateTypeParameter(id, data);
  }
}

@Injectable()
export class DeleteTypeParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const tp = await this.adminRepo.findTypeParameterById(id);
    if (!tp) throw new NotFoundException('Type de paramètre introuvable');
    return this.adminRepo.deleteTypeParameter(id);
  }
}

// ============================================================
//  PARAMETERS
// ============================================================

@Injectable()
export class GetAllParametersUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number, typeParameterId?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllParameters(PaginationUtil.getSkip(options), options.limit, typeParameterId);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const p = await this.adminRepo.findParameterById(id);
    if (!p) throw new NotFoundException('Paramètre introuvable');
    return p;
  }
}

@Injectable()
export class CreateParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: { name: string; slug?: string; description?: string; priority?: number; typeParameterId?: number }) {
    return this.adminRepo.createParameter(data);
  }
}

@Injectable()
export class UpdateParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number, data: { name?: string; slug?: string; description?: string; priority?: number; typeParameterId?: number }) {
    const p = await this.adminRepo.findParameterById(id);
    if (!p) throw new NotFoundException('Paramètre introuvable');
    return this.adminRepo.updateParameter(id, data);
  }
}

@Injectable()
export class DeleteParameterUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const p = await this.adminRepo.findParameterById(id);
    if (!p) throw new NotFoundException('Paramètre introuvable');
    return this.adminRepo.deleteParameter(id);
  }
}

// ============================================================
//  PERMISSIONS
// ============================================================

@Injectable()
export class GetAllPermissionsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllPermissions(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetPermissionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const p = await this.adminRepo.findPermissionById(id);
    if (!p) throw new NotFoundException('Permission introuvable');
    return p;
  }
}

@Injectable()
export class CreatePermissionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: { name: string; slug: string; description?: string; module?: string }) {
    return this.adminRepo.createPermission(data);
  }
}

@Injectable()
export class UpdatePermissionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number, data: { name?: string; slug?: string; description?: string; module?: string }) {
    const p = await this.adminRepo.findPermissionById(id);
    if (!p) throw new NotFoundException('Permission introuvable');
    return this.adminRepo.updatePermission(id, data);
  }
}

@Injectable()
export class DeletePermissionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const p = await this.adminRepo.findPermissionById(id);
    if (!p) throw new NotFoundException('Permission introuvable');
    return this.adminRepo.deletePermission(id);
  }
}

// ============================================================
//  ROLE-PERMISSION ASSIGNMENTS
// ============================================================

@Injectable()
export class GetRolePermissionsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(roleId: number) {
    return this.adminRepo.findRolePermissions(roleId);
  }
}

@Injectable()
export class AssignPermissionToRoleUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(roleId: number, permissionId: number) {
    return this.adminRepo.assignPermissionToRole(roleId, permissionId);
  }
}

@Injectable()
export class RemovePermissionFromRoleUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(roleId: number, permissionId: number) {
    return this.adminRepo.removePermissionFromRole(roleId, permissionId);
  }
}

// ============================================================
//  JOBS
// ============================================================

@Injectable()
export class GetAllJobsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllJobs(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetJobUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const j = await this.adminRepo.findJobById(id);
    if (!j) throw new NotFoundException('Annonce introuvable');
    return j;
  }
}

@Injectable()
export class CreateJobUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: any) {
    return this.adminRepo.createJob(data);
  }
}

@Injectable()
export class UpdateJobUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number, data: any) {
    const j = await this.adminRepo.findJobById(id);
    if (!j) throw new NotFoundException('Annonce introuvable');
    return this.adminRepo.updateJob(id, data);
  }
}

@Injectable()
export class DeleteJobUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const j = await this.adminRepo.findJobById(id);
    if (!j) throw new NotFoundException('Annonce introuvable');
    return this.adminRepo.deleteJob(id);
  }
}

@Injectable()
export class SuspendJobUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(id: number, suspended: boolean) {
    const j = await this.adminRepo.findJobById(id);
    if (!j) throw new NotFoundException('Annonce introuvable');
    const updated = await this.adminRepo.updateJob(id, { suspended });

    if (j.userId) {
      await this.notifRepo.create({
        type: 'JOBS',
        title: suspended ? 'Offre suspendue' : 'Offre réactivée',
        message: suspended
          ? `Votre offre "${j.titre}" a été suspendue par l'administration.`
          : `Votre offre "${j.titre}" a été réactivée.`,
        userId: j.userId,
        jobId: id,
        tolinkId: String(id),
      });
    }

    return updated;
  }
}

@Injectable()
export class PrioritizeJobUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number, priority: number) {
    const j = await this.adminRepo.findJobById(id);
    if (!j) throw new NotFoundException('Annonce introuvable');
    return this.adminRepo.updateJob(id, { priority });
  }
}

// ============================================================
//  PARENTS
// ============================================================

@Injectable()
export class GetAllParentsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllParents(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetParentUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const p = await this.adminRepo.findParentById(id);
    if (!p) throw new NotFoundException('Parent introuvable');
    return p;
  }
}

@Injectable()
export class UpdateParentUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string, data: any) {
    const p = await this.adminRepo.findParentById(id);
    if (!p) throw new NotFoundException('Parent introuvable');
    return this.adminRepo.updateParent(id, data);
  }
}

@Injectable()
export class DeleteParentUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const p = await this.adminRepo.findParentById(id);
    if (!p) throw new NotFoundException('Parent introuvable');
    return this.adminRepo.deleteParent(id);
  }
}

@Injectable()
export class RestrictParentUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(id: string, restricted: boolean) {
    const p = await this.adminRepo.findParentById(id);
    if (!p) throw new NotFoundException('Parent introuvable');
    const updated = await this.adminRepo.updateParent(id, { restricted });

    if (p.userId) {
      await this.notifRepo.create({
        type: 'RESTRICTION',
        title: restricted ? 'Compte restreint' : 'Compte réactivé',
        message: restricted
          ? 'Votre compte a été restreint par l\'administration. Veuillez les contacter pour plus d\'informations.'
          : 'Votre compte a été réactivé. Vous pouvez utiliser l\'application normalement.',
        userId: p.userId,
        tolinkId: id,
      });
    }

    return updated;
  }
}

// ============================================================
//  PAYMENTS (admin overview)
// ============================================================

@Injectable()
export class GetAllPaymentsAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number, status?: string) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllPayments(PaginationUtil.getSkip(options), options.limit, status);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetPaymentAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const p = await this.adminRepo.findPaymentById(id);
    if (!p) throw new NotFoundException('Paiement introuvable');
    return p;
  }
}

@Injectable()
export class VerifyAdminPaymentUseCase {
  private readonly logger = new Logger(VerifyAdminPaymentUseCase.name);

  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(id: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundException('Paiement introuvable');

    const metadata = payment.metadata as any;
    const reference = metadata?.geniuspayReference || payment.transactionId;
    if (!reference) throw new BadRequestException('Aucun identifiant de transaction trouvé');

    this.logger.log(`Admin verification for payment ${id}, reference ${reference}`);

    const verification = await this.geniusPayService.verifyPayment(reference);
    const mappedStatus = mapGeniusPayStatus(verification.status);

    if (mappedStatus !== payment.status) {
      const updateData: any = {
        status: mappedStatus,
        metadata: {
          ...(payment.metadata as any || {}),
          geniuspayVerification: verification.metadata,
          lastVerifiedAt: new Date().toISOString(),
        },
      };

      if (mappedStatus === 'Success') {
        updateData.paymentDate = new Date();
      }

      await this.paymentRepo.updatePayment(payment.id, updateData);

      if (mappedStatus === 'Success' && payment.userId) {
        await this.notifRepo.create({
          type: 'PAIEMENT',
          title: 'Paiement confirmé',
          message: `Votre paiement de ${payment.amount} ${payment.currency || 'XOF'} a été confirmé avec succès.`,
          userId: payment.userId,
          tolinkId: String(payment.id),
        });
      }
    }

    return {
      paymentId: payment.id,
      transactionId: payment.transactionId,
      status: mappedStatus,
      amount: payment.amount,
      currency: payment.currency,
    };
  }
}

@Injectable()
export class FailAdminPaymentUseCase {
  constructor(private readonly paymentRepo: PrismaPaymentRepository) {}

  async execute(id: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundException('Paiement introuvable');
    if (payment.status !== 'Pending') {
      throw new BadRequestException('Seul un paiement en attente peut être mis en échec');
    }

    return this.paymentRepo.updatePayment(id, {
      status: 'Failed',
      metadata: {
        ...(payment.metadata as any || {}),
        failedByAdmin: true,
        failedAt: new Date().toISOString(),
      },
    });
  }
}

// ============================================================
//  CHAT ROOMS (admin overview)
// ============================================================

@Injectable()
export class GetAllRoomsAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllRooms(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetRoomAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const r = await this.adminRepo.findRoomById(id);
    if (!r) throw new NotFoundException('Conversation introuvable');
    return r;
  }
}

@Injectable()
export class DeleteRoomAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: number) {
    const r = await this.adminRepo.findRoomById(id);
    if (!r) throw new NotFoundException('Conversation introuvable');
    return this.adminRepo.deleteRoom(id);
  }
}

@Injectable()
export class SendMessageAsNounuUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(roomId: number, content: string, isProposition?: boolean, propositionExpired?: string, montant?: number, periode?: string, attachmentUrl?: string, attachmentName?: string, attachmentType?: string) {
    const room = await this.adminRepo.findRoomById(roomId);
    if (!room) throw new NotFoundException('Conversation introuvable');
    const nounuUser = room.sender?.nounus?.length ? room.sender : room.receiver;
    if (!nounuUser) throw new NotFoundException('Nounu introuvable dans cette conversation');

    if (isProposition) {
      const now = new Date();
      const hasActive = (room.messages || []).some((m: any) =>
        m.isProposition &&
        m.proposalStatus === 'Pending' &&
        (!m.propositionExpired || new Date(m.propositionExpired) > now)
      );
      if (hasActive) {
        throw new BadRequestException('Une proposition est déjà en attente dans cette conversation');
      }
    }

    return this.adminRepo.sendMessageAsNounu(roomId, nounuUser.id, content, isProposition, propositionExpired, montant, periode, attachmentUrl, attachmentName, attachmentType);
  }
}

@Injectable()
export class MarkRoomAsReadUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(roomId: number, userId: string) {
    return this.adminRepo.markRoomAsRead(roomId, userId);
  }
}

@Injectable()
export class GetAdminUnreadCountUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(adminId: string) {
    return this.adminRepo.getAdminUnreadCount(adminId);
  }
}

@Injectable()
export class UpdateProposalStatusUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(messageId: number, status: 'Accepted' | 'Refused') {
    const message = await this.adminRepo.updateProposalStatus(messageId, status);

    if (message?.senderId) {
      await this.notifRepo.create({
        type: 'PROPOSITION',
        title: status === 'Accepted' ? 'Proposition acceptée' : 'Proposition refusée',
        message: status === 'Accepted'
          ? 'Votre proposition a été acceptée.'
          : 'Votre proposition a été refusée.',
        userId: message.senderId,
        tolinkId: message.roomId ? String(message.roomId) : undefined,
      });
    }

    return message;
  }
}

// ============================================================
//  NOUNUS (full list)
// ============================================================

@Injectable()
export class GetAllNounusUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number, certif?: string) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllNounus(PaginationUtil.getSkip(options), options.limit, certif);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class RestrictNounuUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(id: string, restricted: boolean) {
    const n = await this.adminRepo.findNounuById(id);
    if (!n) throw new NotFoundException('Nounu introuvable');
    const updated = await this.adminRepo.updateNounu(id, { restricted });

    if (n.userId) {
      await this.notifRepo.create({
        type: 'RESTRICTION',
        title: restricted ? 'Compte restreint' : 'Compte réactivé',
        message: restricted
          ? 'Votre compte a été restreint par l\'administration. Veuillez les contacter pour plus d\'informations.'
          : 'Votre compte a été réactivé. Vous pouvez utiliser l\'application normalement.',
        userId: n.userId,
        tolinkId: id,
      });
    }

    return updated;
  }
}

@Injectable()
export class GetNounuDetailsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const nounu = await this.adminRepo.findNounuById(id);
    if (!nounu) throw new NotFoundException('Nounu introuvable');

    const payments = await this.adminRepo.findNounuPayments(nounu.userId);
    const totalPaid = payments
      .filter((p: any) => p.status === 'Success')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    const propositions = await this.adminRepo.findNounuPropositions(nounu.userId);
    const totalGenerated = propositions
      .filter((m: any) => m.proposalStatus === 'Accepted')
      .reduce((sum: number, m: any) => sum + (m.montant || 0), 0);

    return {
      nounu,
      payments,
      summary: {
        totalGenerated,
        totalPaid,
        remaining: totalGenerated - totalPaid,
      },
    };
  }
}

// ============================================================
//  USER DETAIL
// ============================================================

@Injectable()
export class GetUserDetailUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const user = await this.adminRepo.findUserById(id);
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }
}

// ============================================================
//  SUBSCRIPTIONS (admin overview)
// ============================================================

@Injectable()
export class GetAllSubscriptionsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(page?: number, limit?: number, status?: string) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.adminRepo.findAllSubscriptions(PaginationUtil.getSkip(options), options.limit, status);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
    private readonly packRepo: PrismaPackRepository,
  ) {}

  async execute(data: { userId: string; typeId?: number; packId?: number; durationDays?: number; status?: string }) {
    const user = await this.adminRepo.findUserById(data.userId);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    let expiresAt: Date | null = null;
    let isLifetime = false;

    if (data.packId) {
      const pack = await this.packRepo.findById(data.packId);
      if (!pack || pack.deletedAt) {
        throw new NotFoundException('Pack introuvable');
      }
      if (!pack.durationDays || pack.durationDays === 0) {
        isLifetime = true;
        expiresAt = null;
      } else {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + pack.durationDays);
      }
    } else {
      expiresAt = new Date();
      const durationDays = data.durationDays || 30;
      expiresAt.setDate(expiresAt.getDate() + durationDays);
    }

    const subscription = await this.adminRepo.createSubscription({
      userId: data.userId,
      status: data.status || 'active',
      expiresAt,
      typeId: data.typeId,
      packId: data.packId,
    });

    const expiryMsg = isLifetime
      ? 'Votre abonnement a été créé avec succès (à vie).'
      : `Votre abonnement a été créé avec succès jusqu'au ${expiresAt!.toLocaleDateString('fr-FR')}.`;

    await this.notifRepo.create({
      type: 'ABONNEMENT',
      title: 'Abonnement créé',
      message: expiryMsg,
      userId: data.userId,
      tolinkId: String(subscription.id),
    });

    return subscription;
  }
}

@Injectable()
export class UpdateSubscriptionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string, data: { status?: string; expiresAt?: Date; typeId?: number; packId?: number }) {
    const subscription = await this.adminRepo.findSubscriptionById(id);
    if (!subscription) throw new NotFoundException('Abonnement introuvable');

    return this.adminRepo.updateSubscription(id, data);
  }
}

@Injectable()
export class DeleteSubscriptionUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(id: string) {
    const subscription = await this.adminRepo.findSubscriptionById(id);
    if (!subscription) throw new NotFoundException('Abonnement introuvable');

    return this.adminRepo.deleteSubscription(id);
  }
}

// ============================================================
//  NOUNU PAYMENTS (admin pays nounu after prestation)
// ============================================================

@Injectable()
export class PayNounuUseCase {
  constructor(
    private readonly adminRepo: PrismaAdminRepository,
    private readonly notifRepo: PrismaNotificationRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly appConfig: AppConfig,
  ) {}

  private detectProvider(phone: string): 'wave' | 'orange' | 'mtn' | 'moov' | 'flooz' {
    const cleanedPhone = phone.replace(/\D/g, '');

    // Mobile Money providers in Côte d'Ivoire (10-digit numbers)
    if (cleanedPhone.startsWith('07') || cleanedPhone.startsWith('08') || cleanedPhone.startsWith('09')) {
      return 'orange';
    }
    if (cleanedPhone.startsWith('05') || cleanedPhone.startsWith('06')) {
      return 'mtn';
    }
    if (cleanedPhone.startsWith('01') || cleanedPhone.startsWith('02') || cleanedPhone.startsWith('03') || cleanedPhone.startsWith('04')) {
      return 'moov';
    }

    // Par défaut Wave
    return 'wave';
  }

  async execute(data: { nounuId: string; amount: number; paymentMethod?: string; currency?: string; description?: string; operator?: 'mobile_money' | 'wave' }) {
    const nounu = await this.adminRepo.findNounuById(data.nounuId);
    if (!nounu) throw new NotFoundException('Nounu introuvable');
    if (!nounu.userId) throw new BadRequestException('Ce nounu n\'a pas d\'utilisateur associé');
    if (!nounu.phone) throw new BadRequestException('Ce nounu n\'a pas de numéro de téléphone enregistré');
    if (data.amount <= 0) throw new BadRequestException('Le montant doit être supérieur à 0');

    const transactionId = this.geniusPayService.generateTransactionId();
    const currency = data.currency || 'XOF';

    // Déterminer l'opérateur (Wave ou Mobile Money)
    const provider = data.operator === 'wave' ? 'wave' : this.detectProvider(nounu.phone);
    
    // Générer une clé d'idempotence
    const idempotencyKey = `payout-${transactionId}`;

    const geniusPayResponse = await this.geniusPayService.initiatePayout({
      walletId: this.appConfig.geniuspayWalletId || 'default',
      recipientName: nounu.fullname || 'Nounu',
      recipientPhone: nounu.phone,
      recipientEmail: nounu.user?.email || '',
      destinationType: 'mobile_money',
      provider,
      account: nounu.phone,
      amount: data.amount,
      currency,
      description: data.description || `Paiement nounu - ${nounu.fullname || nounu.user?.email}`,
      metadata: {
        nounuId: data.nounuId,
        nounuPhone: nounu.phone,
        adminPayment: true,
        payout: true,
      },
      idempotencyKey,
    });

    const payment = await this.adminRepo.createNounuPayment({
      userId: nounu.userId,
      amount: data.amount,
      paymentMethod: 'GeniusPay',
      currency,
      description: data.description,
      transactionId,
      status: 'Pending',
      metadata: {
        geniuspayReference: geniusPayResponse.reference,
        recipientPhone: geniusPayResponse.recipientPhone,
        nounuId: data.nounuId,
        payout: true,
      },
    });

    return {
      paymentId: payment.id,
      transactionId,
      reference: geniusPayResponse.reference,
      status: geniusPayResponse.status,
      amount: data.amount,
      currency,
      recipientPhone: geniusPayResponse.recipientPhone,
    };
  }
}

@Injectable()
export class VerifyNounuPaymentUseCase {
  private readonly logger = new Logger(VerifyNounuPaymentUseCase.name);

  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(transactionId: string) {
    const payment = await this.paymentRepo.findByTransactionId(transactionId);
    if (!payment) {
      throw new NotFoundException('Paiement introuvable pour cette transaction');
    }

    const metadata = payment.metadata as any;
    const reference = metadata?.geniuspayReference || transactionId;

    const verification = await this.geniusPayService.verifyPayment(reference);
    const mappedStatus = mapGeniusPayStatus(verification.status);

    if (mappedStatus !== payment.status) {
      const updateData: any = {
        status: mappedStatus,
        metadata: {
          ...(payment.metadata as any || {}),
          geniuspayVerification: verification.metadata,
          lastVerifiedAt: new Date().toISOString(),
        },
      };

      if (mappedStatus === 'Success') {
        updateData.paymentDate = new Date();
      }

      await this.paymentRepo.updatePayment(payment.id, updateData);

      // Envoyer notification à la nounu si paiement réussi
      if (mappedStatus === 'Success' && payment.userId) {
        await this.notifRepo.create({
          type: 'PAIEMENT',
          title: 'Paiement reçu',
          message: `Vous avez reçu un paiement de ${payment.amount} ${payment.currency || 'XOF'}${metadata?.description ? ` (${metadata.description})` : ''}.`,
          userId: payment.userId,
          tolinkId: String(payment.id),
        });
      }
    }

    return {
      paymentId: payment.id,
      transactionId,
      status: mappedStatus,
      amount: payment.amount,
      currency: payment.currency,
    };
  }
}

function mapGeniusPayStatus(geniusPayStatus: string): string {
  const statusMap: Record<string, string> = {
    'COMPLETED': 'Success',
    'SUCCESS': 'Success',
    'FAILED': 'Failed',
    'CANCELLED': 'Cancelled',
    'REFUNDED': 'Cancelled',
    'PENDING': 'Pending',
    'PROCESSING': 'Pending',
    'EXPIRED': 'Failed',
  };
  return statusMap[geniusPayStatus?.toUpperCase()] || 'Pending';
}

@Injectable()
export class GetNounuPaymentsUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(nounuId: string) {
    const nounu = await this.adminRepo.findNounuById(nounuId);
    if (!nounu) throw new NotFoundException('Nounu introuvable');
    return this.adminRepo.findNounuPayments(nounu.userId);
  }
}

// ============================================================
//  SUB-ADMIN CREATION (super admin creates sub-admins)
// ============================================================

@Injectable()
export class CreateSubAdminUseCase {
  constructor(private readonly adminRepo: PrismaAdminRepository) {}

  async execute(data: { email: string; password: string; slug?: string; roleId: number; permissionIds?: number[] }) {
    const slug = data.slug || data.email.split('@')[0] + '-' + Date.now();
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const subAdmin = await this.adminRepo.createSubAdmin({
      slug,
      email: data.email,
      password: hashedPassword,
      roleId: data.roleId,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      await this.adminRepo.assignPermissionsBulk(data.roleId, data.permissionIds);
    }

    return subAdmin;
  }
}

// ============================================================
//  PACKS (subscription plans management)
// ============================================================

@Injectable()
export class GetAllPacksUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.packRepo.findAll(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetActivePacksUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute() {
    return this.packRepo.findActive();
  }
}

@Injectable()
export class GetPackUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute(id: number) {
    const pack = await this.packRepo.findById(id);
    if (!pack) throw new NotFoundException('Pack introuvable');
    return pack;
  }
}

@Injectable()
export class CreatePackUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute(data: {
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
    return this.packRepo.create(data);
  }
}

@Injectable()
export class UpdatePackUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute(id: number, data: any) {
    const pack = await this.packRepo.findById(id);
    if (!pack) throw new NotFoundException('Pack introuvable');
    return this.packRepo.update(id, data);
  }
}

@Injectable()
export class DeletePackUseCase {
  constructor(private readonly packRepo: PrismaPackRepository) {}

  async execute(id: number) {
    const pack = await this.packRepo.findById(id);
    if (!pack) throw new NotFoundException('Pack introuvable');
    return this.packRepo.softDelete(id);
  }
}
