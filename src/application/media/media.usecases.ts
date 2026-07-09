import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaMediaRepository } from '../../infrastructure/repositories/payment-media-admin.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class GetMyMediaUseCase {
  constructor(private readonly mediaRepo: PrismaMediaRepository) {}

  async execute(userId: string) {
    return this.mediaRepo.findByUser(userId);
  }
}

@Injectable()
export class UploadMediaUseCase {
  constructor(
    private readonly mediaRepo: PrismaMediaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(userId: string, file: any, typeMediaSlug?: string) {
    const path = `/uploads/${file.filename}`;

    let typeMediaId: number | undefined;
    if (typeMediaSlug) {
      const typeParam = await this.prisma.parameter.findFirst({
        where: { slug: typeMediaSlug, deletedAt: null },
      });
      if (typeParam) {
        typeMediaId = typeParam.id;
      }
    }

    // For profile photo, banner or ID photo, soft-delete ALL existing ones of the same type
    if (typeMediaId && (typeMediaSlug === 'photo_profil' || typeMediaSlug === 'photo_banniere' || typeMediaSlug === 'photo_identite')) {
      await this.prisma.media.updateMany({
        where: { userId, typeMediaId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
    }

    return this.mediaRepo.create({
      userId,
      originalName: file.originalname,
      filename: file.filename,
      path,
      originalUrl: path,
      typeMediaId,
    });
  }
}

@Injectable()
export class DeleteMediaUseCase {
  constructor(private readonly mediaRepo: PrismaMediaRepository) {}

  async execute(id: string) {
    const media = await this.mediaRepo.findById(id);
    if (!media) throw new NotFoundException('Media introuvable');
    return this.mediaRepo.delete(id);
  }
}
