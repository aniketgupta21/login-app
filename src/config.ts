export type AppConfig = {
  GOOGLE_OAUTH_CLIENT_ID: string;
  OTP_EXPIRY_SECONDS: number;
  OTP_RESEND_SECONDS: number;
  OTP_MAX_ATTEMPTS: number;
  OTP_RATE_LIMIT_WINDOW_MS: number;
};

const ENV: Record<string, string | undefined> =
  // Ensure we don't throw on platforms without process
  (typeof globalThis !== 'undefined' &&
    (globalThis as any)?.process &&
    (globalThis as any).process.env) ||
  {};

function getNumberEnv(key: string, fallback: number): number {
  const raw = ENV[key];
  const parsed = raw != null ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const CONFIG: AppConfig = {
  GOOGLE_OAUTH_CLIENT_ID:
    (ENV.GOOGLE_OAUTH_CLIENT_ID as string) ?? 'demo-google-client-id',
  OTP_EXPIRY_SECONDS: getNumberEnv('OTP_EXPIRY_SECONDS', 120),
  OTP_RESEND_SECONDS: getNumberEnv('OTP_RESEND_SECONDS', 60),
  OTP_MAX_ATTEMPTS: getNumberEnv('OTP_MAX_ATTEMPTS', 5),
  OTP_RATE_LIMIT_WINDOW_MS: getNumberEnv(
    'OTP_RATE_LIMIT_WINDOW_MS',
    5 * 60 * 1000,
  ),
};
