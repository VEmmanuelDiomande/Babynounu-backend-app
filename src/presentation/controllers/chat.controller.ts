import { Body, Controller, Get, Post, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  GetConversationsUseCase,
  GetRoomUseCase,
  GetMessagesUseCase,
  SendMessageUseCase,
  FindOrCreateRoomUseCase,
  MarkAsReadUseCase,
  GetUnreadCountUseCase,
} from '../../application/chat/chat.usecases';
import { SendMessageDto, CreateRoomDto } from '../dtos/chat.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ParentRestrictionGuard } from '../guards/parent-restriction.guard';
import { NounuRestrictionGuard } from '../guards/nounu-restriction.guard';
import { ChatGateway } from '../gateways/chat.gateway';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard, ParentRestrictionGuard, NounuRestrictionGuard)
export class ChatController {
  constructor(
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getRoomUseCase: GetRoomUseCase,
    private readonly getMessagesUseCase: GetMessagesUseCase,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly findOrCreateRoomUseCase: FindOrCreateRoomUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly getUnreadCountUseCase: GetUnreadCountUseCase,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  async getConversations(@Req() req: any) {
    return this.getConversationsUseCase.execute(req.user.sub);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  async getUnreadCount(@Req() req: any) {
    return this.getUnreadCountUseCase.execute(req.user.sub);
  }

  @Get('rooms/:id')
  @UseGuards(JwtAuthGuard)
  async getRoom(@Param('id') id: string) {
    return this.getRoomUseCase.execute(parseInt(id));
  }

  @Get('rooms/:id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Param('id') id: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.getMessagesUseCase.execute(parseInt(id), page || 1, limit || 50);
  }

  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  async createRoom(@Req() req: any, @Body() dto: CreateRoomDto) {
    return this.findOrCreateRoomUseCase.execute({
      senderId: req.user.sub,
      receiverId: dto.receiverId,
      nounuId: dto.nounuId,
      parentId: dto.parentId,
    });
  }

  @Post('rooms/:id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Param('id') id: string, @Req() req: any, @Body() dto: SendMessageDto) {
    const result = await this.sendMessageUseCase.execute({
      roomId: parseInt(id),
      senderId: req.user.sub,
      ...dto,
    });
    const message = result.message || result;
    const receiverId = result.receiverId;
    const notification = result.notification;
    this.chatGateway.notifyNewMessage(parseInt(id), message, req.user.sub, receiverId).catch(() => {});
    if (receiverId && notification) {
      this.chatGateway.notifyNewNotification(receiverId, notification).catch(() => {});
    }
    return message;
  }

  @Post('rooms/:id/messages/file')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        content: { type: 'string', description: 'Optional caption' },
      },
    },
  })
  async sendMessageWithFile(@Param('id') id: string, @Req() req: any, @UploadedFile() file: any) {
    const attachmentUrl = `/uploads/chat/${file.filename}`;
    const attachmentName = file.originalname;
    const attachmentType = file.mimetype;
    const content = req.body?.content || '';
    const result = await this.sendMessageUseCase.execute({
      roomId: parseInt(id),
      senderId: req.user.sub,
      content,
      attachmentUrl,
      attachmentName,
      attachmentType,
    });
    const message = result.message || result;
    const receiverId = result.receiverId;
    const notification = result.notification;
    this.chatGateway.notifyNewMessage(parseInt(id), message, req.user.sub, receiverId).catch(() => {});
    if (receiverId && notification) {
      this.chatGateway.notifyNewNotification(receiverId, notification).catch(() => {});
    }
    return message;
  }

  @Post('rooms/:id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const result = await this.markAsReadUseCase.execute(parseInt(id), req.user.sub);
    this.chatGateway.notifyCountsAfterRead(parseInt(id), req.user.sub).catch(() => {});
    return result;
  }
}
