import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Infrastructure
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { RepositoriesModule } from './infrastructure/repositories/repositories.module';

// Presentation
import { AuthPresentationModule } from './presentation/controllers/auth.presentation.module';
import { ProfilePresentationModule } from './presentation/controllers/profile.presentation.module';
import { NounuPresentationModule } from './presentation/controllers/nounu.presentation.module';
import { ParentPresentationModule } from './presentation/controllers/parent.presentation.module';
import { ParameterPresentationModule } from './presentation/controllers/parameter.presentation.module';
import { JobPresentationModule } from './presentation/controllers/job.presentation.module';
import { ChatPresentationModule } from './presentation/controllers/chat.presentation.module';
import { NotificationPresentationModule } from './presentation/controllers/notification.presentation.module';
import { PaymentPresentationModule } from './presentation/controllers/payment.presentation.module';
import { MediaPresentationModule } from './presentation/controllers/media.presentation.module';
import { AdminPresentationModule } from './presentation/controllers/admin.presentation.module';
import { ContractPresentationModule } from './presentation/controllers/contract.presentation.module';
import { ReviewPresentationModule } from './presentation/controllers/review.presentation.module';
import { LikePresentationModule } from './presentation/controllers/like.presentation.module';
import { GatewayModule } from './presentation/gateways/gateway.module';
import { PushNotificationPresentationModule } from './presentation/controllers/push-notification.presentation.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RepositoriesModule,

    ThrottlerModule.forRoot([
      // {
      //   name: 'default',
      //   ttl: 600000,
      //   limit: 300,
      // },
      // {
      //   name: 'auth',
      //   ttl: 60000,
      //   limit: 5,
      // },
    ]),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    AuthPresentationModule,
    ProfilePresentationModule,
    NounuPresentationModule,
    ParentPresentationModule,
    ParameterPresentationModule,
    JobPresentationModule,
    ChatPresentationModule,
    NotificationPresentationModule,
    PaymentPresentationModule,
    MediaPresentationModule,
    AdminPresentationModule,
    ContractPresentationModule,
    ReviewPresentationModule,
    LikePresentationModule,
    GatewayModule,
    PushNotificationPresentationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
