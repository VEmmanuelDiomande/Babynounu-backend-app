import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { PrismaRoomRepository, PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PrismaSubscriptionRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PushNotificationService } from '../../infrastructure/services/push-notification.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8100,http://localhost:8084,http://localhost:8085')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
@UseGuards(WsJwtGuard)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomRepo: PrismaRoomRepository,
    private readonly notifRepo: PrismaNotificationRepository,
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string) ||
        this.extractTokenFromHeader(client);

      if (!token) {
        console.warn('[ChatGateway] Connection without token, user room not joined');
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      client.data.user = payload;
      client.join(`user:${payload.sub}`);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { role: true },
      });
      if (user?.role?.slug === 'admin') {
        client.join('admin');
        console.log(`[ChatGateway] Admin client joined admin room`);
      }

      console.log(`[ChatGateway] Client connected and joined user:${payload.sub}`);
    } catch (error) {
      console.warn('[ChatGateway] Invalid token on connection, user room not joined');
    }
  }

  private extractTokenFromHeader(client: Socket): string | undefined {
    const auth = client.handshake.headers?.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      return auth.substring(7);
    }
    return undefined;
  }

  handleDisconnect(client: Socket) {
    // cleanup handled by socket.io automatically
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() roomId: number, @ConnectedSocket() client: Socket) {
    client.join(`room:${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: number; senderId: string; content: string; isProposition?: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.roomRepo.sendMessage({
      roomId: data.roomId,
      senderId: data.senderId,
      content: data.content,
      isProposition: data.isProposition,
    });
    const message = result.message || result;
    const notification = result.notification;

    const room = await this.roomRepo.findById(data.roomId);
    const receiverId = room?.senderId === data.senderId ? room?.receiverId : room?.senderId;

    if (receiverId) {
      await this.roomRepo.incrementUnread(data.roomId, receiverId);
    }

    this.server.to(`room:${data.roomId}`).emit('newMessage', message);
    this.server.to(`room:${data.roomId}`).emit('newMessageNotify', message);

    if (receiverId) {
      this.server.to(`room:${data.roomId}`).emit('conversationsUpdated');
      this.server.to('admin').emit('conversationsUpdated');
      this.server.to(`user:${receiverId}`).emit('newMessageNotify', message);
      this.server.to(`user:${receiverId}`).emit('conversationsUpdated');

      if (notification) {
        this.server.to(`user:${receiverId}`).emit('newNotification', notification);
        const unreadNotifCount = await this.notifRepo.getUnreadCount(receiverId);
        this.server.to(`user:${receiverId}`).emit('unreadCountsNotification', unreadNotifCount);
        this.server.to(`user:${receiverId}`).emit('allCountNotificationsByReceiverId', unreadNotifCount);
      }

      const totalUnread = await this.roomRepo.getUnreadCount(receiverId);
      this.server.to(`user:${receiverId}`).emit('unreadUpdated', {
        roomId: data.roomId,
        unreadCount: 1,
        totalUnread,
      });
      this.server.to(`user:${receiverId}`).emit('unreadCounts', totalUnread);

      // Send push notification if receiver is offline
      const isOnline = this.server.sockets.adapter.rooms.has(`user:${receiverId}`);
      if (!isOnline) {
        const sender = await this.prisma.user.findUnique({
          where: { id: data.senderId },
          include: { nounus: { take: 1 }, parents: { take: 1 } },
        });
        const senderName = sender?.nounus?.[0]?.fullname || sender?.parents?.[0]?.fullname || 'Un utilisateur';
        const contentPreview = data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content;

        await this.pushService.sendToUser(receiverId, {
          title: `Nouveau message de ${senderName}`,
          body: contentPreview,
          data: {
            type: 'message',
            roomId: String(data.roomId),
            screen: 'CHAT_MESSAGE_DETAIL',
          },
        });
      }
    }

    return message;
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() roomId: number,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;
    await this.roomRepo.markAsRead(roomId, userId);
    const totalUnread = await this.roomRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadUpdated', {
      roomId,
      unreadCount: 0,
      totalUnread,
    });
    this.server.to(`user:${userId}`).emit('unreadCounts', totalUnread);
    this.server.to('admin').emit('conversationsUpdated');

    // Emit updated notification count since MESSAGE/PROPOSITION notifications were also marked as read
    const unreadNotifCount = await this.notifRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadCountsNotification', unreadNotifCount);
    this.server.to(`user:${userId}`).emit('allCountNotificationsByReceiverId', unreadNotifCount);
  }

  @SubscribeMessage('getUnreadCounts')
  async handleGetUnreadCounts(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const totalUnread = await this.roomRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadCounts', totalUnread);
  }

  @SubscribeMessage('getUnreadCountsNotification')
  async handleGetUnreadCountsNotification(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const unreadCount = await this.notifRepo.getUnreadCount(data.userId);
    this.server.to(`user:${data.userId}`).emit('unreadCountsNotification', unreadCount);
  }

  @SubscribeMessage('getAllCountNotificationsByReceiverId')
  async handleGetAllCountNotifications(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    const unreadCount = await this.notifRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('allCountNotificationsByReceiverId', unreadCount);
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const notifications = await this.notifRepo.findByUser(data.userId, 0, 20);
    this.server.to(`user:${data.userId}`).emit('notifications', notifications);
  }

  @SubscribeMessage('markAsReadNotification')
  async handleMarkAsReadNotification(
    @MessageBody() data: { notificationId: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.notifRepo.markAsRead(data.notificationId);
    this.server.to(`user:${data.userId}`).emit('notificationMarkedAsRead', { notificationId: data.notificationId });
    const unreadCount = await this.notifRepo.getUnreadCount(data.userId);
    this.server.to(`user:${data.userId}`).emit('unreadCountsNotification', unreadCount);
    this.server.to(`user:${data.userId}`).emit('allCountNotificationsByReceiverId', unreadCount);
  }

  @SubscribeMessage('createNotification')
  async handleCreateNotification(
    @MessageBody() data: {
      type: string;
      title?: string;
      message: string;
      userId: string;
      senderId?: string;
      jobId?: number;
      tolinkId?: string;
      isActions?: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const notification = await this.notifRepo.create(data);

    this.server.to(`user:${data.userId}`).emit('newNotification', notification);

    const unreadCount = await this.notifRepo.getUnreadCount(data.userId);
    this.server.to(`user:${data.userId}`).emit('unreadCountsNotification', unreadCount);
    this.server.to(`user:${data.userId}`).emit('allCountNotificationsByReceiverId', unreadCount);

    const isOnline = this.server.sockets.adapter.rooms.has(`user:${data.userId}`);
    if (!isOnline) {
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

  @SubscribeMessage('isAbonnement')
  async handleIsAbonnement(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const subscription = await this.subscriptionRepo.findUserSubscription(data.userId);
    const hasActiveSubscription = !!subscription && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date();
    this.server.to(`user:${data.userId}`).emit('isAbonnement', { hasActiveSubscription });
  }

  @SubscribeMessage('isAbonnementUser')
  async handleIsAbonnementUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const subscription = await this.subscriptionRepo.findUserSubscription(data.userId);
    const hasActiveSubscription = !!subscription && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date();
    this.server.to(`user:${data.userId}`).emit('isAbonnement', { hasActiveSubscription });
  }

  @SubscribeMessage('checkIsAbonnement')
  async handleCheckIsAbonnement(
    @MessageBody() data: { userId: string; transactionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const subscription = await this.subscriptionRepo.findUserSubscription(data.userId);
    const hasActiveSubscription = !!subscription && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date();
    this.server.to(`user:${data.userId}`).emit('isAbonnement', { hasActiveSubscription, transactionId: data.transactionId });
  }

  @SubscribeMessage('checkPaymentPoint')
  async handleCheckPaymentPoint(
    @MessageBody() data: { userId: string; transactionId: string; points: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { id: data.transactionId, userId: data.userId },
    });
    this.server.to(`user:${data.userId}`).emit('paymentPointChecked', {
      transactionId: data.transactionId,
      points: data.points,
      status: payment?.status || 'not_found',
    });
  }

  @SubscribeMessage('typingStart')
  async handleTypingStart(
    @MessageBody() data: { roomId: number; userId: string; userName: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.roomId}`).emit('userTyping', { userId: data.userId, userName: data.userName });
  }

  @SubscribeMessage('typingStop')
  async handleTypingStop(
    @MessageBody() data: { roomId: number; userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.roomId}`).emit('userStoppedTyping', { userId: data.userId });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { sender: any; room: any },
    @ConnectedSocket() client: Socket,
  ) {
    client.to(`room:${data.room}`).emit('typing', data.sender);
  }

  @SubscribeMessage('getConversation')
  async handleGetConversation(
    @MessageBody() room: number,
    @ConnectedSocket() client: Socket,
  ) {
    const conversation = await this.roomRepo.findById(room);
    client.emit('conversation', conversation);
  }

  @SubscribeMessage('checkMultipleUsersStatus')
  async handleCheckMultipleUsersStatus(
    @MessageBody() userIds: string[],
    @ConnectedSocket() client: Socket,
  ) {
    for (const userId of userIds) {
      const isOnline = this.server.sockets.adapter.rooms.has(`user:${userId}`);
      client.emit('userOnline', isOnline ? userId : null);
    }
  }

  async notifyNewMessage(roomId: number, message: any, senderId: string, receiverId?: string) {
    const room = await this.roomRepo.findById(roomId);
    const calculatedReceiverId = receiverId || (room?.senderId === senderId ? room?.receiverId : room?.senderId);
    console.log(`[ChatGateway] notifyNewMessage roomId=${roomId} senderId=${senderId} receiverId=${calculatedReceiverId}`);

    if (calculatedReceiverId) {
      await this.roomRepo.incrementUnread(roomId, calculatedReceiverId);
    }

    this.server.to(`room:${roomId}`).emit('newMessage', message);
    this.server.to(`room:${roomId}`).emit('newMessageNotify', message);
    this.server.to(`room:${roomId}`).emit('conversationsUpdated');
    this.server.to('admin').emit('conversationsUpdated');

    if (calculatedReceiverId) {
      this.server.to(`user:${calculatedReceiverId}`).emit('newMessageNotify', message);
      this.server.to(`user:${calculatedReceiverId}`).emit('conversationsUpdated');

      const totalUnread = await this.roomRepo.getUnreadCount(calculatedReceiverId);
      this.server.to(`user:${calculatedReceiverId}`).emit('unreadUpdated', {
        roomId,
        unreadCount: 1,
        totalUnread,
      });
      this.server.to(`user:${calculatedReceiverId}`).emit('unreadCounts', totalUnread);

      const isOnline = this.server.sockets.adapter.rooms.has(`user:${calculatedReceiverId}`);
      if (!isOnline) {
        const sender = await this.prisma.user.findUnique({
          where: { id: senderId },
          include: { nounus: { take: 1 }, parents: { take: 1 } },
        });
        const senderName = sender?.nounus?.[0]?.fullname || sender?.parents?.[0]?.fullname || 'Un utilisateur';
        const contentPreview = message.content?.length > 100 ? message.content.substring(0, 100) + '...' : message.content;

        await this.pushService.sendToUser(calculatedReceiverId, {
          title: `Nouveau message de ${senderName}`,
          body: contentPreview,
          data: {
            type: 'message',
            roomId: String(roomId),
            screen: 'CHAT_MESSAGE_DETAIL',
          },
        });
      }
    }
  }

  async notifyNewNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('newNotification', notification);

    const unreadCount = await this.notifRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadCountsNotification', unreadCount);
    this.server.to(`user:${userId}`).emit('allCountNotificationsByReceiverId', unreadCount);

    const isOnline = this.server.sockets.adapter.rooms.has(`user:${userId}`);
    if (!isOnline) {
      await this.pushService.sendToUser(userId, {
        title: notification.title || 'BabyNounu',
        body: notification.message,
        data: {
          type: 'notification',
          notificationId: String(notification.id),
          notificationType: notification.type,
          tolinkId: notification.tolinkId || '',
          screen: 'NOTIFICATIONS',
        },
      });
    }
  }

  async notifyCountsAfterRead(roomId: number, userId: string) {
    const totalUnread = await this.roomRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadUpdated', {
      roomId,
      unreadCount: 0,
      totalUnread,
    });
    this.server.to(`user:${userId}`).emit('unreadCounts', totalUnread);
    this.server.to('admin').emit('conversationsUpdated');

    const unreadNotifCount = await this.notifRepo.getUnreadCount(userId);
    this.server.to(`user:${userId}`).emit('unreadCountsNotification', unreadNotifCount);
    this.server.to(`user:${userId}`).emit('allCountNotificationsByReceiverId', unreadNotifCount);
  }
}
