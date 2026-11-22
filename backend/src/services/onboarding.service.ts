// Sends the onboarding emails: the welcome at sign-up and the drip after it.
import prisma from '../config/database';
import config from '../config';
import logger from '../utils/logger';
import { sendEmail } from './email.service';
import { onboardingEmail } from './onboarding.templates';
import { dueMilestone, langFor, productFor, unsubscribeToken, LAST_WINDOW_END, type Product } from './onboarding.policy';

const DAY_MS = 24 * 60 * 60 * 1000;

export function unsubscribeUrl(userId: string): string {
  const t = unsubscribeToken(userId, config.jwt.secret);
  return `${config.apiUrl}/api/v1/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${t}`;
}

async function readPrefs(userId: string): Promise<Record<string, unknown> | null> {
  const row = await prisma.userPreference.findUnique({ where: { userId } });
  return row?.data && typeof row.data === 'object' && !Array.isArray(row.data) ? (row.data as Record<string, unknown>) : null;
}

/** Remembers which product the user signed up through. Kept in user_preferences so the users table is untouched. */
export async function recordSignupSource(userId: string, source: Product): Promise<void> {
  const current = (await readPrefs(userId)) || {};
  if (current.signupSource) return;
  const data = { ...current, signupSource: source };
  await prisma.userPreference.upsert({ where: { userId }, create: { userId, data }, update: { data } });
}

/** Sends one onboarding email and records it. Returns false if it was not sent. */
export async function sendMilestone(userId: string, day: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, emailUnsubscribed: true, sentOnboardingMilestones: true },
  });
  if (!user || user.emailUnsubscribed) return false;

  const prefs = await readPrefs(userId);
  const hasAileanData = prefs !== null || (await prisma.flow.count({ where: { userId } })) > 0;
  const unsub = unsubscribeUrl(user.id);
  const email = onboardingEmail({
    product: productFor(prefs, hasAileanData),
    lang: langFor(prefs),
    day,
    name: user.name || '',
    unsubscribeUrl: unsub,
  });

  const ok = await sendEmail(user.email, email.subject, email.html, {
    from: email.from,
    replyTo: email.replyTo,
    text: email.text,
    headers: { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
  });
  if (!ok) return false;

  const milestones = Array.from(new Set([...user.sentOnboardingMilestones, day]));
  await prisma.user.update({ where: { id: userId }, data: { sentOnboardingMilestones: milestones } });
  return true;
}

/** Called right after sign-up. Never throws: a failed email must not fail the sign-up. */
export async function welcomeNewUser(userId: string, source: Product | null): Promise<void> {
  try {
    if (source) await recordSignupSource(userId, source);
  } catch (err) {
    logger.error('Could not record sign-up source:', err);
  }
  try {
    const ok = await sendMilestone(userId, 0);
    if (!ok) logger.warn(`Welcome email not sent for user ${userId}; the daily run will retry today`);
  } catch (err) {
    logger.error('Welcome email error:', err);
  }
}

/** Daily run: sends whichever milestone is due for each user in their first nine days. */
export async function runOnboarding(now = new Date()) {
  const users = await prisma.user.findMany({
    where: {
      createdAt: { gte: new Date(now.getTime() - LAST_WINDOW_END * DAY_MS) },
      emailUnsubscribed: false,
      isActive: true,
    },
    select: { id: true, email: true, createdAt: true, sentOnboardingMilestones: true },
  });

  const sent: { email: string; day: number }[] = [];
  const failed: { email: string; day: number }[] = [];
  for (const u of users) {
    const day = dueMilestone(u.createdAt, u.sentOnboardingMilestones, now);
    if (day === null) continue;
    (await sendMilestone(u.id, day).catch(() => false) ? sent : failed).push({ email: u.email, day });
  }
  logger.info(`Onboarding run: ${users.length} users checked, ${sent.length} sent, ${failed.length} failed`);
  return { checked: users.length, sent, failed };
}
