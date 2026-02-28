import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import config from '../config';
import logger from '../utils/logger';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private resend: Resend | null = null;

    constructor() {
        if (config.email.user && config.email.pass) {
            this.transporter = nodemailer.createTransport({
                host: config.email.host,
                port: config.email.port,
                secure: config.email.port === 465,
                auth: {
                    user: config.email.user,
                    pass: config.email.pass,
                },
            });
        }

        if (config.resendApiKey) {
            this.resend = new Resend(config.resendApiKey);
        } else {
            logger.warn('Email service: Resend API key not provided. Lead magnet emails will be logged only.');
        }
    }

    async sendLeadWelcomeEmail(to: string, name: string, documentFilenames: string[]): Promise<boolean> {
        const subject = `Welcome to AILEAN - Your requested downloads`;

        // Prepare attachments
        const attachments = documentFilenames.map(filename => {
            const filePath = path.join(__dirname, '../../../frontend/assets/documents', filename);
            if (fs.existsSync(filePath)) {
                return {
                    filename,
                    content: fs.readFileSync(filePath),
                };
            }
            logger.error(`Attachment not found: ${filePath}`);
            return null;
        }).filter(Boolean);

        const html = `
            <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fff; border: 1px solid #eaeaea; border-radius: 12px;">
                <h1 style="color: #3d7a1f; margin-bottom: 24px;">Hi ${name},</h1>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">
                    Thank you for your interest in <strong>AILEAN</strong>. We are excited to share our insights with you.
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">
                    As requested, we have attached the following document(s) to this email:
                </p>
                <ul style="font-size: 16px; color: #444; margin-bottom: 24px;">
                    ${documentFilenames.map(f => `<li>${f}</li>`).join('')}
                </ul>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">
                    At AILEAN, we believe in simple project leadership. We help you cut through complexity and focus on what matters most: real momentum.
                </p>
                <div style="margin: 40px 0; text-align: center;">
                    <a href="https://vimpl.com" style="background-color: #3d7a1f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Learn more at vimpl.com</a>
                </div>
                <p style="font-size: 16px; line-height: 1.6; color: #444;">
                    Let's make it happen!
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #222;">
                    Best regards,<br>
                    <strong>Kristian Steen</strong><br>
                    <span style="color: #666; font-size: 14px;">Founder, vimpl.com / AILEAN</span>
                </p>
            </div>
        `;

        if (!this.resend) {
            logger.info(`[MOCK RESEND] To: ${to} | Attachments: ${documentFilenames.join(', ')}`);
            return true;
        }

        try {
            const { error } = await this.resend.emails.send({
                from: 'AILEAN <hello@vimpl.com>',
                to,
                subject,
                html,
                attachments: attachments as any,
            });

            if (error) {
                logger.error('Resend email failed:', error);
                return false;
            }

            logger.info(`Lead welcome email sent to ${to} via Resend`);
            return true;
        } catch (err) {
            logger.error('Failed to send Resend email:', err);
            return false;
        }
    }

    async sendInviteEmail(to: string, _boardTitle: string, boardUrl: string, recipientName: string = '', boardOwner: string = ''): Promise<boolean> {
        const subject = `You've been invited to collaborate on a vimpl board`;
        const name = recipientName || 'there';
        const owner = boardOwner || 'Someone';

        const text = `Hi ${name},\n\n${owner} has invited you to collaborate on their vimpl board – where simple project leadership meets real progress.\n\nJoin the board: ${boardUrl}\n\nLet's make it happen!\n\nBest regards,\nThe vimpl team`;

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fafafa; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">You've been invited!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>${owner}</strong> has invited you to collaborate on their vimpl board.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${boardUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join the Board</a>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Best regards,<br><strong>The vimpl team</strong></p>
      </div>
    `;

        return this.sendEmail(to, subject, text, html);
    }

    async sendWelcomeEmail(to: string, recipientName: string = ''): Promise<boolean> {
        const subject = `Let's make it happen – Simple project leadership that works`;
        const name = recipientName || 'there';
        const text = `Hi ${name},\n\nAt vimpl.com, we focus on simple project leadership.\n\nLet's make it happen!\n\nBest regards,\nKristian Steen`;

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fafafa; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Let's make it happen!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">At vimpl.com, we focus on simple project leadership.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Best regards,<br><strong>Kristian Steen</strong></p>
      </div>
    `;

        return this.sendEmail(to, subject, text, html);
    }

    private async sendEmail(to: string, subject: string, text: string, html: string): Promise<boolean> {
        if (!this.transporter) {
            logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: `"Kristian Steen" <${config.email.from}>`,
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
