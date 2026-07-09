import { Module } from '@nestjs/common';
import {
  GetNotificationsUseCase,
  CreateNotificationUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  DeleteNotificationUseCase,
  GetUnreadNotificationsCountUseCase,
} from './notification.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PushNotificationApplicationModule } from '../push-notification/push-notification.application.module';

@Module({
  imports: [PrismaModule, PushNotificationApplicationModule],
  providers: [
    PrismaNotificationRepository,
    GetNotificationsUseCase,
    CreateNotificationUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
    GetUnreadNotificationsCountUseCase,
  ],
  exports: [
    PrismaNotificationRepository,
    GetNotificationsUseCase,
    CreateNotificationUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
    GetUnreadNotificationsCountUseCase,
  ],
})
export class NotificationApplicationModule {}
