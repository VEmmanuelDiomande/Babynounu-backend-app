import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthApplicationModule } from '../../application/auth/auth.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [AuthController],
})
export class AuthPresentationModule {}
