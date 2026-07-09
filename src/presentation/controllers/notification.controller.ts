import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  GetNotificationsUseCase,
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
  DeleteNotificationUseCase,
  GetUnreadNotificationsCountUseCase,
} from '../../application/notification/notification.usecases';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
    private readonly getUnreadNotificationsCountUseCase: GetUnreadNotificationsCountUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(@Req() req: any, @Query() query: any) {
    return this.getNotificationsUseCase.execute(req.user.sub, query.page, query.limit);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async unreadCount(@Req() req: any) {
    return this.getUnreadNotificationsCountUseCase.execute(req.user.sub);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Param('id') id: string) {
    return this.markNotificationReadUseCase.execute(parseInt(id));
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  async markAllRead(@Req() req: any) {
    return this.markAllNotificationsReadUseCase.execute(req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string) {
    return this.deleteNotificationUseCase.execute(parseInt(id));
  }
}
