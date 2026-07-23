import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Inject } from '@nestjs/common';
import { IUserRepository, IProfileRepository } from '../../domain';
import { MailService } from '../../infrastructure/services/mail.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

// Translate public sign-up type_profil values to the slugs stored in the parameters table
const TYPE_PROFIL_INPUT_TO_DB: Record<string, string> = {
  parent: 'client',
  nounu: 'prestataire',
  prestataire: 'prestataire',
  admin: 'administrateur',
};

// Translate public sign-up type_profil values to the matching role slug in the parameters table
const ROLE_INPUT_TO_DB: Record<string, string> = {
  parent: 'parent',
  nounu: 'nounou',
  prestataire: 'nounou',
  admin: 'admin',
};

// Normalize database type_profil slugs back to the public slugs expected by the frontend
const DB_TO_NORMALIZED_TYPE_PROFIL: Record<string, string> = {
  client: 'parent',
  prestataire: 'nounu',
  administrateur: 'admin',
};

// Normalize database role slugs back to the public slugs expected by the frontend
const DB_TO_NORMALIZED_ROLE: Record<string, string> = {
  parent: 'parent',
  nounou: 'nounu',
  admin: 'admin',
};

export interface SignUpInput {
  email: string;
  password: string;
  type_profil: string;
  role?: string;
  slug?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthOutput {
  user: {
    id: string;
    email: string;
    slug: string;
    access_token: string;
    refresh_token: string;
    role?: { id: number; slug: string; name: string };
    type_profil?: { id: number; slug: string; name: string; description: string };
    profil: any[];
  };
}

@Injectable()
export class SignUpUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: SignUpInput): Promise<AuthOutput> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    const slug = input.slug || input.email.split('@')[0] + '-' + Date.now();
    const hashedPassword = await bcrypt.hash(input.password, 10);

    const typeProfilSlug = TYPE_PROFIL_INPUT_TO_DB[input.type_profil];
    const roleSlug = ROLE_INPUT_TO_DB[input.type_profil];

    const [typeProfil, role] = await Promise.all([
      this.userRepo.findParameterBySlug(typeProfilSlug),
      this.userRepo.findParameterBySlug(roleSlug),
    ]);

    if (!typeProfil || !role) {
      throw new BadRequestException('Type de profil invalide');
    }

    const user = await this.userRepo.create({
      slug,
      email: input.email,
      password: hashedPassword,
      roleId: role.id,
      typeProfilId: typeProfil.id,
    });

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, slug: user.slug },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, slug: user.slug, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, expiresIn: '7d' },
    );

    await this.userRepo.update(user.id, { accessToken: token, refreshToken });

    const profile = await this.userRepo.getProfile(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        slug: user.slug,
        access_token: token,
        refresh_token: refreshToken,
        role: {
          id: role.id,
          slug: input.type_profil === 'admin' ? 'admin' : input.type_profil === 'parent' ? 'parent' : 'nounu',
          name: role.name,
        },
        type_profil: {
          id: typeProfil.id,
          slug: input.type_profil,
          name: typeProfil.name,
          description: typeProfil.name,
        },
        profil: [],
      },
    };
  }
}

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: SignInInput): Promise<AuthOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, slug: user.slug },
      { secret: process.env.JWT_SECRET, expiresIn: '15m' },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, slug: user.slug, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, expiresIn: '7d' },
    );

    await this.userRepo.update(user.id, { accessToken: token, refreshToken });

    const profile = await this.userRepo.getProfile(user.id);

    const profil: any[] = [];
    if (profile?.nounu && profile.nounu.length > 0) profil.push(...profile.nounu);
    if (profile?.parent && profile.parent.length > 0) profil.push(...profile.parent);

    return {
      user: {
        id: user.id,
        email: user.email,
        slug: user.slug,
        access_token: token,
        refresh_token: refreshToken,
        role: profile?.role
          ? { id: profile.role.id, slug: DB_TO_NORMALIZED_ROLE[profile.role.slug] || profile.role.slug, name: profile.role.name }
          : undefined,
        type_profil: profile?.typeProfil
          ? { id: profile.typeProfil.id, slug: DB_TO_NORMALIZED_TYPE_PROFIL[profile.typeProfil.slug] || profile.typeProfil.slug, name: profile.typeProfil.name, description: profile.typeProfil.name }
          : undefined,
        profil,
      },
    };
  }
}

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string) {
    const profile = await this.userRepo.getProfile(userId);
    if (!profile) {
      throw new BadRequestException('Utilisateur introuvable');
    }
    return profile;
  }
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<AuthOutput> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token invalide');
      }

      const user = await this.userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Utilisateur introuvable');
      }

      if (user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Token de rafraichissement invalide');
      }

      const newToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, slug: user.slug },
        { secret: process.env.JWT_SECRET, expiresIn: '15m' },
      );

      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, slug: user.slug, type: 'refresh' },
        { secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, expiresIn: '7d' },
      );

      await this.userRepo.update(user.id, { accessToken: newToken, refreshToken: newRefreshToken });

      const profile = await this.userRepo.getProfile(user.id);

      const profil: any[] = [];
      if (profile?.nounu && profile.nounu.length > 0) profil.push(...profile.nounu);
      if (profile?.parent && profile.parent.length > 0) profil.push(...profile.parent);

      return {
        user: {
          id: user.id,
          email: user.email,
          slug: user.slug,
          access_token: newToken,
          refresh_token: newRefreshToken,
          role: profile?.role
            ? { id: profile.role.id, slug: DB_TO_NORMALIZED_ROLE[profile.role.slug] || profile.role.slug, name: profile.role.name }
            : undefined,
          type_profil: profile?.typeProfil
            ? { id: profile.typeProfil.id, slug: DB_TO_NORMALIZED_TYPE_PROFIL[profile.typeProfil.slug] || profile.typeProfil.slug, name: profile.typeProfil.name, description: profile.typeProfil.name }
            : undefined,
          profil,
        },
      };
    } catch {
      throw new UnauthorizedException('Token de rafraichissement invalide ou expire');
    }
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.userRepo.update(userId, { accessToken: null as any, refreshToken: null as any });
  }
}

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      return { message: 'Si cet email existe, un code de réinitialisation a été envoyé.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        token: code,
        userId: user.id,
        expiresAt,
      },
    });

    await this.mailService.sendPasswordResetCode(user.email, code);

    return { message: 'Si cet email existe, un code de réinitialisation a été envoyé.' };
  }
}

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Code invalide ou expiré');
    }

    const user = await this.userRepo.findById(resetToken.userId);
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}
