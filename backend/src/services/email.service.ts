import { Resend } from 'resend';
import path from 'path';
import fs from 'fs';
import config from '../config';
import logger from '../utils/logger';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

async function sendEmail(to: string, subject: string, html: string, attachments?: any[]): Promise<boolean> {
    if (!resend) {
        logger.info(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        return true;
    }

    try {
        const { error } = await resend.emails.send({
            from: 'Ailean from Vimpl <ailean@onboard.vimpl.com>',
            to,
            subject,
            html,
            attachments: attachments as any,
        });

        if (error) {
            logger.error('Resend email failed:', error);
            return false;
        }

        logger.info(`Email sent to ${to}`);
        return true;
    } catch (err) {
        logger.error('Failed to send email:', err);
        return false;
    }
}

export async function sendLeadWelcomeEmail(to: string, name: string, documentFilenames: string[]): Promise<boolean> {
    const attachments = documentFilenames
        .map(filename => {
            const filePath = path.join(__dirname, '../../../frontend/assets/documents', filename);
            if (!fs.existsSync(filePath)) {
                logger.error(`Attachment not found: ${filePath}`);
                return null;
            }
            return { filename, content: fs.readFileSync(filePath) };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null);

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
            <div style="margin: 40px 0; text-align: center;">
                <a href="https://vimpl.com" style="background-color: #3d7a1f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Learn more at vimpl.com</a>
            </div>
            <p style="font-size: 16px; line-height: 1.6; color: #222;">
                Best regards,<br>
                <strong>Kristian Steen</strong><br>
                <span style="color: #666; font-size: 14px;">Founder, vimpl.com / AILEAN</span>
            </p>
        </div>
    `;

    return sendEmail(to, 'Welcome to AILEAN - Your requested downloads', html, attachments);
}

export async function sendInviteEmail(to: string, boardUrl: string, recipientName = '', boardOwner = ''): Promise<boolean> {
    const name = recipientName || 'there';
    const owner = boardOwner || 'Someone';

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

    return sendEmail(to, `You've been invited to collaborate on a vimpl board`, html);
}

const ONBOARDING_SUBJECTS: Record<number, string> = {
  0: 'Welcome to vimpl — here\'s how to get started',
  1: 'Day 1: Your first steps in vimpl',
  2: 'Day 2: Getting more out of vimpl',
  3: 'Day 3: Tips & tricks for vimpl',
  5: 'Day 5: How is vimpl working for you?',
  7: 'Day 7: Make vimpl part of your workflow',
};

export async function sendOnboardingEmail(to: string, name: string, day: number): Promise<boolean> {
  const greeting = name || 'there';
  const subject = ONBOARDING_SUBJECTS[day] ?? `vimpl onboarding — Day ${day}`;

  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eaeaea;border-radius:12px;">
      <img src="https://frontend-puce-ten-18.vercel.app/assets/images/vimpl.png" alt="vimpl" height="48" style="margin-bottom:24px">
      <h2 style="color:#111;margin-bottom:16px">Hi ${greeting},</h2>
      <p style="font-size:16px;line-height:1.6;color:#444">
        This is your Day ${day} message from vimpl. We hope you're getting value from the platform.
      </p>
      <div style="margin:32px 0;text-align:center">
        <a href="https://app.vimpl.com" style="background:#4f46e5;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">
          Open vimpl
        </a>
      </div>
      <p style="font-size:16px;line-height:1.6;color:#222">
        Best,<br><strong>Kristian from vimpl</strong>
      </p>
      <p style="font-size:12px;color:#999;margin-top:24px">
        You received this because you signed up at vimpl.com.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
}

