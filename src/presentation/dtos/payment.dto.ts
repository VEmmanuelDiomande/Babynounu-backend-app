import { IsString, IsNumber, IsOptional, IsEmail } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  paymentType?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerSurname?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhoneNumber?: string;

  @IsNumber()
  @IsOptional()
  packId?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  returnUrl?: string;
}

export class ConfirmPaymentDto {
  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}

export class VerifyPaymentDto {
  @IsString()
  transactionId: string;
}

export class SubscribeDto {
  @IsString()
  paymentId: string;

  @IsNumber()
  @IsOptional()
  typeId?: number;

  @IsNumber()
  @IsOptional()
  packId?: number;

  @IsNumber()
  @IsOptional()
  durationDays?: number;
}
