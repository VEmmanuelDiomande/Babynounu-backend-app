import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaPaymentRepository, PrismaSubscriptionRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { GeniusPayService } from '../../infrastructure/services/geniuspay.service';
import { AppConfig } from '../../infrastructure/config/app.config';
import { PaginationUtil } from '../../shared';

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
    if (!data.amount || data.amount <= 0) {
      throw new BadRequestException('Le montant du paiement doit être supérieur à 0');
    }

    const transactionId = this.geniusPayService.generateTransactionId();
    const currency = data.currency || 'XOF';

    const returnUrl = data.returnUrl
      ? `${data.returnUrl}?transaction_id=${transactionId}`
      : `${this.appConfig.frontendUrl}/payment/return?transaction_id=${transactionId}`;
    const errorUrl = data.returnUrl
      ? `${data.returnUrl}?transaction_id=${transactionId}&status=error`
      : `${this.appConfig.frontendUrl}/payment/return?transaction_id=${transactionId}&status=error`;

    const geniusPayResponse = await this.geniusPayService.initiatePayment({
      transactionId,
      amount: data.amount,
      currency,
      description: data.description || `Abonnement BabyNounu - ${data.amount} ${currency}`,
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
      amount: data.amount,
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
      amount: data.amount,
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
  ) {}

  async execute(body: any) {
    const transactionId = body?.transaction_id || body?.transactionId || body?.reference;
    if (!transactionId) {
      this.logger.warn('GeniusPay notify: missing transaction_id/reference');
      return { status: 'error', message: 'missing transaction_id' };
    }

    this.logger.log(`GeniusPay notify received for transaction: ${transactionId}`);

    const payment = await this.paymentRepo.findByTransactionId(transactionId);
    if (!payment) {
      this.logger.warn(`GeniusPay notify: payment not found for ${transactionId}`);
      return { status: 'error', message: 'payment not found' };
    }

    if (payment.status === 'Success') {
      this.logger.log(`Payment ${transactionId} already confirmed`);
      return { status: 'ok', message: 'already confirmed' };
    }

    const metadata = payment.metadata as any;
    const reference = metadata?.geniuspayReference || transactionId;

    const verification = await this.geniusPayService.verifyPayment(reference);
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

    this.logger.log(`Payment ${transactionId} updated to status: ${mappedStatus}`);

    if (mappedStatus === 'Success') {
      await this.notifRepo.create({
        type: 'PAIEMENT',
        title: 'Paiement confirmé',
        message: `Votre paiement de ${payment.amount} ${payment.currency || 'XOF'} a été confirmé avec succès.`,
        userId: payment.userId,
        tolinkId: String(payment.id),
      });
    }

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
    return this.subscriptionRepo.findUserSubscription(userId);
  }
}

@Injectable()
export class SubscribeUseCase {
  constructor(
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
    private readonly paymentRepo: PrismaPaymentRepository,
    private readonly notifRepo: PrismaNotificationRepository,
  ) {}

  async execute(userId: string, data: { paymentId: string; typeId?: number; packId?: number; durationDays?: number }) {
    const payment = await this.paymentRepo.findById(data.paymentId);
    if (!payment || payment.userId !== userId) throw new BadRequestException('Paiement invalide');
    if (payment.status !== 'Success') throw new BadRequestException('Paiement non confirmé');

    const expiresAt = new Date();
    const durationDays = data.durationDays || 30;
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const subscription = await this.subscriptionRepo.createSubscription({
      userId,
      status: 'active',
      expiresAt,
      paymentId: data.paymentId,
      typeId: data.typeId,
      packId: data.packId,
    });

    await this.notifRepo.create({
      type: 'ABONNEMENT',
      title: 'Abonnement activé',
      message: `Votre abonnement a été activé avec succès jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}.`,
      userId,
      tolinkId: String(subscription.id),
    });

    return subscription;
  }
}
