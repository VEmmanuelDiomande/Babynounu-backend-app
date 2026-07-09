import { Injectable } from '@nestjs/common';
import { PushNotificationService, PushPayload } from '../../infrastructure/services/push-notification.service';

@Injectable()
export class SendPushNotificationUseCase {
  constructor(private readonly pushService: PushNotificationService) {}

  async execute(userId: string, payload: PushPayload): Promise<void> {
    await this.pushService.sendToUser(userId, payload);
  }
}

@Injectable()
export class RegisterDeviceTokenUseCase {
  constructor(private readonly pushService: PushNotificationService) {}

  async execute(userId: string, token: string, platform: string): Promise<void> {
    await this.pushService.registerToken(userId, token, platform);
  }
}

@Injectable()
export class UnregisterDeviceTokenUseCase {
  constructor(private readonly pushService: PushNotificationService) {}

  async execute(token: string): Promise<void> {
    await this.pushService.unregisterToken(token);
  }
}
