import { Module } from '@nestjs/common';
import {
  GetPaymentsUseCase,
  GetMyPaymentsUseCase,
  InitiatePaymentUseCase,
  ConfirmPaymentUseCase,
  VerifyPaymentUseCase,
  HandleNotifyUseCase,
  GetSubscriptionsUseCase,
  GetSubscriptionByIdUseCase,
  GetMySubscriptionUseCase,
  SubscribeUseCase,
} from './payment.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaPaymentRepository, PrismaSubscriptionRepository, PrismaPackRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { GeniusPayService } from '../../infrastructure/services/geniuspay.service';
import { ConfigModule } from '../../infrastructure/config/config.module';
import { AppConfig } from '../../infrastructure/config/app.config';
import { NotificationApplicationModule } from '../notification/notification.application.module';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { GatewayModule } from '../../presentation/gateways/gateway.module';

@Module({
  imports: [PrismaModule, ConfigModule, NotificationApplicationModule, GatewayModule],
  providers: [
    PrismaPaymentRepository,
    PrismaSubscriptionRepository,
    PrismaPackRepository,
    GeniusPayService,
    AppConfig,
    PrismaNotificationRepository,
    GetPaymentsUseCase,
    GetMyPaymentsUseCase,
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
    VerifyPaymentUseCase,
    HandleNotifyUseCase,
    GetSubscriptionsUseCase,
    GetSubscriptionByIdUseCase,
    GetMySubscriptionUseCase,
    SubscribeUseCase,
  ],
  exports: [
    GetPaymentsUseCase,
    GetMyPaymentsUseCase,
    InitiatePaymentUseCase,
    ConfirmPaymentUseCase,
    VerifyPaymentUseCase,
    HandleNotifyUseCase,
    GetSubscriptionsUseCase,
    GetSubscriptionByIdUseCase,
    GetMySubscriptionUseCase,
    SubscribeUseCase,
  ],
})
export class PaymentApplicationModule {}
