// Onboarding email content. Ailean users get Ailean emails (English or Danish);
// vimpl users keep the vimpl emails. Every email has an unsubscribe link.
import type { Lang, Product } from './onboarding.policy';

export const AILEAN_APP_URL = 'https://voice-2-launch.vercel.app/';
const VIMPL_APP_URL = 'https://app.vimpl.com';
const FROM_AILEAN = 'Kristian from Ailean <ailean@onboard.vimpl.com>';
const FROM_VIMPL = 'Kristian from vimpl <ailean@onboard.vimpl.com>';
// onboard.vimpl.com only sends; replies go to a real inbox.
const REPLY_TO = 'ailean@vimpl.com';

interface Day { subject: string; paras: string[]; cta: string }
type Copy = Record<number, Day>;

const AILEAN_EN: Copy = {
  0: {
    subject: 'Welcome to Ailean: map your first process today',
    paras: [
      'Ailean turns what the people who do the work know into a clear process: what happens, where the waiting is, and what to change.',
      'Start with one process you know well. Let Ailean interview you, or paste notes from a workshop. It takes about ten minutes.',
    ],
    cta: 'Describe your first process',
  },
  1: {
    subject: 'Tip: interview the person who does the work',
    paras: [
      'The best description comes from the people who run the process every day, not from the procedure document.',
      'Send them the interview, or sit with them for ten minutes. Ailean asks for touch time and waiting time per step and uses them for lead time and flow efficiency.',
    ],
    cta: 'Start an interview',
  },
  2: {
    subject: 'From description to BPMN',
    paras: [
      'Check the description in Review: roles, steps and exceptions. Ailean then draws the AS-IS as BPMN, with lead time and flow efficiency.',
      'Switch on the Value view to see which steps add value, which are needed but add none, and which are waste.',
    ],
    cta: 'Open my processes',
  },
  3: {
    subject: 'Choose the improvements that pay',
    paras: [
      'In Improve, Ailean suggests improvements scored on impact and effort. Pick the ones you believe in.',
      'You then see the TO-BE process with its new figures next to today’s, and can export it for Amazon Quick Suite, n8n or Camunda.',
    ],
    cta: 'Find improvements',
  },
  5: {
    subject: 'Turn it into a plan and a business case',
    paras: [
      'Plan shows the benefit per year, the month it pays back, and a week-by-week timeline with owners and risks.',
      'That is the page to take to the person who signs off.',
    ],
    cta: 'Open the plan',
  },
  7: {
    subject: 'How is Ailean working for you?',
    paras: [
      'You have had Ailean for a week. Reply to this email and tell me what worked and what did not. I read every reply.',
      'To map a process with your team, try Rounds: several people describe the same process, and Ailean shows where they disagree.',
    ],
    cta: 'Open Ailean',
  },
};

const AILEAN_DA: Copy = {
  0: {
    subject: 'Velkommen til Ailean: kortlæg din første proces i dag',
    paras: [
      'Ailean gør det, medarbejderne ved om arbejdet, til en klar proces: hvad der sker, hvor der ventes, og hvad der bør ændres.',
      'Start med én proces, du kender godt. Lad Ailean interviewe dig, eller indsæt noter fra en workshop. Det tager omkring ti minutter.',
    ],
    cta: 'Beskriv din første proces',
  },
  1: {
    subject: 'Tip: interview dem, der udfører arbejdet',
    paras: [
      'Den bedste beskrivelse kommer fra dem, der kører processen hver dag, ikke fra procedurebeskrivelsen.',
      'Send dem interviewet, eller sæt dig med dem i ti minutter. Ailean spørger til arbejdstid og ventetid for hvert trin og bruger dem til gennemløbstid og floweffektivitet.',
    ],
    cta: 'Start et interview',
  },
  2: {
    subject: 'Fra beskrivelse til BPMN',
    paras: [
      'Gennemgå beskrivelsen: roller, trin og undtagelser. Ailean tegner derefter AS-IS som BPMN med gennemløbstid og floweffektivitet.',
      'Slå værdivisningen til og se, hvilke trin der skaber værdi, hvilke der er nødvendige uden at skabe værdi, og hvilke der er spild.',
    ],
    cta: 'Åbn mine processer',
  },
  3: {
    subject: 'Vælg de forbedringer, der betaler sig',
    paras: [
      'Under Forbedr foreslår Ailean forbedringer vurderet på effekt og indsats. Vælg dem, du tror på.',
      'Du ser derefter TO-BE-processen med de nye tal ved siden af dagens, og kan eksportere den til Amazon Quick Suite, n8n eller Camunda.',
    ],
    cta: 'Find forbedringer',
  },
  5: {
    subject: 'Gør det til en plan og en business case',
    paras: [
      'Planen viser gevinsten pr. år, hvornår investeringen er tjent hjem, og en tidsplan uge for uge med ansvarlige og risici.',
      'Det er siden, du tager med til den, der skal godkende.',
    ],
    cta: 'Åbn planen',
  },
  7: {
    subject: 'Hvordan går det med Ailean?',
    paras: [
      'Du har haft Ailean i en uge. Svar på denne mail og fortæl, hvad der virkede, og hvad der ikke gjorde. Jeg læser alle svar.',
      'Vil du kortlægge en proces med dit team, så prøv Runder: flere personer beskriver den samme proces, og Ailean viser, hvor de er uenige.',
    ],
    cta: 'Åbn Ailean',
  },
};

