import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileApplicationModule } from '../../application/profile/profile.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ProfileApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [ProfileController],
})
export class ProfilePresentationModule {}
