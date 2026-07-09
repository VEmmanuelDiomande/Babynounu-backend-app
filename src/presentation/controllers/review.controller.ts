import { Body, Controller, Get, Post, Param, Query, UseGuards, Req, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PushNotificationService } from '../../infrastructure/services/push-notification.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifRepo: PrismaNotificationRepository,
    @Inject(PushNotificationService) private readonly pushService: PushNotificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() body: { nounuId: string; rating: number; comment?: string; contractId?: number }) {
    const reviewerId = req.user.sub;

    if (!body.nounuId) throw new BadRequestException('L\'ID de la nounu est requis');
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      throw new BadRequestException('La note doit être comprise entre 1 et 5');
    }

    const nounu = await this.prisma.profilNounu.findUnique({ where: { id: body.nounuId } });
    if (!nounu) throw new NotFoundException('Nounu introuvable');

    if (body.contractId) {
      const existing = await this.prisma.review.findUnique({
        where: { reviewerId_contractId: { reviewerId, contractId: body.contractId } },
      });
      if (existing) throw new BadRequestException('Vous avez déjà noté cette prestation');
    }

    const review = await this.prisma.review.create({
      data: {
        reviewerId,
        nounuId: body.nounuId,
        rating: body.rating,
        comment: body.comment || null,
        contractId: body.contractId || null,
      },
      include: {
        reviewer: { select: { id: true, slug: true } },
      },
    });

    const agg = await this.prisma.review.aggregate({
      where: { nounuId: body.nounuId, deletedAt: null },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.profilNounu.update({
      where: { id: body.nounuId },
      data: { points: agg._avg.rating || 0 },
    });

    if (nounu.userId) {
      const ratingLabel = body.rating === 5 ? 'Excellent' : body.rating >= 4 ? 'Très bien' : body.rating >= 3 ? 'Correct' : body.rating >= 2 ? 'Décevant' : 'Très décevant';
      await this.notifRepo.create({
        type: 'REVIEW',
        title: 'Nouvelle évaluation',
        message: `Vous avez reçu une note de ${body.rating}/5 (${ratingLabel})${body.comment ? ` : "${body.comment.substring(0, 60)}${body.comment.length > 60 ? '...' : ''}"` : ''}. Votre moyenne est maintenant de ${(agg._avg.rating || 0).toFixed(1)}/5.`,
        userId: nounu.userId,
        senderId: reviewerId,
        tolinkId: String(review.id),
      });

      this.pushService.sendToUser(nounu.userId, {
        title: 'Nouvelle évaluation',
        body: `Vous avez reçu une note de ${body.rating}/5. Votre moyenne est de ${(agg._avg.rating || 0).toFixed(1)}/5.`,
        data: {
          type: 'notification',
          notificationType: 'REVIEW',
          tolinkId: String(review.id),
          screen: 'NOTIFICATIONS',
        },
      }).catch(() => {});
    }

    return { ...review, averageRating: agg._avg.rating, totalReviews: agg._count.rating };
  }

  @Get('nounu/:nounuId')
  async getNounuReviews(@Param('nounuId') nounuId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = { nounuId, deletedAt: null };

    const [data, total, agg] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: {
              id: true,
              slug: true,
              parents: { select: { fullname: true } },
              medias: { where: { deletedAt: null }, select: { originalUrl: true, path: true, filename: true, typeMedia: { select: { slug: true } } } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({
        where,
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
      },
      averageRating: agg._avg.rating || 0,
      totalReviews: agg._count.rating,
    };
  }

  @Get('check/:contractId')
  @UseGuards(JwtAuthGuard)
  async checkReview(@Req() req: any, @Param('contractId') contractId: string) {
    const review = await this.prisma.review.findUnique({
      where: { reviewerId_contractId: { reviewerId: req.user.sub, contractId: parseInt(contractId) } },
    });
    return { hasReviewed: !!review, review };
  }
}
