import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SignUpUseCase, SignInUseCase, GetProfileUseCase, RefreshTokenUseCase, LogoutUseCase, ForgotPasswordUseCase, ResetPasswordUseCase } from '../../application/auth/auth.usecases';
import { SignUpDto, SignInDto, ForgotPasswordDto, ResetPasswordDto } from '../dtos/auth.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly prisma: PrismaService,
  ) {}

  @Post('sign-up')
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  async signUp(@Body() dto: SignUpDto) {
    return this.signUpUseCase.execute(dto);
  }

  @Post('sign-in')
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  async signIn(@Body() dto: SignInDto) {
    return this.signInUseCase.execute(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getProfile(@Req() req: any) {
    return this.getProfileUseCase.execute(req.user.sub);
  }

  @Post('password-reset')
  @Throttle({ auth: { ttl: 60000, limit: 3 } })
  @ApiResponse({ status: 200, description: 'Email de réinitialisation envoyé' })
  async passwordReset(@Body() dto: ForgotPasswordDto) {
    return this.forgotPasswordUseCase.execute(dto.email);
  }

  @Post('password-reset-confirm')
  @Throttle({ auth: { ttl: 60000, limit: 5 } })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  async passwordResetConfirm(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordUseCase.execute(dto.code, dto.password);
  }

  @Post('refresh')
  @Throttle({ auth: { ttl: 60000, limit: 10 } })
  @ApiResponse({ status: 200, description: 'Token rafraichi avec succes' })
  async refreshToken(@Body() body: { refresh_token: string }) {
    return this.refreshTokenUseCase.execute(body.refresh_token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({ status: 200, description: 'Deconnexion reussie' })
  async logout(@Req() req: any) {
    await this.logoutUseCase.execute(req.user.sub);
    return { message: 'Deconnexion reussie' };
  }
}
