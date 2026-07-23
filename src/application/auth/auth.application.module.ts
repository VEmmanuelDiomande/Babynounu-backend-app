import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SignUpUseCase, SignInUseCase, GetProfileUseCase, RefreshTokenUseCase, LogoutUseCase, ForgotPasswordUseCase, ResetPasswordUseCase } from './auth.usecases';
import { RepositoriesModule } from '../../infrastructure/repositories/repositories.module';
import { MailService } from '../../infrastructure/services/mail.service';

@Module({
  imports: [
    RepositoriesModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  providers: [SignUpUseCase, SignInUseCase, GetProfileUseCase, RefreshTokenUseCase, LogoutUseCase, ForgotPasswordUseCase, ResetPasswordUseCase, MailService],
  exports: [SignUpUseCase, SignInUseCase, GetProfileUseCase, RefreshTokenUseCase, LogoutUseCase, ForgotPasswordUseCase, ResetPasswordUseCase, MailService],
})
export class AuthApplicationModule {}
