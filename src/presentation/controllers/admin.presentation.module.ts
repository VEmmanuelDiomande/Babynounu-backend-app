import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminApplicationModule } from '../../application/admin/admin.application.module';
import { GatewayModule } from '../gateways/gateway.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';

@Module({
  imports: [
    AdminApplicationModule,
    GatewayModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [AdminController],
  providers: [RolesGuard, PermissionsGuard],
})
export class AdminPresentationModule {}
