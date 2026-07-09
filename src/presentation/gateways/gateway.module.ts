import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaRoomRepository, PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PrismaSubscriptionRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { JwtModule } from '@nestjs/jwt';
import { PushNotificationApplicationModule } from '../../application/push-notification/push-notification.application.module';

@Module({
  imports: [
    PrismaModule,
    PushNotificationApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  providers: [
    ChatGateway,
    PrismaRoomRepository,
    PrismaNotificationRepository,
    PrismaSubscriptionRepository,
  ],
  exports: [PushNotificationApplicationModule, ChatGateway],
})
export class GatewayModule {}
