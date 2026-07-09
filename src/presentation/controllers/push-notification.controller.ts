import { Body, Controller, Post, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RegisterDeviceTokenUseCase, UnregisterDeviceTokenUseCase } from '../../application/push-notification/push-notification.usecases';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Push Notifications')
@Controller('push')
export class PushNotificationController {
  constructor(
    private readonly registerTokenUseCase: RegisterDeviceTokenUseCase,
    private readonly unregisterTokenUseCase: UnregisterDeviceTokenUseCase,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  async registerToken(@Req() req: any, @Body() body: { token: string; platform?: string }) {
    await this.registerTokenUseCase.execute(req.user.sub, body.token, body.platform || 'android');
    return { success: true };
  }

  @Delete('unregister')
  @UseGuards(JwtAuthGuard)
  async unregisterToken(@Body() body: { token: string }) {
    await this.unregisterTokenUseCase.execute(body.token);
    return { success: true };
  }
}
