import { Module } from '@nestjs/common';
import { PushNotificationController } from './push-notification.controller';
import { PushNotificationApplicationModule } from '../../application/push-notification/push-notification.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PushNotificationApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [PushNotificationController],
  exports: [PushNotificationApplicationModule],
})
export class PushNotificationPresentationModule {}
