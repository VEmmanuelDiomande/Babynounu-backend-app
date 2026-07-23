import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaPaymentRepository, PrismaSubscriptionRepository, PrismaPackRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { GeniusPayService } from '../../infrastructure/services/geniuspay.service';
import { AppConfig } from '../../infrastructure/config/app.config';
import { PaginationUtil } from '../../shared';
import { PaymentGateway } from '../../presentation/gateways/payment.gateway';

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
export class GetPaymentsUseCase {
  constructor(private readonly paymentRepo: PrismaPaymentRepository) {}

  async execute(page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.paymentRepo.findAll(PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class GetMyPaymentsUseCase {
  constructor(private readonly paymentRepo: PrismaPaymentRepository) {}

  async execute(userId: string) {
    return this.paymentRepo.findByUser(userId);
  }
}

@Injectable()
export class InitiatePaymentUseCase {
  private readonly logger = new Logger(InitiatePaymentUseCase.name);

  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly appConfig: AppConfig,
    private readonly packRepo: PrismaPackRepository,
  ) {}

  async execute(userId: string, data: {
    amount: number;
    paymentMethod?: string;
    paymentType?: string;
    currency?: string;
    customerName?: string;
    customerSurname?: string;
    customerEmail?: string;
    customerPhoneNumber?: string;
    description?: string;
    packId?: number;
    returnUrl?: string;
  }) {
    let amount = data.amount;
    let currency = data.currency || 'XOF';
    let description = data.description;

    if (data.packId) {
      const pack = await this.packRepo.findById(data.packId);
      if (!pack || pack.deletedAt) {
        throw new NotFoundException('Pack introuvable');
      }
      if (!pack.isActive) {
        throw new BadRequestException('Ce pack n\'est plus disponible');
      }
      amount = pack.price;
      currency = pack.currency || 'XOF';
      description = description || `Abonnement ${pack.name} - ${pack.price} ${currency}`;
    }

    if (!amount || amount <= 0) {
      throw new BadRequestException('Le montant du paiement doit être supérieur à 0');
    }

    const transactionId = this.geniusPayService.generateTransactionId();

    const returnUrl = data.returnUrl
      ? `${data.returnUrl}?transaction_id=${transactionId}&userId=${userId}`
      : `${this.appConfig.frontendUrl}/payment/return?transaction_id=${transactionId}`;
    const errorUrl = data.returnUrl
      ? `${data.returnUrl}?transaction_id=${transactionId}&userId=${userId}&status=error`
      : `${this.appConfig.frontendUrl}/payment/return?transaction_id=${transactionId}&status=error`;

    const geniusPayResponse = await this.geniusPayService.initiatePayment({
      transactionId,
      amount,
      currency,
      description: description || `Abonnement BabyNounu - ${amount} ${currency}`,
      customerName: data.customerName || 'Client',
      customerEmail: data.customerEmail || '',
      customerPhoneNumber: data.customerPhoneNumber || '',
      returnUrl,
      errorUrl,
      metadata: {
        packId: data.packId,
        userId,
      },
    });

    const payment = await this.paymentRepo.create({
      userId,
      amount,
      status: 'Pending',
      paymentMethod: data.paymentMethod,
      paymentType: data.paymentType,
      currency,
      transactionId,
      metadata: {
        geniuspayReference: geniusPayResponse.reference,
        paymentUrl: geniusPayResponse.paymentUrl,
        packId: data.packId,
        customerInfo: {
          name: data.customerName,
          surname: data.customerSurname,
          email: data.customerEmail,
          phone: data.customerPhoneNumber,
        },
      },
    });

    return {
      paymentId: payment.id,
      transactionId,
      paymentUrl: geniusPayResponse.paymentUrl,
      status: 'Pending',
      amount,
      currency,
    };
  }
}

@Injectable()
export class VerifyPaymentUseCase {
  private readonly logger = new Logger(VerifyPaymentUseCase.name);

  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly packRepo: PrismaPackRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(transactionId: string) {
    let payment: any = await this.paymentRepo.findByTransactionId(transactionId);
    if (!payment) {
      payment = await this.paymentRepo.findByGeniuspayReference(transactionId);
    }
    if (!payment) {
      throw new NotFoundException('Paiement introuvable pour cette transaction');
    }

    const actualTransactionId = payment.transactionId;

    // If payment is already confirmed in DB, skip GeniusPay verification
    if (payment.status === 'Success') {
      const subscription = await this.subscriptionRepo.findUserSubscription(payment.userId);
      const hasActiveSubscription =
        !!subscription && subscription.status === 'active' && (
          subscription.expiresAt === null || new Date(subscription.expiresAt) > new Date()
        );

      // Auto-create subscription if missing
      if (!hasActiveSubscription) {
        await this.ensureSubscription(payment);
      }

      await this.paymentGateway.notifyPaymentStatus(payment.userId, actualTransactionId, {
        status: 'Success',
        isPayment: true,
        hasActiveSubscription: true,
        transactionId: actualTransactionId,
      });

      return {
        paymentId: payment.id,
        transactionId: actualTransactionId,
        status: 'Success',
        amount: payment.amount,
        currency: payment.currency,
      };
    }

    // Try GeniusPay verification
    const metadata = payment.metadata as any;
    const reference = metadata?.geniuspayReference || transactionId;

    let mappedStatus: string;
    let verificationData: any = null;

    try {
      const verification = await this.geniusPayService.verifyPayment(reference);
      mappedStatus = mapGeniusPayStatus(verification.status);
      verificationData = verification.metadata;
    } catch (error) {
      this.logger.warn(`GeniusPay verification failed for ${transactionId}: ${(error as any)?.message}. Returning DB status: ${payment.status}`);
      mappedStatus = payment.status;
    }

    if (mappedStatus !== payment.status) {
      const updateData: any = {
        status: mappedStatus,
        metadata: {
          ...(payment.metadata as any || {}),
          geniuspayVerification: verificationData,
          lastVerifiedAt: new Date().toISOString(),
        },
      };

      if (mappedStatus === 'Success') {
        updateData.paymentDate = new Date();
      }

      await this.paymentRepo.updatePayment(payment.id, updateData);
    }

    // Auto-create subscription if payment is now Success
    if (mappedStatus === 'Success') {
      await this.ensureSubscription(payment);
    }

    const subscription = await this.subscriptionRepo.findUserSubscription(payment.userId);
    const hasActiveSubscription =
      !!subscription && subscription.status === 'active' && (
        subscription.expiresAt === null || new Date(subscription.expiresAt) > new Date()
      );

    await this.paymentGateway.notifyPaymentStatus(payment.userId, actualTransactionId, {
      status: mappedStatus,
      isPayment: mappedStatus === 'Success',
      hasActiveSubscription,
      transactionId: actualTransactionId,
    });

    return {
      paymentId: payment.id,
      transactionId: actualTransactionId,
      status: mappedStatus,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  private async ensureSubscription(payment: any): Promise<void> {
    const existingSub = await this.subscriptionRepo.findUserSubscription(payment.userId);
    if (existingSub) return;

    const metadata = payment.metadata as any;
    const packId = metadata?.packId;

    let expiresAt: Date | null = null;
    let isLifetime = false;

    if (packId) {
      const pack = await this.packRepo.findById(packId);
      if (pack && !pack.deletedAt) {
        if (!pack.durationDays || pack.durationDays === 0) {
          isLifetime = true;
          expiresAt = null;
        } else {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + pack.durationDays);
        }
      }
    } else {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const subscription = await this.subscriptionRepo.createSubscription({
      userId: payment.userId,
      status: 'active',
      expiresAt,
      paymentId: payment.id,
      packId,
    });

    const expiryMsg = isLifetime
      ? 'Votre abonnement a été activé avec succès (à vie).'
      : `Votre abonnement a été activé avec succès jusqu'au ${expiresAt!.toLocaleDateString('fr-FR')}.`;

    await this.notifRepo.create({
      type: 'ABONNEMENT',
      title: 'Abonnement activé',
      message: expiryMsg,
      userId: payment.userId,
      tolinkId: String(subscription.id),
    });

    this.logger.log(`Auto-created subscription for user ${payment.userId}, payment ${payment.id}`);
  }

}

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly verifyPaymentUseCase: VerifyPaymentUseCase,
  ) {}

  async execute(id: string, _status?: string, transactionId?: string) {
    const payment = await this.paymentRepo.findById(id);
    if (!payment) throw new NotFoundException('Paiement introuvable');

    const txId = transactionId || payment.transactionId;
    if (!txId) throw new BadRequestException('Aucun identifiant de transaction trouvé');

    return this.verifyPaymentUseCase.execute(txId);
  }
}

@Injectable()
export class HandleNotifyUseCase {
  private readonly logger = new Logger(HandleNotifyUseCase.name);

  constructor(
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly geniusPayService: GeniusPayService,
    private readonly notifRepo: PrismaNotificationRepository,
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
    private readonly paymentGateway: PaymentGateway,
    private readonly packRepo: PrismaPackRepository,
  ) {}

  async execute(body: any) {
    const transactionId = body?.transaction_id || body?.transactionId;
    const reference = body?.reference;
    if (!transactionId && !reference) {
      this.logger.warn('GeniusPay notify: missing transaction_id/reference');
      return { status: 'error', message: 'missing transaction_id' };
    }

    this.logger.log(`GeniusPay notify received: transactionId=${transactionId}, reference=${reference}`);

    // Try lookup by transactionId first, then by GeniusPay reference
    let payment: any = transactionId ? await this.paymentRepo.findByTransactionId(transactionId) : null;
    if (!payment && reference) {
      payment = await this.paymentRepo.findByGeniuspayReference(reference);
    }
    if (!payment) {
      this.logger.warn(`GeniusPay notify: payment not found for transactionId=${transactionId}, reference=${reference}`);
      return { status: 'error', message: 'payment not found' };
    }

    const actualTransactionId = payment.transactionId;

    if (payment.status === 'Success') {
      this.logger.log(`Payment ${actualTransactionId} already confirmed`);
      return { status: 'ok', message: 'already confirmed' };
    }

    const metadata = payment.metadata as any;
    const verifyReference = metadata?.geniuspayReference || reference || actualTransactionId;

    const verification = await this.geniusPayService.verifyPayment(verifyReference);
    const mappedStatus = mapGeniusPayStatus(verification.status);

    const updateData: any = {
      status: mappedStatus,
      metadata: {
        ...(payment.metadata as any || {}),
        geniuspayNotification: body,
        geniuspayVerification: verification.metadata,
        notifiedAt: new Date().toISOString(),
      },
    };

    if (mappedStatus === 'Success') updateData.paymentDate = new Date();

    await this.paymentRepo.updatePayment(payment.id, updateData);

    this.logger.log(`Payment ${actualTransactionId} updated to status: ${mappedStatus}`);

    if (mappedStatus === 'Success') {
      await this.notifRepo.create({
        type: 'PAIEMENT',
        title: 'Paiement confirmé',
        message: `Votre paiement de ${payment.amount} ${payment.currency || 'XOF'} a été confirmé avec succès.`,
        userId: payment.userId,
        tolinkId: String(payment.id),
      });

      // Auto-create subscription if missing
      const existingSub = await this.subscriptionRepo.findUserSubscription(payment.userId);
      if (!existingSub) {
        const packId = metadata?.packId;
        let expiresAt: Date | null = null;
        let isLifetime = false;

        if (packId) {
          const pack = await this.packRepo.findById(packId);
          if (pack && !pack.deletedAt) {
            if (!pack.durationDays || pack.durationDays === 0) {
              isLifetime = true;
              expiresAt = null;
            } else {
              expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + pack.durationDays);
            }
          }
        } else {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        const subscription = await this.subscriptionRepo.createSubscription({
          userId: payment.userId,
          status: 'active',
          expiresAt,
          paymentId: payment.id,
          packId,
        });

        const expiryMsg = isLifetime
          ? 'Votre abonnement a été activé avec succès (à vie).'
          : `Votre abonnement a été activé avec succès jusqu'au ${expiresAt!.toLocaleDateString('fr-FR')}.`;

        await this.notifRepo.create({
          type: 'ABONNEMENT',
          title: 'Abonnement activé',
          message: expiryMsg,
          userId: payment.userId,
          tolinkId: String(subscription.id),
        });

        this.logger.log(`Auto-created subscription for user ${payment.userId}, payment ${payment.id}`);
      }
    }

    const subscription = await this.subscriptionRepo.findUserSubscription(payment.userId);
    const hasActiveSubscription =
      !!subscription && subscription.status === 'active' && (
        subscription.expiresAt === null || new Date(subscription.expiresAt) > new Date()
      );

    await this.paymentGateway.notifyPaymentStatus(payment.userId, actualTransactionId, {
      status: mappedStatus,
      isPayment: mappedStatus === 'Success',
      hasActiveSubscription,
      transactionId: actualTransactionId,
    });

    return { status: 'ok', message: 'payment updated', paymentStatus: mappedStatus };
  }
}

// === SUBSCRIPTION ===

@Injectable()
export class GetSubscriptionsUseCase {
  constructor(private readonly subscriptionRepo: PrismaSubscriptionRepository) {}

  async execute() {
    return this.subscriptionRepo.findAll();
  }
}

@Injectable()
export class GetSubscriptionByIdUseCase {
  constructor(private readonly subscriptionRepo: PrismaSubscriptionRepository) {}

  async execute(id: string) {
    const subscription = await this.subscriptionRepo.findById(id);
    if (!subscription) throw new NotFoundException('Abonnement introuvable');
    return subscription;
  }
}

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(private readonly subscriptionRepo: PrismaSubscriptionRepository) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepo.findUserSubscription(userId);
    if (!subscription) return null;

    const packFeatures = (subscription as any).pack?.features;
    const features: string[] = Array.isArray(packFeatures) ? packFeatures : [];

    return { ...subscription, features };
  }
}

@Injectable()
export class SubscribeUseCase {
  constructor(
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly notifRepo: PrismaNotificationRepository,
    private readonly packRepo: PrismaPackRepository,
  ) {}

  async execute(userId: string, data: { paymentId: string; typeId?: number; packId?: number; durationDays?: number }) {
    const payment = await this.paymentRepo.findById(data.paymentId);
    if (!payment || payment.userId !== userId) throw new BadRequestException('Paiement invalide');
    if (payment.status !== 'Success') throw new BadRequestException('Paiement non confirmé');

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

    const subscription = await this.subscriptionRepo.createSubscription({
      userId,
      status: 'active',
      expiresAt,
      paymentId: data.paymentId,
      typeId: data.typeId,
      packId: data.packId,
    });

    const expiryMsg = isLifetime
      ? 'Votre abonnement a été activé avec succès (à vie).'
      : `Votre abonnement a été activé avec succès jusqu'au ${expiresAt!.toLocaleDateString('fr-FR')}.`;

    await this.notifRepo.create({
      type: 'ABONNEMENT',
      title: 'Abonnement activé',
      message: expiryMsg,
      userId,
      tolinkId: String(subscription.id),
    });

    return subscription;
  }
}
