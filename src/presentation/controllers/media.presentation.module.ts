import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaApplicationModule } from '../../application/media/media.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MediaApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [MediaController],
})
export class MediaPresentationModule {}
