import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationApplicationModule } from '../../application/notification/notification.application.module';
import { PushNotificationApplicationModule } from '../../application/push-notification/push-notification.application.module';

@Module({
  imports: [
    PrismaModule,
    NotificationApplicationModule,
    PushNotificationApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [ReviewController],
})
export class ReviewPresentationModule {}
