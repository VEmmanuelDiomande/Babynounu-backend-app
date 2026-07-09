import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationApplicationModule } from '../../application/notification/notification.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    NotificationApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [NotificationController],
})
export class NotificationPresentationModule {}
