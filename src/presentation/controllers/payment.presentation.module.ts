import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentApplicationModule } from '../../application/payment/payment.application.module';
import { AdminApplicationModule } from '../../application/admin/admin.application.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PaymentApplicationModule,
    AdminApplicationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '365d') as any },
    }),
  ],
  controllers: [PaymentController],
})
export class PaymentPresentationModule {}
