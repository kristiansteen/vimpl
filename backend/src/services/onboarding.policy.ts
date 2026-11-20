// Rules for the onboarding emails: which one is due, which product a user
// signed up through, which language to write in, and unsubscribe tokens.
// No database access here, so it can be tested on its own.
import crypto from 'crypto';

export const ONBOARDING_DAYS = [0, 1, 2, 3, 5, 7];
export const LAST_WINDOW_END = 9; // day 7's email can go out until day 9
const DAY_MS = 24 * 60 * 60 * 1000;

export type Product = 'ailean' | 'vimpl';
export type Lang = 'en' | 'da';

/**
 * The milestone to send now, or null. Each milestone has a window from its day
 * until the next milestone's day (day 7: until day 9), so a daily run catches
 * each one even if a run is missed. Only the current window counts: a user
 * who missed day 1 gets day 3 next, never a backlog of several emails.
 */
export function dueMilestone(createdAt: Date, sent: number[], now: Date): number | null {
  const age = (now.getTime() - createdAt.getTime()) / DAY_MS;
  if (age < 0 || age >= LAST_WINDOW_END) return null;
  let current: number | null = null;
  for (const d of ONBOARDING_DAYS) if (d <= age) current = d;
  if (current === null || sent.includes(current)) return null;
  return current;
}

/** The OAuth `state` sent by the Ailean app says where the sign-up came from. */
export function signupSourceFromState(state: string | undefined): Product | null {
  if (!state) return null;
  try {
    const parsed = JSON.parse(Buffer.from(decodeURIComponent(state), 'base64').toString());
    return parsed?.source === 'voice2launch' || parsed?.source === 'ailean' ? 'ailean' : null;
  } catch {
    return null;
  }
}

/** Stored sign-up source first; users from before it was stored are Ailean users if they have Ailean data. */
export function productFor(prefs: Record<string, unknown> | null, hasAileanData: boolean): Product {
  const s = prefs?.signupSource;
  if (s === 'ailean' || s === 'vimpl') return s;
  return hasAileanData ? 'ailean' : 'vimpl';
}

export function langFor(prefs: Record<string, unknown> | null): Lang {
  return prefs?.preferredLang === 'da' ? 'da' : 'en';
}

export function unsubscribeToken(userId: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(`unsubscribe:${userId}`).digest('base64url');
}

export function verifyUnsubscribeToken(userId: string, token: string, secret: string): boolean {
  if (!token) return false;
  const expected = Buffer.from(unsubscribeToken(userId, secret));
  const given = Buffer.from(token);
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}
