import { Module } from '@nestjs/common';
import { NounuController } from './nounu.controller';
import { ProfileApplicationModule } from '../../application/profile/profile.application.module';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '../guards/roles.guard';
import { ParentRestrictionGuard } from '../guards/parent-restriction.guard';
import { SubscriptionGuard } from '../guards/subscription.guard';

@Module({
  imports: [
    ProfileApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [NounuController],
  providers: [RolesGuard, ParentRestrictionGuard, SubscriptionGuard],
})
export class NounuPresentationModule {}
