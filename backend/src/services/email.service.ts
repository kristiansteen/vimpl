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

    async sendWelcomeEmail(to: string, recipientName: string = ''): Promise<boolean> {
        const subject = `Let's make it happen – Simple project leadership that works`;
        const name = recipientName || 'there';
        const text = `Hi ${name},

I wanted to reach out because I think you might appreciate a different approach to getting projects done.

At vimpl.com, we focus on simple project leadership – not complicated project management disciplines. We believe the best way forward is keeping your eyes on the ball, working hands-on with your team, and creating real momentum that everyone can feel.

No jargon. No over-engineered processes. Just practical, tactile leadership that helps teams make things happen and experience genuine progress along the way.

Whether you're technical or not, the goal is the same: getting results without getting lost in complexity.

If this sounds like the kind of support your projects need, I'd love to chat about how we can help.

Let's make it happen!

Best regards,
Kristian Steen`;

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fafafa; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">Let's make it happen!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">I wanted to reach out because I think you might appreciate a different approach to getting projects done.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">At <a href="https://vimpl.com" style="color: #4f46e5; text-decoration: none; font-weight: bold;">vimpl.com</a>, we focus on <strong>simple project leadership</strong> – not complicated project management disciplines. We believe the best way forward is keeping your eyes on the ball, working hands-on with your team, and creating real momentum that everyone can feel.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">No jargon. No over-engineered processes. Just practical, tactile leadership that helps teams make things happen and experience genuine progress along the way.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Whether you're technical or not, the goal is the same: <strong>getting results without getting lost in complexity.</strong></p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">If this sounds like the kind of support your projects need, I'd love to chat about how we can help.</p>
        <p style="font-size: 18px; line-height: 1.6; color: #4f46e5; font-weight: bold; margin-top: 30px;">Let's make it happen!</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Best regards,<br><strong>Kristian Steen</strong></p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #888;">Sent from <a href="https://vimpl.com" style="color: #4f46e5;">vimpl.com</a></p>
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
