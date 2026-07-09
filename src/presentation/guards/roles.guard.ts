import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userPayload = request.user;

    if (!userPayload?.sub) {
      throw new ForbiddenException('Accès refusé');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.sub },
      include: { role: true },
    });

    if (!user?.role) {
      throw new ForbiddenException('Accès refusé');
    }

    const hasRole = requiredRoles.includes(user.role.slug || '');
    if (!hasRole) {
      throw new ForbiddenException('Accès refusé');
    }

    return true;
  }
}
