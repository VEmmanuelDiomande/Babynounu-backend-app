import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PaginationUtil } from '../../shared';
import { PushNotificationService } from '../../infrastructure/services/push-notification.service';

@Injectable()
export class GetNotificationsUseCase {
  constructor(private readonly notifRepo: PrismaNotificationRepository) {}

  async execute(userId: string, page?: number, limit?: number) {
    const options = PaginationUtil.createOptions(page, limit);
    const { data, total } = await this.notifRepo.findByUser(userId, PaginationUtil.getSkip(options), options.limit);
    return PaginationUtil.createResult(data, total, options);
  }
}

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notifRepo: PrismaNotificationRepository,
    @Optional() private readonly pushService?: PushNotificationService,
  ) {}

  async execute(data: {
    type: string;
    title?: string;
    message: string;
    userId: string;
    senderId?: string;
    jobId?: number;
    tolinkId?: string;
    isActions?: boolean;
  }) {
    const notification = await this.notifRepo.create(data);

    if (this.pushService) {
      await this.pushService.sendToUser(data.userId, {
        title: data.title || 'BabyNounu',
        body: data.message,
        data: {
          type: 'notification',
          notificationId: String(notification.id),
          notificationType: data.type,
          tolinkId: data.tolinkId || '',
          screen: 'NOTIFICATIONS',
        },
      });
    }

    return notification;
  }
}

@Injectable()
export class MarkNotificationReadUseCase {
  constructor(private readonly notifRepo: PrismaNotificationRepository) {}

  async execute(id: number) {
    return this.notifRepo.markAsRead(id);
  }
}

@Injectable()
export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notifRepo: PrismaNotificationRepository) {}

  async execute(userId: string) {
    return this.notifRepo.markAllAsRead(userId);
  }
}

@Injectable()
export class DeleteNotificationUseCase {
  constructor(private readonly notifRepo: PrismaNotificationRepository) {}

  async execute(id: number) {
    return this.notifRepo.delete(id);
  }
}

@Injectable()
export class GetUnreadNotificationsCountUseCase {
  constructor(private readonly notifRepo: PrismaNotificationRepository) {}

  async execute(userId: string) {
    return { unreadCount: await this.notifRepo.getUnreadCount(userId) };
  }
}
