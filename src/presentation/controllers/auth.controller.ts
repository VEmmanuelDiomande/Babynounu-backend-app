import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SignUpUseCase, SignInUseCase, GetProfileUseCase, RefreshTokenUseCase, LogoutUseCase } from '../../application/auth/auth.usecases';
import { SignUpDto, SignInDto } from '../dtos/auth.dto';
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
  async passwordReset(@Body() body: { email: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
  }

  @Post('send-mail')
  async sendMail(@Body() body: { email: string }) {
    return { message: 'Email envoye avec succes' };
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
