import { Module } from '@nestjs/common';
import { GetMyMediaUseCase, UploadMediaUseCase, DeleteMediaUseCase } from './media.usecases';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { PrismaMediaRepository } from '../../infrastructure/repositories/payment-media-admin.repository';

@Module({
  imports: [PrismaModule],
  providers: [PrismaMediaRepository, GetMyMediaUseCase, UploadMediaUseCase, DeleteMediaUseCase],
  exports: [GetMyMediaUseCase, UploadMediaUseCase, DeleteMediaUseCase],
})
export class MediaApplicationModule {}
