import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        if (config.email.user && config.email.pass) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.port === 465, // true for 465, false for other ports
                auth: {
                    user: config.email.user,
                    pass: config.email.pass,
                },
            });
        } else {
            logger.warn('Email service: SMTP credentials not provided. Emails will be logged only.');
        }
    }

    async sendInviteEmail(to: string, boardTitle: string, boardUrl: string): Promise<boolean> {
        const subject = `You've been invited to collab on ${boardTitle}`;
        const text = `Hi,

You have been invited to collaborate on the planning board "${boardTitle}".

You can access the board here: ${boardUrl}

Happy planning!
The Vimpl Team`;

        const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4f46e5;">You've been invited!</h2>
        <p>Hi,</p>
        <p>You have been invited to collaborate on the planning board <strong>"${boardTitle}"</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${boardUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Board</a>
        </div>
        <p>Happy planning!<br>The Vimpl Team</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">This invite was sent from <a href="https://vimpl.com">vimpl.com</a>. If you weren't expecting this, you can safely ignore this email.</p>
      </div>
    `;

        return this.sendEmail(to, subject, text, html);
    }

    private async sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
        if (!this.transporter) {
            logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            logger.info(`[MOCK EMAIL] Content: ${text}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: `"Vimpl" <${config.email.from}>`,
                to,
                subject,
                text,
                html,
            });
            logger.info(`Email sent successfully to ${to}`);
            return true;
        } catch (error) {
            logger.error(`Failed to send email to ${to}:`, error);
            return false;
        }
    }
}

export default new EmailService();
