import { Body, Controller, Get, Post, Param, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Likes')
@Controller('likes')
export class LikeController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  async toggle(@Req() req: any, @Body() body: { nounuId: string }) {
    const userId = req.user.sub;

    if (!body.nounuId) throw new BadRequestException('L\'ID de la nounu est requis');

    const nounu = await this.prisma.profilNounu.findUnique({ where: { id: body.nounuId } });
    if (!nounu) throw new NotFoundException('Nounu introuvable');

    const existing = await this.prisma.nounuLike.findUnique({
      where: { userId_nounuId: { userId, nounuId: body.nounuId } },
    });

    if (existing) {
      await this.prisma.nounuLike.delete({ where: { id: existing.id } });
      const likeCount = await this.prisma.nounuLike.count({ where: { nounuId: body.nounuId } });
      return { liked: false, likeCount };
    }

    await this.prisma.nounuLike.create({
      data: { userId, nounuId: body.nounuId },
    });
    const likeCount = await this.prisma.nounuLike.count({ where: { nounuId: body.nounuId } });
    return { liked: true, likeCount };
  }

  @Get('nounu/:nounuId')
  async getNounuLikes(@Param('nounuId') nounuId: string) {
    const likeCount = await this.prisma.nounuLike.count({ where: { nounuId } });
    return { likeCount };
  }

  @Get('nounu/:nounuId/me')
  @UseGuards(JwtAuthGuard)
  async checkMyLike(@Req() req: any, @Param('nounuId') nounuId: string) {
    const existing = await this.prisma.nounuLike.findUnique({
      where: { userId_nounuId: { userId: req.user.sub, nounuId } },
    });
    return { liked: !!existing };
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMyLikes(@Req() req: any) {
    const likes = await this.prisma.nounuLike.findMany({
      where: { userId: req.user.sub },
      include: {
        nounu: {
          include: {
            user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
            preferences: {
              include: {
                adress: true,
                zoneDeTravail: true,
                horaireDisponible: true,
                trancheAgeEnfants: true,
                competanceSpecifique: true,
                langueParler: true,
                typeServices: true,
                frequenceDesServices: true,
                horaireSouhaites: true,
                gardeEnfants: true,
                aideMenagere: true,
                modeDePaiement: true,
                taches: true,
                equipementMenager: true,
                disponibilityPrestataire: true,
                zoneGeographiquePrestataire: true,
                criteresSelections: true,
                certificationsCriteres: true,
                besionsSpecifiques: true,
                criteresSpecifiques: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { data: likes };
  }

  @Post('batch-status')
  @UseGuards(JwtAuthGuard)
  async batchStatus(@Req() req: any, @Body() body: { nounuIds: string[] }) {
    if (!body.nounuIds || !Array.isArray(body.nounuIds)) {
      throw new BadRequestException('nounuIds est requis');
    }

    const likes = await this.prisma.nounuLike.findMany({
      where: { userId: req.user.sub, nounuId: { in: body.nounuIds } },
      select: { nounuId: true },
    });

    const likedIds = new Set(likes.map((l) => l.nounuId));

    const counts = await this.prisma.nounuLike.groupBy({
      by: ['nounuId'],
      where: { nounuId: { in: body.nounuIds } },
      _count: { nounuId: true },
    });

    const countMap: Record<string, number> = {};
    counts.forEach((c) => { countMap[c.nounuId] = c._count.nounuId; });

    const result: Record<string, { liked: boolean; likeCount: number }> = {};
    for (const id of body.nounuIds) {
      result[id] = { liked: likedIds.has(id), likeCount: countMap[id] || 0 };
    }

    return { data: result };
  }
}
