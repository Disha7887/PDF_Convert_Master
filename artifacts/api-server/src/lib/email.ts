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

/**
 * Polished, email-client-safe password reset template. Table-based 600px layout
 * with a max-width fallback for mobile, inline CSS only (most clients strip
 * <style> blocks), and the PDF Genius coral brand accent (#f7433d).
 *
 * Takes the plaintext OTP and returns a single HTML string, so it can be reused
 * anywhere the password reset code needs to be emailed.
 */
function passwordResetHtml(otpCode: string): string {
  return `
  <div style="margin:0;padding:0;background-color:#f4f4f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
            <!-- Header: logo + app name -->
            <tr>
              <td align="center" style="padding:32px 24px 12px 24px;">
                <img src="https://pdfgenius.app/logo.png" alt="PDF Genius" width="56" height="56" style="display:block;border:0;outline:none;text-decoration:none;border-radius:12px;" />
                <div style="font-size:22px;font-weight:700;color:#f7433d;margin-top:12px;">PDF Genius</div>
              </td>
            </tr>
            <!-- Heading -->
            <tr>
              <td style="padding:8px 32px 0 32px;">
                <h1 style="margin:0;font-size:24px;line-height:1.3;color:#1f2937;text-align:center;font-weight:700;">Password Reset Request</h1>
              </td>
            </tr>
            <!-- Greeting -->
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#4b5563;text-align:center;">
                  We received a request to reset your PDF Genius password. Use the one-time code below to continue. For your security, it's only valid for a short time.
                </p>
              </td>
            </tr>
            <!-- OTP box -->
            <tr>
              <td style="padding:24px 32px 0 32px;">
                <div style="background-color:#fff1f0;border:1px solid #ffd9d6;border-radius:12px;padding:24px;text-align:center;">
                  <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;margin-bottom:8px;">Your reset code</div>
                  <div style="font-size:40px;font-weight:700;letter-spacing:10px;color:#f7433d;">${otpCode}</div>
                </div>
              </td>
            </tr>
            <!-- Expiry -->
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <p style="margin:0;font-size:14px;line-height:1.5;color:#6b7280;text-align:center;">
                  This code expires in <strong style="color:#1f2937;">15 minutes</strong>.
                </p>
              </td>
            </tr>
            <!-- Security note -->
            <tr>
              <td style="padding:16px 32px 24px 32px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;text-align:center;">
                  If you didn't request this, you can safely ignore this email — your password will remain unchanged.
                </p>
              </td>
            </tr>
            <!-- Divider -->
            <tr><td style="padding:0 32px;"><div style="border-top:1px solid #eaeaea;"></div></td></tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px 32px 32px;text-align:center;">
                <div style="font-size:13px;font-weight:600;color:#4b5563;">PDF Genius</div>
                <div style="font-size:13px;color:#9ca3af;margin-top:6px;">
                  Need help? <a href="mailto:support@pdfgenius.app" style="color:#f7433d;text-decoration:none;">support@pdfgenius.app</a>
                </div>
                <div style="font-size:12px;color:#c4c4c4;margin-top:10px;">© 2026 PDF Genius. All rights reserved.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>`;
}
