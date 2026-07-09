import { Body, Controller, Get, Post, Put, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  GetPaymentsUseCase,
  GetMyPaymentsUseCase,
  InitiatePaymentUseCase,
  ConfirmPaymentUseCase,
  VerifyPaymentUseCase,
  HandleNotifyUseCase,
  GetSubscriptionsUseCase,
  GetSubscriptionByIdUseCase,
  GetMySubscriptionUseCase,
  SubscribeUseCase,
} from '../../application/payment/payment.usecases';
import { GetActivePacksUseCase } from '../../application/admin/admin.usecases';
import { InitiatePaymentDto, ConfirmPaymentDto, SubscribeDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Payment & Subscription')
@Controller()
export class PaymentController {
  constructor(
    private readonly getPaymentsUseCase: GetPaymentsUseCase,
    private readonly getMyPaymentsUseCase: GetMyPaymentsUseCase,
    private readonly initiatePaymentUseCase: InitiatePaymentUseCase,
    private readonly confirmPaymentUseCase: ConfirmPaymentUseCase,
    private readonly verifyPaymentUseCase: VerifyPaymentUseCase,
    private readonly handleNotifyUseCase: HandleNotifyUseCase,
    private readonly getSubscriptionsUseCase: GetSubscriptionsUseCase,
    private readonly getSubscriptionByIdUseCase: GetSubscriptionByIdUseCase,
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
    private readonly subscribeUseCase: SubscribeUseCase,
    private readonly getActivePacksUseCase: GetActivePacksUseCase,
  ) {}

  // === PAYMENTS ===

  @Get('payments')
  @UseGuards(JwtAuthGuard)
  async getPayments(@Query() query: any) {
    return this.getPaymentsUseCase.execute(query.page, query.limit);
  }

  @Get('payments/me')
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@Req() req: any) {
    return this.getMyPaymentsUseCase.execute(req.user.sub);
  }

  @Post('payments/initiate')
  @UseGuards(JwtAuthGuard)
  async initiatePayment(@Req() req: any, @Body() dto: InitiatePaymentDto) {
    return this.initiatePaymentUseCase.execute(req.user.sub, dto);
  }

  @Post('payments/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(@Param('id') id: string, @Body() dto: ConfirmPaymentDto) {
    return this.confirmPaymentUseCase.execute(id, dto.status, dto.transactionId);
  }

  @Post('payments/verify')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Body() body: { transactionId: string }) {
    return this.verifyPaymentUseCase.execute(body.transactionId);
  }

  @Get('payments/status/:transactionId')
  async getPaymentStatus(@Param('transactionId') transactionId: string) {
    return this.verifyPaymentUseCase.execute(transactionId);
  }

  @Post('payments/notify')
  async handleNotify(@Body() body: any) {
    return this.handleNotifyUseCase.execute(body);
  }

  // === SUBSCRIPTIONS ===

  @Get('subscriptions')
  async getSubscriptions() {
    return this.getSubscriptionsUseCase.execute();
  }

  @Get('packs/active')
  async getActivePacks() {
    return this.getActivePacksUseCase.execute();
  }

  @Get('subscriptions/me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@Req() req: any) {
    return this.getMySubscriptionUseCase.execute(req.user.sub);
  }

  @Get('subscriptions/:id')
  async getSubscriptionById(@Param('id') id: string) {
    return this.getSubscriptionByIdUseCase.execute(id);
  }

  @Post('subscriptions/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribe(@Req() req: any, @Body() dto: SubscribeDto) {
    return this.subscribeUseCase.execute(req.user.sub, dto);
  }
}
