import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatApplicationModule } from '../../application/chat/chat.application.module';
import { GatewayModule } from '../gateways/gateway.module';
import { JwtModule } from '@nestjs/jwt';
import { ParentRestrictionGuard } from '../guards/parent-restriction.guard';
import { NounuRestrictionGuard } from '../guards/nounu-restriction.guard';

@Module({
  imports: [
    ChatApplicationModule,
    GatewayModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [ChatController],
  providers: [ParentRestrictionGuard, NounuRestrictionGuard],
})
export class ChatPresentationModule {}
