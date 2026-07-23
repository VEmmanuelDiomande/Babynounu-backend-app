import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
      });
    }
  }

  async sendPasswordResetCode(toEmail: string, code: string): Promise<void> {
    const from = process.env.SMTP_FROM || 'no-reply@babynounu.com';
    const appName = 'BabyNounu';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #f43f5e;">${appName}</h2>
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Utilisez le code ci-dessous pour définir un nouveau mot de passe :</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #f43f5e; background: #fff1f2; padding: 16px 32px; border-radius: 12px; display: inline-block;">
            ${code}
          </span>
        </div>
        <p style="color: #999; font-size: 12px;">Ce code expire dans 10 minutes. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">© 2026 ${appName}. Tous droits réservés.</p>
      </div>
    `;

    if (this.transporter) {
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: `${appName} — Code de réinitialisation`,
        html,
      });
    } else {
      console.log(`[MailService] SMTP not configured — reset code for ${toEmail}: ${code}`);
    }
  }
}