const VIMPL_SUBJECTS: Record<number, string> = {
  0: 'Welcome to vimpl — here\'s how to get started',
  1: 'Day 1: Your first steps in vimpl',
  2: 'Day 2: Getting more out of vimpl',
  3: 'Day 3: Tips & tricks for vimpl',
  5: 'Day 5: How is vimpl working for you?',
  7: 'Day 7: Make vimpl part of your workflow',
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface OnboardingEmailInput {
  product: Product;
  lang: Lang;
  day: number;
  name: string;
  unsubscribeUrl: string;
}

export interface OnboardingEmail { from: string; replyTo: string; subject: string; html: string; text: string }

export function onboardingEmail(i: OnboardingEmailInput): OnboardingEmail {
  return i.product === 'ailean' ? aileanEmail(i) : vimplEmail(i);
}

function aileanEmail({ lang, day, name, unsubscribeUrl }: OnboardingEmailInput): OnboardingEmail {
  const copy = (lang === 'da' ? AILEAN_DA : AILEAN_EN)[day] ?? (lang === 'da' ? AILEAN_DA : AILEAN_EN)[0];
  const da = lang === 'da';
  const greeting = `${da ? 'Hej' : 'Hi'} ${name.trim() || (da ? 'der' : 'there')},`;
  const signoff = da ? 'Venlig hilsen' : 'Best regards';
  const role = da ? 'stifter af Ailean' : 'founder of Ailean';
  const footer = da
    ? 'Du får denne mail, fordi du har oprettet en konto i Ailean.'
    : 'You get this email because you signed up for Ailean.';
  const unsub = da ? 'Afmeld' : 'Unsubscribe';

  const p = (t: string) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#141414">${esc(t)}</p>`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#F1F1EE">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #DCDCD6;border-radius:10px;padding:32px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif">
  <p style="margin:0 0 28px;font-size:14px;font-weight:700;letter-spacing:.3em;color:#141414"><span style="display:inline-block;width:9px;height:9px;background:#E65008;margin-right:10px"></span>AILEAN</p>
  ${p(greeting)}
  ${copy.paras.map(p).join('\n  ')}
  <p style="margin:28px 0"><a href="${AILEAN_APP_URL}" style="display:inline-block;background:#141414;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(copy.cta)}</a></p>
  ${p(`${signoff},`).replace('margin:0 0 16px', 'margin:0')}
  <p style="margin:0 0 4px;font-size:16px;color:#141414"><strong>Kristian Steen</strong></p>
  <p style="margin:0;font-size:14px;color:#6B6B66">${role}</p>
</div>
<p style="max-width:560px;margin:16px auto 0;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#6B6B66;text-align:center">${esc(footer)} <a href="${esc(unsubscribeUrl)}" style="color:#6B6B66">${unsub}</a></p>
</body></html>`;

  const text = [
    greeting, '', ...copy.paras.flatMap(t => [t, '']),
    `${copy.cta}: ${AILEAN_APP_URL}`, '',
    `${signoff},`, 'Kristian Steen', role, '', '--', footer, `${unsub}: ${unsubscribeUrl}`,
  ].join('\n');

  return { from: FROM_AILEAN, replyTo: REPLY_TO, subject: copy.subject, html, text };
}

function vimplEmail({ day, name, unsubscribeUrl }: OnboardingEmailInput): OnboardingEmail {
  const greeting = name.trim() || 'there';
  const subject = VIMPL_SUBJECTS[day] ?? `vimpl onboarding — Day ${day}`;
  const html = `
    <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#fff;border:1px solid #eaeaea;border-radius:12px;">
      <p style="font-size:24px;font-weight:700;color:#111;margin:0 0 24px">vimpl</p>
      <h2 style="color:#111;margin-bottom:16px">Hi ${esc(greeting)},</h2>
      <p style="font-size:16px;line-height:1.6;color:#444">
        This is your Day ${day} message from vimpl. We hope you're getting value from the platform.
      </p>
      <div style="margin:32px 0;text-align:center">
        <a href="${VIMPL_APP_URL}" style="background:#4f46e5;color:#fff;padding:14px 28px;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block">Open vimpl</a>
      </div>
      <p style="font-size:16px;line-height:1.6;color:#222">Best,<br><strong>Kristian from vimpl</strong></p>
      <p style="font-size:12px;color:#888;margin-top:24px">You get this email because you signed up for vimpl. <a href="${esc(unsubscribeUrl)}" style="color:#888">Unsubscribe</a></p>
    </div>`;
  const text = `Hi ${greeting},\n\nThis is your Day ${day} message from vimpl.\n\nOpen vimpl: ${VIMPL_APP_URL}\n\nBest,\nKristian from vimpl\n\n--\nUnsubscribe: ${unsubscribeUrl}`;
  return { from: FROM_VIMPL, replyTo: REPLY_TO, subject, html, text };
}
