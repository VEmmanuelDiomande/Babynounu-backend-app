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
export class ParentRestrictionGuard implements CanActivate {
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

    if (parentProfile?.restricted) {
      throw new ForbiddenException(
        'Votre compte a été restreint. Vous ne pouvez plus accéder à cette fonctionnalité.',
      );
    }

    return true;
  }
}
