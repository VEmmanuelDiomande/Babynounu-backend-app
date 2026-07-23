import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaRoomRepository } from '../../infrastructure/repositories/job-chat-notification.repository';

@Injectable()
export class GetConversationsUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(userId: string) {
    return this.roomRepo.findConversationsByUser(userId);
  }
}

@Injectable()
export class GetRoomUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(roomId: number) {
    const room = await this.roomRepo.findById(roomId);
    if (!room) throw new NotFoundException('Conversation introuvable');
    return room;
  }
}

@Injectable()
export class GetMessagesUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(roomId: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.roomRepo.getMessages(roomId, skip, limit);
  }
}

@Injectable()
export class SendMessageUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(data: {
    roomId: number;
    senderId: string;
    content: string;
    type?: string;
    isProposition?: boolean;
    propositionExpired?: string;
    proposalStatus?: string;
    montant?: number;
    periode?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachmentType?: string;
  }) {
    const room = await this.roomRepo.findById(data.roomId);
    if (!room) throw new NotFoundException('Conversation introuvable');

    if (data.isProposition) {
      const now = new Date();
      const hasActive = (room.messages || []).some((m: any) =>
        m.isProposition &&
        m.proposalStatus === 'Pending' &&
        (!m.propositionExpired || new Date(m.propositionExpired) > now)
      );
      if (hasActive) {
        throw new BadRequestException('Une proposition est déjà en attente dans cette conversation');
      }
    }

    const result = await this.roomRepo.sendMessage(data);

    return result;
  }
}

@Injectable()
export class FindOrCreateRoomUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(data: {
    senderId: string;
    receiverId: string;
    nounuId?: string;
    parentId?: string;
  }) {
    return this.roomRepo.findOrCreate(data.senderId, data.receiverId, data.nounuId, data.parentId);
  }
}

@Injectable()
export class MarkAsReadUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(roomId: number, userId: string) {
    return this.roomRepo.markAsRead(roomId, userId);
  }
}

@Injectable()
export class GetUnreadCountUseCase {
  constructor(private readonly roomRepo: PrismaRoomRepository) {}

  async execute(userId: string) {
    return { unreadCount: await this.roomRepo.getUnreadCount(userId) };
  }
}
