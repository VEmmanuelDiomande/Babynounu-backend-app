import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { AppConfig } from '../config/app.config';
import { randomBytes } from 'crypto';

export interface GeniusPayInitiateParams {
  transactionId: string;
  amount: number;
  currency: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  returnUrl: string;
  errorUrl?: string;
  metadata?: Record<string, any>;
}

export interface GeniusPayPayoutParams {
  walletId: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  destinationType: 'mobile_money' | 'bank_transfer';
  provider: 'wave' | 'orange' | 'mtn' | 'moov' | 'flooz';
  account: string;
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface GeniusPayInitiateResponse {
  paymentUrl: string;
  reference: string;
  status: string;
  amount: number;
  currency: string;
}

export interface GeniusPayPayoutResponse {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  recipientPhone: string;
}

export interface GeniusPayVerifyResponse {
  status: 'completed' | 'failed' | 'pending' | string;
  reference: string;
  amount: number;
  currency: string;
  metadata: any;
}

@Injectable()
export class GeniusPayService {
  private readonly logger = new Logger(GeniusPayService.name);
  private readonly baseUrl = 'https://geniuspay.ci/api/v1/merchant';

  constructor(private readonly appConfig: AppConfig) {}

  private getHeaders(): Record<string, string> {
    const apiKey = this.appConfig.geniuspayApiKey;

    if (!apiKey) {
      throw new BadRequestException('GeniusPay non configuré. Contactez l\'administrateur.');
    }

    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  generateTransactionId(): string {
    const prefix = 'BN';
    const random = randomBytes(8).toString('hex').toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}${random}`;
  }

  async initiatePayment(params: GeniusPayInitiateParams): Promise<GeniusPayInitiateResponse> {
    try {
      const body: any = {
        amount: Math.round(params.amount),
        currency: params.currency === 'FCFA' ? 'XOF' : (params.currency || 'XOF'),
        description: params.description,
        success_url: params.returnUrl,
        error_url: params.errorUrl || params.returnUrl,
        metadata: params.metadata || {},
      };

      if (params.customerName) {
        body.customer = {
          ...body.customer,
          name: params.customerName,
        };
      }

      if (params.customerEmail) {
        body.customer = {
          ...body.customer,
          email: params.customerEmail,
        };
      }

      if (params.customerPhoneNumber) {
        body.customer = {
          ...body.customer,
          phone: params.customerPhoneNumber,
        };
      }

      const url = `${this.baseUrl}/payments`;
      this.logger.log(`GeniusPay initiate URL: ${url}`);
      this.logger.log(`GeniusPay initiate body: ${JSON.stringify(body)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      this.logger.log(`GeniusPay initiate response status: ${response.status}`);
      this.logger.log(`GeniusPay initiate response text: ${responseText.substring(0, 500)}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        this.logger.error(`GeniusPay initiate: invalid JSON response: ${responseText.substring(0, 200)}`);
        throw new BadRequestException(`Erreur GeniusPay: réponse invalide du serveur`);
      }

      if (!response.ok || !data.success) {
        this.logger.error(`GeniusPay initiate error: ${JSON.stringify(data)}`);
        throw new BadRequestException(`Erreur GeniusPay: ${data.message || data.error?.message || 'Erreur lors de la création du paiement'}`);
      }

      const paymentData = data.data;
      if (!paymentData.checkout_url && !paymentData.payment_url) {
        this.logger.error(`GeniusPay initiate: no checkout_url in response: ${JSON.stringify(data)}`);
        throw new BadRequestException('Erreur GeniusPay: aucune URL de paiement retournée');
      }

      return {
        paymentUrl: paymentData.checkout_url || paymentData.payment_url,
        reference: paymentData.reference,
        status: paymentData.status,
        amount: paymentData.amount,
        currency: paymentData.currency,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errMsg = (error as any)?.message || 'Unknown error';
      this.logger.error(`GeniusPay initiate error: ${errMsg}`);
      throw new BadRequestException(`Erreur lors de la communication avec GeniusPay: ${errMsg}`);
    }
  }

  async initiatePayout(params: GeniusPayPayoutParams): Promise<GeniusPayPayoutResponse> {
    try {
      const body: any = {
        wallet_id: params.walletId,
        recipient: {
          name: params.recipientName,
          phone: params.recipientPhone,
          email: params.recipientEmail,
        },
        destination: {
          type: params.destinationType,
          provider: params.provider,
          account: params.account,
        },
        amount: Math.round(params.amount),
        currency: params.currency === 'FCFA' ? 'XOF' : (params.currency || 'XOF'),
        description: params.description,
        metadata: params.metadata || {},
      };

      if (params.idempotencyKey) {
        body.idempotency_key = params.idempotencyKey;
      }

      const url = `${this.baseUrl}/payouts`;
      this.logger.log(`GeniusPay payout URL: ${url}`);
      this.logger.log(`GeniusPay payout body: ${JSON.stringify(body)}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const responseText = await response.text();
      this.logger.log(`GeniusPay payout response status: ${response.status}`);
      this.logger.log(`GeniusPay payout response text: ${responseText.substring(0, 500)}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        this.logger.error(`GeniusPay payout: invalid JSON response: ${responseText.substring(0, 200)}`);
        throw new BadRequestException(`Erreur GeniusPay: réponse invalide du serveur`);
      }

      if (!response.ok || !data.success) {
        this.logger.error(`GeniusPay payout error: ${JSON.stringify(data)}`);
        throw new BadRequestException(`Erreur GeniusPay: ${data.message || data.error?.message || 'Erreur lors du transfert'}`);
      }

      const payoutData = data.data.payout;
      return {
        reference: payoutData.reference,
        status: payoutData.status,
        amount: payoutData.amount,
        currency: payoutData.currency,
        recipientPhone: params.recipientPhone,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errMsg = (error as any)?.message || 'Unknown error';
      this.logger.error(`GeniusPay payout error: ${errMsg}`);
      throw new BadRequestException(`Erreur lors de la communication avec GeniusPay: ${errMsg}`);
    }
  }

  async verifyPayment(reference: string): Promise<GeniusPayVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${reference}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        this.logger.error(`GeniusPay verify error: ${JSON.stringify(data)}`);
        throw new BadRequestException(`Erreur GeniusPay: ${data.error?.message || data.message || 'Erreur lors de la vérification du paiement'}`);
      }

      const payment = data.data;
      if (!payment) {
        this.logger.warn(`GeniusPay verify: payment not found for reference ${reference}`);
        throw new BadRequestException('Paiement introuvable');
      }

      return {
        status: payment.status,
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency,
        metadata: payment,
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const errMsg = (error as any)?.message || 'Unknown error';
      this.logger.error(`GeniusPay verify error: ${errMsg}`);
      throw new BadRequestException('Erreur lors de la vérification du paiement.');
    }
  }
}
