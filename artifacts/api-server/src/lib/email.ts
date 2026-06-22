/**
 * Transactional email delivery via Resend (Replit integration).
 *
 * The Resend API key is provided by the Replit connector proxy once the user
 * connects their Resend account — we never store the key ourselves. We call
 * Resend's REST API directly with `fetch` so no SDK dependency is required.
 *
 * If Resend is not connected, `sendPasswordResetEmail` throws; callers should
 * treat that as a soft failure (log it, but do not leak account existence to
 * the client).
 */
import { logger } from "./logger";

interface ResendConnectionSettings {
  api_key?: string;
  apiKey?: string;
  access_token?: string;
  from_email?: string;
  fromEmail?: string;
  [key: string]: unknown;
}

/** Fetches the Resend API key (and optional from-address) from the connector proxy. */
async function getResendCredentials(): Promise<{ apiKey: string; from?: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Resend connector not available in this environment");
  }

  const res = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=resend`,
    {
      headers: {
        Accept: "application/json",
        X_REPLIT_TOKEN: xReplitToken,
      },
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Resend connection (${res.status})`);
  }
  const data = (await res.json()) as {
    items?: Array<{ settings?: ResendConnectionSettings }>;
  };
  const settings = data.items?.[0]?.settings;
  const apiKey = settings?.api_key || settings?.apiKey || settings?.access_token;
  if (!apiKey) {
    throw new Error("Resend is not connected (no API key found)");
  }
  return {
    apiKey,
    from: settings?.from_email || settings?.fromEmail,
  };
}

/** Sends a 6-digit password reset code to the user's email via Resend. */
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const { apiKey, from } = await getResendCredentials();
  // `onboarding@resend.dev` is Resend's shared sender; works before a domain is
  // verified (in test mode it only delivers to the account owner's address).
  const fromAddress = from || "PDF Genius <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: "Your PDF Genius password reset code",
      html: passwordResetHtml(code),
      text:
        `Your PDF Genius password reset code is ${code}. ` +
        `It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({ status: res.status, body }, "Resend email send failed");
    throw new Error(`Resend send failed (${res.status})`);
  }
}

/** Sends a 6-digit signup verification code to a prospective user via Resend. */
export async function sendSignupOtpEmail(to: string, code: string): Promise<void> {
  const { apiKey, from } = await getResendCredentials();
  const fromAddress = from || "PDF Genius <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject: "Your PDF Genius verification code",
      html: signupOtpHtml(code),
      text:
        `Your PDF Genius verification code is ${code}. ` +
        `It expires in 10 minutes. If you didn't try to sign up, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error({ status: res.status, body }, "Resend signup OTP send failed");
    throw new Error(`Resend send failed (${res.status})`);
  }
}

function signupOtpHtml(code: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="color:#f7433d;margin:0 0 8px">Verify your email</h2>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Welcome to PDF Genius! Enter the code below to finish creating your account. It expires in 10 minutes.
    </p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;
                background:#fff1f0;color:#f7433d;border-radius:12px;padding:18px 0;margin:0 0 16px">
      ${code}
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0">
      If you didn't try to sign up for PDF Genius, you can safely ignore this email.
    </p>
  </div>`;
}

function passwordResetHtml(code: string): string {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1f2937">
    <h2 style="color:#f7433d;margin:0 0 8px">Password reset</h2>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">
      Use the code below to reset your PDF Genius password. It expires in 15 minutes.
    </p>
    <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;
                background:#fff1f0;color:#f7433d;border-radius:12px;padding:18px 0;margin:0 0 16px">
      ${code}
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>`;
}
