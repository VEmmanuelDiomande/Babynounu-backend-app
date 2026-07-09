import { Module } from '@nestjs/common';
import {
  GetConversationsUseCase,
  GetRoomUseCase,
  GetMessagesUseCase,
  SendMessageUseCase,
  FindOrCreateRoomUseCase,
  MarkAsReadUseCase,
  GetUnreadCountUseCase,
} from './chat.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaRoomRepository } from '../../infrastructure/repositories/job-chat-notification.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    PrismaRoomRepository,
    GetConversationsUseCase,
    GetRoomUseCase,
    GetMessagesUseCase,
    SendMessageUseCase,
    FindOrCreateRoomUseCase,
    MarkAsReadUseCase,
    GetUnreadCountUseCase,
  ],
  exports: [
    GetConversationsUseCase,
    GetRoomUseCase,
    GetMessagesUseCase,
    SendMessageUseCase,
    FindOrCreateRoomUseCase,
    MarkAsReadUseCase,
    GetUnreadCountUseCase,
  ],
})
export class ChatApplicationModule {}
