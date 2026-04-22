/**
 * Email sender abstraction.
 *
 * In development (or when SMTP is not configured) emails are logged to console.
 * In production set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / EMAIL_FROM
 * in your env to enable real delivery via Nodemailer.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendResult =
  | { ok: true; messageId?: string }
  | { ok: false; error: string };

function isSmtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  );
}

function getEmailFrom() {
  return process.env.EMAIL_FROM?.trim() ?? "noreply@kinetic.store";
}

async function sendViaSmtp(message: EmailMessage): Promise<SendResult> {
  try {
    // Dynamic import so nodemailer is only loaded when actually needed.
    const nodemailer = await import("nodemailer");

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    const info = await transport.sendMail({
      from: getEmailFrom(),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html ?? `<p>${message.text.replace(/\n/g, "<br>")}</p>`,
    });

    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { ok: false, error: errorMessage };
  }
}

function sendViaConsole(message: EmailMessage): SendResult {
  const separator = "─".repeat(60);
  console.log(`\n📧 [EMAIL] ${separator}`);
  console.log(`  To:      ${message.to}`);
  console.log(`  From:    ${getEmailFrom()}`);
  console.log(`  Subject: ${message.subject}`);
  console.log(`  Body:\n${message.text.split("\n").map(l => `    ${l}`).join("\n")}`);
  console.log(`${separator}\n`);
  return { ok: true, messageId: `console-${Date.now()}` };
}

/**
 * Send an email. Falls back to console logging when SMTP is not configured.
 */
export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  if (isSmtpConfigured()) {
    return sendViaSmtp(message);
  }

  return sendViaConsole(message);
}
