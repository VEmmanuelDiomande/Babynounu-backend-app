import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging, MulticastMessage, SendResponse } from 'firebase-admin/messaging';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private initialized = false;

  constructor(private readonly prisma: PrismaService) {
    this.initFirebase();
  }

  private initFirebase(): void {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (!serviceAccountPath && !serviceAccountJson) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications will be skipped');
      return;
    }

    try {
      if (getApps().length > 0) {
        this.initialized = true;
        return;
      }

      let serviceAccount: ServiceAccount;

      if (serviceAccountJson) {
        serviceAccount = JSON.parse(serviceAccountJson);
      } else if (serviceAccountPath) {
        serviceAccount = require(serviceAccountPath) as ServiceAccount;
      }

      initializeApp({
        credential: cert(serviceAccount),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.initialized) return;

    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, deletedAt: null },
      select: { token: true },
    });

    if (tokens.length === 0) return;

    const deviceTokens = tokens.map((t) => t.token);

    const message: MulticastMessage = {
      tokens: deviceTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      android: {
        notification: {
          sound: 'default',
          channelId: 'babynounu_notifications',
          priority: 'high',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);

      if (response.failureCount > 0) {
        await this.handleFailedTokens(deviceTokens, response.responses);
      }

      this.logger.log(`Push sent to ${response.successCount}/${deviceTokens.length} devices for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push to user ${userId}:`, error);
    }
  }

  private async handleFailedTokens(tokens: string[], responses: SendResponse[]): Promise<void> {
    const tokensToRemove: string[] = [];

    responses.forEach((result, index) => {
      if (!result.success && result.error) {
        const errorMsg = result.error.message;
        if (errorMsg.includes('UNREGISTERED') || errorMsg.includes('invalid-registration-token')) {
          tokensToRemove.push(tokens[index]);
        }
      }
    });

    if (tokensToRemove.length > 0) {
      await this.prisma.deviceToken.updateMany({
        where: { token: { in: tokensToRemove } },
        data: { deletedAt: new Date() },
      });
      this.logger.log(`Removed ${tokensToRemove.length} invalid device tokens`);
    }
  }

  async registerToken(userId: string, token: string, platform: string): Promise<void> {
    await this.prisma.deviceToken.upsert({
      where: { token },
      update: { userId, platform, deletedAt: null },
      create: { userId, token, platform },
    });
    this.logger.log(`Device token registered for user ${userId} (platform: ${platform})`);
  }

  async unregisterToken(token: string): Promise<void> {
    await this.prisma.deviceToken.updateMany({
      where: { token },
      data: { deletedAt: new Date() },
    });
  }

  async isUserOnline(userId: string, server: any): Promise<boolean> {
    return server.sockets.adapter.rooms.has(`user:${userId}`);
  }
}
