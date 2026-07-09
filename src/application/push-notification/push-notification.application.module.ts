import { Module } from '@nestjs/common';
import { PushNotificationService } from '../../infrastructure/services/push-notification.service';
import {
  SendPushNotificationUseCase,
  RegisterDeviceTokenUseCase,
  UnregisterDeviceTokenUseCase,
} from './push-notification.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    PushNotificationService,
    SendPushNotificationUseCase,
    RegisterDeviceTokenUseCase,
    UnregisterDeviceTokenUseCase,
  ],
  exports: [
    PushNotificationService,
    SendPushNotificationUseCase,
    RegisterDeviceTokenUseCase,
    UnregisterDeviceTokenUseCase,
  ],
})
export class PushNotificationApplicationModule {}
