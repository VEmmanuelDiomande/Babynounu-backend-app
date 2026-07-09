import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { CinetPayClient } from 'cinetpay-js';
import { randomBytes } from 'crypto';

export interface CinetPayInitiateParams {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName: string;
  customerSurname: string;
  customerEmail: string;
  customerPhoneNumber: string;
  returnUrl: string;
  notifyUrl: string;
  channels?: string;
}

export interface CinetPayInitiateResponse {
  paymentUrl: string;
  transactionId: string;
  paymentToken: string;
  notifyToken: string;
}

export interface CinetPayVerifyResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'INITIATED' | string;
  transactionId: string;
  merchantTransactionId: string;
  metadata: any;
}

@Injectable()
export class CinetPayService {
  private readonly logger = new Logger(CinetPayService.name);
  private client: CinetPayClient | null = null;

  constructor(private readonly appConfig: AppConfig) {}

  private getClient(): CinetPayClient {
    if (this.client) return this.client;

    const apiKey = this.appConfig.cinetpayApiKey;
    const apiPassword = this.appConfig.cinetpayApiPassword;
    const country = this.appConfig.cinetpayCountry;

    if (!apiKey || !apiPassword) {
      throw new BadRequestException('CinetPay non configuré. Contactez l\'administrateur.');
    }

    this.client = new CinetPayClient({
      credentials: {
        [country]: { apiKey, apiPassword },
      },
      debug: this.appConfig.nodeEnv !== 'production',
    });

    return this.client;
  }

  generateTransactionId(): string {
    const prefix = 'BN';
    const random = randomBytes(8).toString('hex').toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}${random}`;
  }

  async initiatePayment(params: CinetPayInitiateParams): Promise<CinetPayInitiateResponse> {
    const country = this.appConfig.cinetpayCountry;

    try {
      const client = this.getClient();

      const payment = await client.payment.initialize(
        {
          currency: (params.currency || 'XOF') as any,
          merchantTransactionId: params.transactionId,
          amount: Math.round(params.amount),
          lang: this.appConfig.cinetpayLang as 'fr' | 'en',
          designation: params.description,
          clientEmail: params.customerEmail || 'client@babynounu.com',
          clientFirstName: params.customerName || 'Client',
          clientLastName: params.customerSurname || 'BabyNounu',
          successUrl: params.returnUrl,
          failedUrl: params.returnUrl,
          notifyUrl: params.notifyUrl,
          channel: 'PUSH' as any,
          ...(params.customerPhoneNumber ? { clientPhoneNumber: params.customerPhoneNumber } : {}),
        },
        country,
      );

      if (!payment.paymentUrl) {
        this.logger.error(`CinetPay initiate: no paymentUrl in response: ${JSON.stringify(payment)}`);
        throw new BadRequestException('Erreur CinetPay: aucune URL de paiement retournée');
      }

      return {
        paymentUrl: payment.paymentUrl,
        transactionId: payment.merchantTransactionId || params.transactionId,
        paymentToken: payment.paymentToken,
        notifyToken: payment.notifyToken,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errMsg = (error as any)?.message || 'Unknown error';
      this.logger.error(`CinetPay initiate error: ${errMsg}`);
      throw new BadRequestException(`Erreur lors de la communication avec CinetPay: ${errMsg}`);
    }
  }

  async verifyPayment(transactionId: string): Promise<CinetPayVerifyResponse> {
    const country = this.appConfig.cinetpayCountry;

    try {
      const client = this.getClient();

      const status = await client.payment.getStatus(transactionId, country);

      return {
        status: status.status,
        transactionId: status.transactionId || transactionId,
        merchantTransactionId: status.merchantTransactionId || transactionId,
        metadata: status,
      };
    } catch (error) {
      const errMsg = (error as any)?.message || 'Unknown error';
      this.logger.error(`CinetPay verify error: ${errMsg}`);
      throw new BadRequestException('Erreur lors de la vérification du paiement.');
    }
  }
}
