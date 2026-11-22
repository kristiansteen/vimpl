// Emails asking someone to describe a process: the invitation and the reminder.
// Sent in the owner's name via Ailean; replies go straight to the owner.
import { aileanShell, button, esc, muted, para, quote } from './email.layout';

const SENDER_ADDRESS = 'ailean@onboard.vimpl.com';

export interface InviteEmailInput {
  lang: 'en' | 'da';
  kind: 'invite' | 'reminder';
  ownerName: string;
  ownerEmail: string;
  processName: string;
  startTrigger: string;
  endPoint: string;
  note: string;
  link: string;
}

export interface InviteEmail { from: string; replyTo: string; subject: string; html: string; text: string }

const COPY = {
  en: {
    subject: (o: string, p: string) => `${o} asked you to describe: ${p}`,
    reminderSubject: (o: string, p: string) => `Reminder: describe ${p} for ${o}`,
    greeting: 'Hi,',
    intro: (o: string, p: string) => `${o} is mapping the process "${p}" and would like your view of how it works in practice.`,
    reminderIntro: (o: string, p: string) => `${o} is still waiting for your description of "${p}".`,
    how: (o: string) => `It takes 10–15 minutes. Ailean asks you a few questions, by voice or text, about the steps, who does what and where things wait. Your answer is only shared with ${o}.`,
    from: 'From', to: 'To',
    cta: 'Describe the process',
    footer: (o: string) => `You get this email because ${o} invited you. Questions? Reply to this email.`,
  },
  da: {
    subject: (o: string, p: string) => `${o} har bedt dig beskrive: ${p}`,
    reminderSubject: (o: string, p: string) => `Påmindelse: beskriv ${p} for ${o}`,
    greeting: 'Hej,',
    intro: (o: string, p: string) => `${o} kortlægger processen "${p}" og vil gerne høre, hvordan den fungerer i praksis hos dig.`,
    reminderIntro: (o: string, p: string) => `${o} venter stadig på din beskrivelse af "${p}".`,
    how: (o: string) => `Det tager 10–15 minutter. Ailean stiller dig nogle spørgsmål, med stemme eller tekst, om trinene, hvem der gør hvad, og hvor der ventes. Dit svar deles kun med ${o}.`,
    from: 'Fra', to: 'Til',
    cta: 'Beskriv processen',
    footer: (o: string) => `Du får denne mail, fordi ${o} har inviteret dig. Spørgsmål? Svar på denne mail.`,
  },
};

/** A display name that cannot break the From header. */
function senderName(name: string, email: string): string {
  const clean = name.replace(/["<>\\]/g, '').replace(/\s+/g, ' ').trim();
  return clean || email;
}

export function inviteEmail(i: InviteEmailInput): InviteEmail {
  const c = COPY[i.lang] ?? COPY.en;
  const owner = senderName(i.ownerName, i.ownerEmail);
  const reminder = i.kind === 'reminder';
  const subject = reminder ? c.reminderSubject(owner, i.processName) : c.subject(owner, i.processName);
  const intro = reminder ? c.reminderIntro(owner, i.processName) : c.intro(owner, i.processName);
  const scope = i.startTrigger && i.endPoint ? `${c.from}: ${i.startTrigger}  ·  ${c.to}: ${i.endPoint}` : '';

  const html = aileanShell([
    para(c.greeting),
    para(intro),
    i.note ? quote(i.note) : '',
    scope ? muted(scope) : '',
    para(c.how(owner)),
    button(c.cta, i.link),
  ].filter(Boolean).join('\n  '), esc(c.footer(owner)));

  const text = [
    c.greeting, '', intro, '',
    ...(i.note ? [`"${i.note}"`, ''] : []),
    ...(scope ? [scope, ''] : []),
    c.how(owner), '',
    `${c.cta}: ${i.link}`, '', '--', c.footer(owner),
  ].join('\n');

  return { from: `${owner} via Ailean <${SENDER_ADDRESS}>`, replyTo: i.ownerEmail, subject, html, text };
}
