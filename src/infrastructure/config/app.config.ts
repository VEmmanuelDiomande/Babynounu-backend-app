import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private readonly configService: ConfigService) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isProd(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET', '');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '365d');
  }

  get corsOrigins(): string[] {
    return (this.configService.get<string>('CORS_ORIGINS') || 'http://localhost:5173,http://localhost:8100')
      .split(',')
      .map((o) => o.trim());
  }

  get hostUrl(): string {
    return this.isProd
      ? this.configService.get<string>('HOST_URL', 'https://baby.djoumaf.net')
      : this.configService.get<string>('HOST_URL_LOCAL', 'http://localhost');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  get cinetpayApiKey(): string {
    return this.configService.get<string>('CINETPAY_API_KEY', '');
  }

  get cinetpayApiPassword(): string {
    return this.configService.get<string>('CINETPAY_API_PASSWORD', '');
  }

  get cinetpayCountry(): string {
    return this.configService.get<string>('CINETPAY_COUNTRY', 'CI');
  }

  get cinetpayNotifyUrl(): string {
    return this.configService.get<string>('CINETPAY_NOTIFY_URL', '');
  }

  get cinetpayLang(): string {
    return this.configService.get<string>('CINETPAY_LANG', 'fr');
  }

  get geniuspayApiKey(): string {
    return this.configService.get<string>('GENIUSPAY_API_KEY', '');
  }

  get geniuspayApiSecret(): string {
    return this.configService.get<string>('GENIUSPAY_API_SECRET', '');
  }

  get geniuspayWalletId(): string {
    return this.configService.get<string>('GENIUSPAY_WALLET_ID', '');
  }

  get geniuspayNotifyUrl(): string {
    return this.configService.get<string>('GENIUSPAY_NOTIFY_URL', '');
  }

  get subscriptionDurationDays(): number {
    return this.configService.get<number>('SUBSCRIPTION_DURATION_DAYS', 30);
  }

  get adminId(): string {
    return this.configService.get<string>('USER_ADMIN_ID', 'admin-babynounu-01');
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL', '');
  }
}
