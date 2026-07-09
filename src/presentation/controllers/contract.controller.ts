import { Body, Controller, Get, Post, Patch, Delete, Param, Query, UseGuards, Req, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PrismaNotificationRepository } from '../../infrastructure/repositories/job-chat-notification.repository';
import { PushNotificationService } from '../../infrastructure/services/push-notification.service';

@ApiTags('Contracts')
@Controller('contracts')
export class ContractController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifRepo: PrismaNotificationRepository,
    @Inject(PushNotificationService) private readonly pushService: PushNotificationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any, @Query() query: any) {
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [{ senderId: req.user.sub }, { receiverId: req.user.sub }],
      },
      include: {
        contracts: {
          include: {
            room: {
              include: {
                nounu: { include: { user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } } } },
                parent: { include: { user: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } } } },
                sender: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
                receiver: { include: { medias: { where: { deletedAt: null }, include: { typeMedia: true } } } },
              },
            },
            message: true,
          },
        },
      },
    });
    return rooms.flatMap((r) => r.contracts);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.prisma.contract.findUnique({
      where: { id: parseInt(id) },
      include: { room: true, message: true },
    });
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any) {
    return this.prisma.contract.create({
      data: {
        roomId: body.roomId,
        messageId: body.messageId,
        status: body.status || 'Pending',
      },
      include: { room: true, message: true },
    });
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() body: any) {
    const contract = await this.prisma.contract.update({
      where: { id: parseInt(id) },
      data: { status: body.status },
      include: { room: { include: { nounu: true, parent: true, sender: true, receiver: true } }, message: true },
    });

    if (body.status === 'Completed' && contract.room) {
      const room = contract.room;
      const nounu = room.nounu;
      const parent = room.parent;
      const parentUserId = parent?.userId || (room.senderId === nounu?.userId ? room.receiverId : room.senderId);

      if (parentUserId) {
        await this.notifRepo.create({
          type: 'CONTRACT_COMPLETED',
          title: 'Prestation terminée',
          message: `Votre prestation avec ${nounu?.fullname || 'la nounu'} est terminée. N'hésitez pas à la noter.`,
          userId: parentUserId,
          tolinkId: String(contract.id),
        });

        this.pushService.sendToUser(parentUserId, {
          title: 'Prestation terminée',
          body: `Votre prestation avec ${nounu?.fullname || 'la nounu'} est terminée. N'hésitez pas à la noter.`,
          data: {
            type: 'notification',
            notificationType: 'CONTRACT_COMPLETED',
            tolinkId: String(contract.id),
            screen: 'PRESTATIONS',
          },
        }).catch(() => {});
      }
    }

    return contract;
  }

  @Delete('delete/:id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.prisma.contract.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Req() req: any, @Query('q') q?: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        OR: [{ senderId: req.user.sub }, { receiverId: req.user.sub }],
      },
      include: {
        contracts: { include: { room: true, message: true } },
      },
    });
    return rooms.flatMap((r) => r.contracts);
  }
}
