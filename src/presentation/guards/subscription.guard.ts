import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    let userId: string | undefined = (request as any).user?.sub;

    if (!userId) {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      if (type === 'Bearer' && token) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
          });
          userId = payload.sub;
        } catch {
          return true;
        }
      }
    }

    if (!userId) {
      return true;
    }

    const parentProfile = await this.prisma.profilParent.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!parentProfile) {
      return true;
    }

    const activeSubscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: 'active',
        deletedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (!activeSubscription) {
      throw new ForbiddenException(
        'Vous devez avoir un abonnement actif pour accéder à cette fonctionnalité.',
      );
    }

    return true;
  }
}
