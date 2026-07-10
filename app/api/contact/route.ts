import { NextRequest, NextResponse } from 'next/server';
import { connect } from 'node:tls';

// We use Node's built-in TLS socket to speak SMTP directly to Gmail, so the
// project keeps zero third-party email dependencies.
export const runtime = 'nodejs';

const SMTP = {
  host: 'smtp.gmail.com',
  port: 465,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, message, plan } = body ?? {};

    if (!firstName || !lastName || !email || !phone || !message) {
      return NextResponse.json(
        { ok: false, error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(String(email))) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const phoneRe = /^[+]?[\d\s().-]{7,20}$/;
    if (!phoneRe.test(String(phone))) {
      return NextResponse.json(
        { ok: false, error: 'Please enter a valid phone number.' },
        { status: 400 }
      );
    }

    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;
    const to = process.env.EMAIL_TO || 'aurumos.software@gmail.com';

    if (!user || !pass) {
      console.error('Contact route: EMAIL_USER / EMAIL_APP_PASSWORD are not set');
      return NextResponse.json(
        { ok: false, error: 'Email service is not configured.' },
        { status: 500 }
      );
    }

    const name = `${firstName} ${lastName}`.trim();
    const subject = `New AurumOS Lead: ${name}${plan ? ` (${plan})` : ''}`;

    const text = [
      'You have a new demo request from the AurumOS website.',
      '',
      `Name:    ${name}`,
      `Email:   ${email}`,
      `Phone:   ${phone}`,
      plan ? `Plan:    ${plan}` : null,
      '',
      'Message:',
      String(message),
      '',
      `Received: ${new Date().toISOString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    const html = `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4efe9;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(120,40,60,0.12);">

            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#b3395a 0%,#d65b7c 100%);padding:36px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:24px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;">Aurum<span style="font-weight:300;">OS</span></td>
                    <td align="right" style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.8);">New Lead</td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <p style="margin:0 0 4px;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#d65b7c;font-weight:700;">Demo Request</p>
                <h1 style="margin:0 0 24px;font-size:26px;line-height:1.2;color:#2b2326;font-weight:800;">You've got a new lead${plan ? ` &mdash; ${escapeHtml(String(plan))}` : ''}</h1>

                <!-- Lead summary card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f5;border:1px solid #f0e2db;border-radius:14px;overflow:hidden;">
                  ${row('Name', escapeHtml(name))}
                  ${row('Email', `<a href="mailto:${escapeHtml(String(email))}" style="color:#b3395a;text-decoration:none;">${escapeHtml(String(email))}</a>`)}
                  ${row('Phone', `<a href="tel:${escapeHtml(String(phone).replace(/\s/g, ''))}" style="color:#b3395a;text-decoration:none;">${escapeHtml(String(phone))}</a>`)}
                  ${plan ? row('Plan of interest', escapeHtml(String(plan))) : ''}
                </table>

                <!-- Message -->
                <p style="margin:28px 0 10px;font-size:13px;font-weight:700;color:#2b2326;text-transform:uppercase;letter-spacing:1px;">Their message</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfaf8;border-left:4px solid #d65b7c;border-radius:0 12px 12px 0;padding:18px 20px;">
                  <tr><td style="font-size:15px;line-height:1.6;color:#4a4044;white-space:pre-wrap;">${escapeHtml(String(message))}</td></tr>
                </table>

                <p style="margin:28px 0 0;font-size:13px;color:#9b8f8a;">Received ${new Date().toISOString()}</p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#2b2326;padding:22px 40px;">
                <p style="margin:0;font-size:12px;color:#b9a9a2;line-height:1.6;">This lead was captured from the <strong style="color:#ffffff;">aurumos.software</strong> contact form. Reply directly to the sender using the email above.</p>
              </td>
            </tr>

          </table>
          <p style="margin:16px 0 0;font-size:11px;color:#b3a59d;">&copy; ${new Date().getFullYear()} AurumOS &middot; All rights reserved.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `;

    await sendSmtpEmail({
      host: SMTP.host,
      port: SMTP.port,
      user,
      pass,
      from: user,
      to,
      replyTo: String(email),
      subject,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Contact email failed:', err);
    return NextResponse.json(
      { ok: false, error: 'Could not send your message. Please try again later.' },
      { status: 500 }
    );
  }
}

type SmtpOptions = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

function sendSmtpEmail(opts: SmtpOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const boundary = 'aurumos-mime-boundary';
    const escapeDot = (s: string) =>
      s.split('\r\n').map((l) => (l.startsWith('.') ? '.' + l : l)).join('\r\n');

    const data = [
      `From: "AurumOS Website" <${opts.from}>`,
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

    const socket = connect(opts.port, opts.host, { servername: opts.host });

    let buffer = '';
    // 0 greeting -> 1 ehlo -> 2 auth -> 3 mail -> 4 rcpt -> 5 data -> 6 body -> 7 quit
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
        case 0: step = 1; write(`EHLO ${opts.host}`); break;
        case 1: step = 2; write(`AUTH PLAIN ${b64(NUL + opts.user + NUL + opts.pass)}`); break;
        case 2: step = 3; write(`MAIL FROM:<${opts.from}>`); break;
        case 3: step = 4; write(`RCPT TO:<${opts.to}>`); break;
        case 4: step = 5; write('DATA'); break;
        case 5: step = 6; write(data); break;
        case 6: step = 7; write('QUIT'); break;
        case 7: done(); break;
      }
    };

    const handle = (code: number) => {
      if (code >= 400) return fail(`SMTP error ${code} at step ${step}`);
      const expect: Record<number, number> = { 0: 220, 1: 250, 2: 235, 3: 250, 4: 250, 5: 354, 6: 250, 7: 221 };
      const expected = expect[step];
      if (expected && code !== expected) return fail(`Unexpected SMTP code ${code} (expected ${expected}) at step ${step}`);
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
        if (line[3] !== ' ') continue; // skip multi-line continuation (e.g. EHLO)
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

// A single labelled row inside the lead-summary card of the email.
function row(label: string, valueHtml: string): string {
  return `
                  <tr>
                    <td style="padding:14px 20px;font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#9b8f8a;width:170px;vertical-align:top;border-bottom:1px solid #f0e2db;">${label}</td>
                    <td style="padding:14px 20px;font-size:15px;color:#2b2326;vertical-align:top;border-bottom:1px solid #f0e2db;">${valueHtml}</td>
                  </tr>`;
}
