import { connect } from 'node:tls';

/**
 * Email delivery over Gmail SMTP with zero third-party dependencies.
 * Same transport as `app/api/contact/route.ts`. Used to send the buyer
 * their license key after successful payment.
 */

export function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
}

interface SendOpts {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(opts: SendOpts): Promise<void> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('Email service is not configured.');

  const boundary = 'aurumos-mime-boundary';
  const escapeDot = (s: string) =>
    s.split('\r\n').map((l) => (l.startsWith('.') ? '.' + l : l)).join('\r\n');

  const data = [
    `From: "AurumOS" <${user}>`,
    `To: <${opts.to}>`,
    opts.replyTo ? `Reply-To: <${opts.replyTo}>` : '',
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    escapeDot(opts.text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    escapeDot(opts.html),
    '',
    `--${boundary}--`,
    '.',
  ]
    .filter((l) => l !== '')
    .join('\r\n');

  return new Promise((resolve, reject) => {
    const socket = connect(465, 'smtp.gmail.com', { servername: 'smtp.gmail.com' });
    let buffer = '';
    let step = 0;
    let settled = false;

    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error(msg));
    };
    const done = () => {
      if (settled) return;
      settled = true;
      socket.end();
      resolve();
    };

    const NUL = String.fromCharCode(0);
    const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');
    const write = (cmd: string) => socket.write(cmd + '\r\n');

    const advance = () => {
      switch (step) {
        case 0: step = 1; write('EHLO smtp.gmail.com'); break;
        case 1: step = 2; write(`AUTH PLAIN ${b64(NUL + user + NUL + pass)}`); break;
        case 2: step = 3; write(`MAIL FROM:<${user}>`); break;
        case 3: step = 4; write(`RCPT TO:<${opts.to}>`); break;
        case 4: step = 5; write('DATA'); break;
        case 5: step = 6; write(data); break;
        case 6: step = 7; write('QUIT'); break;
        case 7: done(); break;
      }
    };

    const handle = (code: number) => {
      if (code >= 400) return fail(`SMTP error ${code} at step ${step}`);
      advance();
    };

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      let idx: number;
      while ((idx = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        if (line.length < 3) continue;
        const code = parseInt(line.slice(0, 3), 10);
        if (line[3] !== ' ') continue;
        handle(code);
      }
    });

    socket.on('error', (err) => fail(`Socket error: ${(err as Error).message}`));
    socket.on('close', () => {
      if (!settled) fail('Connection closed before completion');
    });
    socket.setTimeout(20000, () => fail('SMTP timeout'));
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendLicenseKeyEmail(opts: {
  to: string;
  ownerName: string;
  businessName: string;
  key: string;
  planName: string;
  softwareType: string;
  expiresAt: string;
  paymentId: string;
}): Promise<void> {
  const subject = `Your AurumOS ${opts.planName} license key`;
  const text = [
    `Hi ${opts.ownerName},`,
    '',
    `Payment received. Your AurumOS ${opts.planName} (${opts.softwareType}) license key is:`,
    '',
    `  ${opts.key}`,
    '',
    `Business: ${opts.businessName}`,
    `Valid until: ${opts.expiresAt}`,
    `Payment ref: ${opts.paymentId}`,
    '',
    'How to activate:',
    '1. Open AurumOS on your shop PC.',
    '2. Enter the key above when prompted.',
    '3. The key locks to the first PC it is activated on.',
    '',
    'Keep this email safe — you need the key to reinstall.',
    'Support: reply to this email.',
  ].join('\n');

  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:0;background:#f4efe9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 0;"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(120,40,60,0.12);">
<tr><td style="background:linear-gradient(135deg,#b3395a 0%,#d65b7c 100%);padding:36px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Aurum<span style="font-weight:300;">OS</span></td>
<td align="right" style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.8);">License Key</td>
</tr></table></td></tr>
<tr><td style="padding:40px;">
<p style="margin:0 0 4px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#d65b7c;font-weight:700;">Payment successful</p>
<h1 style="margin:0 0 8px;font-size:26px;line-height:1.2;color:#2b2326;font-weight:800;">Hi ${escapeHtml(opts.ownerName)}, here is your key</h1>
<p style="margin:0 0 24px;font-size:15px;color:#4a4044;">${escapeHtml(opts.planName)} (${escapeHtml(opts.softwareType)}) for ${escapeHtml(opts.businessName)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#2b2326;border-radius:14px;"><tr>
<td align="center" style="padding:26px 20px;font-family:Consolas,Menlo,monospace;font-size:22px;font-weight:700;letter-spacing:2px;color:#ffffff;">${escapeHtml(opts.key)}</td>
</tr></table>
<p style="margin:24px 0 6px;font-size:13px;font-weight:700;color:#2b2326;text-transform:uppercase;letter-spacing:1px;">How to activate</p>
<ol style="margin:0;padding-left:20px;font-size:15px;line-height:1.7;color:#4a4044;">
<li>Open AurumOS on your shop PC.</li><li>Enter the key above when prompted.</li><li>The key locks to the first PC it is activated on.</li>
</ol>
<p style="margin:24px 0 0;font-size:13px;color:#9b8f8a;">Valid until ${escapeHtml(opts.expiresAt)} &middot; Payment ref ${escapeHtml(opts.paymentId)}<br/>Keep this email safe — you need the key to reinstall.</p>
</td></tr>
<tr><td style="background:#2b2326;padding:22px 40px;">
<p style="margin:0;font-size:12px;color:#b9a9a2;line-height:1.6;">Questions? Just reply to this email.</p>
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:11px;color:#b3a59d;">&copy; ${new Date().getFullYear()} AurumOS &middot; All rights reserved.</p>
</td></tr></table></body></html>`;

  await sendEmail({ to: opts.to, subject, text, html });
}
