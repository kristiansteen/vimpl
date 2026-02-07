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

    async sendInviteEmail(to: string, _boardTitle: string, boardUrl: string, recipientName: string = '', boardOwner: string = ''): Promise<boolean> {
        const subject = `You've been invited to collaborate on a vimpl board`;
        const name = recipientName || 'there';
        const owner = boardOwner || 'Someone';

        const text = `Hi ${name},

${owner} has invited you to collaborate on their vimpl board – where simple project leadership meets real progress.

No complicated processes or jargon. Just a clear, hands-on way to work together and get things done.

Join the board: ${boardUrl}

Jump in, see what's happening, and help make it happen. Keep your eyes on the ball and create real momentum together.

Need help or have questions? We're here: help@vimpl.com

Let's make it happen!

Best regards,
The vimpl team`;

        const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: #fafafa; border-radius: 12px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">You've been invited!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;"><strong>${owner}</strong> has invited you to collaborate on their vimpl board – where simple project leadership meets real progress.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">No complicated processes or jargon. Just a clear, hands-on way to work together and get things done.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${boardUrl}" style="background-color: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Join the Board</a>
        </div>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Jump in, see what's happening, and help make it happen. Keep your eyes on the ball and create real momentum together.</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Need help or have questions? We're here: <a href="mailto:help@vimpl.com" style="color: #4f46e5;">help@vimpl.com</a></p>
        <p style="font-size: 18px; line-height: 1.6; color: #4f46e5; font-weight: bold; margin-top: 30px;">Let's make it happen!</p>
        <p style="font-size: 16px; line-height: 1.6; color: #333;">Best regards,<br><strong>The vimpl team</strong></p>
        <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #888;">Sent from <a href="https://vimpl.com" style="color: #4f46e5;">vimpl.com</a>. If you weren't expecting this, you can safely ignore this email.</p>
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
