// The Ailean email look (paper, ink, one orange square), shared by every Ailean email.

const FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const para = (t: string, margin = '0 0 16px') =>
  `<p style="margin:${margin};font-size:16px;line-height:1.6;color:#141414">${esc(t)}</p>`;

export const muted = (t: string, margin = '0 0 16px') =>
  `<p style="margin:${margin};font-size:14px;line-height:1.5;color:#6B6B66">${esc(t)}</p>`;

export const quote = (t: string) =>
  `<p style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #E65008;background:#F7F7F4;font-size:15px;line-height:1.6;color:#141414;white-space:pre-line">${esc(t)}</p>`;

export const button = (label: string, url: string) =>
  `<p style="margin:28px 0"><a href="${esc(url)}" style="display:inline-block;background:#141414;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:999px">${esc(label)}</a></p>`;

/** Card with the AILEAN wordmark, the body, and a small footer under the card (already HTML). */
export function aileanShell(bodyHtml: string, footerHtml: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#F1F1EE">
<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #DCDCD6;border-radius:10px;padding:32px;font-family:${FONT}">
  <p style="margin:0 0 28px;font-size:14px;font-weight:700;letter-spacing:.3em;color:#141414"><span style="display:inline-block;width:9px;height:9px;background:#E65008;margin-right:10px"></span>AILEAN</p>
  ${bodyHtml}
</div>
<p style="max-width:560px;margin:16px auto 0;font-family:${FONT};font-size:12px;line-height:1.5;color:#6B6B66;text-align:center">${footerHtml}</p>
</body></html>`;
}
