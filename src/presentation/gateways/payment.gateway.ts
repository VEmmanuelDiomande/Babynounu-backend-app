import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PrismaSubscriptionRepository } from '../../infrastructure/repositories/payment-media-admin.repository';

@WebSocketGateway({
  namespace: '/payment',
  cors: {
    origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:8100,http://localhost:8081,http://localhost:8084,http://localhost:8085')
      .split(',')
      .map((o) => o.trim()),
    credentials: true,
  },
})
export class PaymentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionRepo: PrismaSubscriptionRepository,
  ) {}

  async handleConnection(client: Socket) {
    const userId = client.handshake.query?.userId as string;
    const transactionId = client.handshake.query?.transactionId as string;

    if (!userId || !transactionId) {
      console.warn('[PaymentGateway] Connection without userId or transactionId');
      return;
    }

    client.join(`payment:${userId}:${transactionId}`);
    console.log(`[PaymentGateway] Client joined payment:${userId}:${transactionId}`);
  }

  handleDisconnect(client: Socket) {
    // cleanup handled by socket.io automatically
  }

  @SubscribeMessage('checkPaymentStatus')
  async handleCheckPaymentStatus(
    @MessageBody() data: { userId: string; transactionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const payment = await this.prisma.payment.findFirst({
      where: { transactionId: data.transactionId, userId: data.userId },
    });

    if (!payment) {
      client.emit('paymentStatus', {
        transactionId: data.transactionId,
        status: 'not_found',
        isPayment: false,
        hasActiveSubscription: false,
      });
      return;
    }

    const subscription = await this.subscriptionRepo.findUserSubscription(data.userId);
    const hasActiveSubscription =
      !!subscription && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date();

    client.emit('paymentStatus', {
      transactionId: data.transactionId,
      status: payment.status,
      isPayment: payment.status === 'Success',
      hasActiveSubscription,
    });
  }

  @SubscribeMessage('checkSubscription')
  async handleCheckSubscription(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const subscription = await this.subscriptionRepo.findUserSubscription(data.userId);
    const hasActiveSubscription =
      !!subscription && subscription.status === 'active' && new Date(subscription.expiresAt) > new Date();

    client.emit('subscriptionStatus', { hasActiveSubscription });
  }

  async notifyPaymentStatus(userId: string, transactionId: string, payload: {
    status: string;
    isPayment: boolean;
    hasActiveSubscription: boolean;
    transactionId: string;
  }) {
    this.server
      .to(`payment:${userId}:${transactionId}`)
      .emit('paymentStatus', payload);
    console.log(`[PaymentGateway] Emitted paymentStatus to payment:${userId}:${transactionId}`, payload);
  }
}
