import { DeviceEventEmitter, Platform } from 'react-native';
import { CONFIG } from '../config';
import {
  isValidEmail,
  isValidPhone,
  normalizeIdentifier,
} from '../utils/validation';

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  provider: 'otp' | 'google';
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

type OtpSession = {
  identifier: string;
  code: string;
  expiresAt: number;
  resendAvailableAt: number;
  requestTimestamps: number[];
  verifyTimestamps: number[];
  failedVerifyCount: number;
};

const otpSessions = new Map<string, OtpSession>();

function now(): number {
  return Date.now();
}

function pruneWindow(timestamps: number[], windowMs: number): number[] {
  const cutoff = now() - windowMs;
  return timestamps.filter(ts => ts >= cutoff);
}

function generateOtp(): string {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

function buildUserFromIdentifier(identifier: string): AuthUser {
  if (isValidEmail(identifier)) {
    const namePart = identifier.split('@')[0];
    const name =
      namePart.length === 0
        ? 'User'
        : namePart[0].toUpperCase() + namePart.slice(1);
    return {
      id: `user_${identifier}`,
      name,
      email: identifier,
      provider: 'otp',
    };
  }
  return {
    id: `user_${identifier}`,
    name: 'User',
    phone: identifier,
    provider: 'otp',
  };
}

export type SendOtpResponse = {
  resendAvailableAt: number;
  expiresAt: number;
};

export async function requestOtp(
  rawIdentifier: string,
): Promise<SendOtpResponse> {
  const identifier = normalizeIdentifier(rawIdentifier);
  if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
    throw Object.assign(new Error('invalid_identifier'), {
      code: 'invalid_identifier',
    });
  }

  const existing = otpSessions.get(identifier) ?? {
    identifier,
    code: '',
    expiresAt: 0,
    resendAvailableAt: 0,
    requestTimestamps: [],
    verifyTimestamps: [],
    failedVerifyCount: 0,
  };

  existing.requestTimestamps = pruneWindow(
    [...existing.requestTimestamps, now()],
    CONFIG.OTP_RATE_LIMIT_WINDOW_MS,
  );
  if (existing.requestTimestamps.length > CONFIG.OTP_MAX_ATTEMPTS) {
    throw Object.assign(new Error('rate_limited'), { code: 'rate_limited' });
  }

  const canResend = now() >= existing.resendAvailableAt;
  if (!canResend && existing.code) {
    // Still within cooldown
    return {
      resendAvailableAt: existing.resendAvailableAt,
      expiresAt: existing.expiresAt,
    };
  }

  const code = generateOtp();
  const expiresAt = now() + CONFIG.OTP_EXPIRY_SECONDS * 1000;
  const resendAvailableAt = now() + CONFIG.OTP_RESEND_SECONDS * 1000;

  const session: OtpSession = {
    ...existing,
    code,
    expiresAt,
    resendAvailableAt,
  };
  otpSessions.set(identifier, session);

  // Simulate SMS delivery on Android for auto-fill demo
  if (Platform.OS === 'android') {
    setTimeout(() => {
      DeviceEventEmitter.emit(
        'MOCK_SMS',
        `Your OTP is ${code}. It expires in ${CONFIG.OTP_EXPIRY_SECONDS} seconds.`,
      );
    }, 60000);
  }

  return { resendAvailableAt, expiresAt };
}

export async function verifyOtp(
  rawIdentifier: string,
  otp: string,
): Promise<AuthResult> {
  const identifier = normalizeIdentifier(rawIdentifier);
  const session = otpSessions.get(identifier);
  if (!session) {
    throw Object.assign(new Error('not_requested'), { code: 'not_requested' });
  }

  session.verifyTimestamps = pruneWindow(
    [...session.verifyTimestamps, now()],
    CONFIG.OTP_RATE_LIMIT_WINDOW_MS,
  );
  if (session.verifyTimestamps.length > CONFIG.OTP_MAX_ATTEMPTS) {
    throw Object.assign(new Error('too_many_attempts'), {
      code: 'too_many_attempts',
    });
  }

  if (now() > session.expiresAt) {
    otpSessions.delete(identifier);
    throw Object.assign(new Error('expired'), { code: 'expired' });
  }

  if (otp !== session.code) {
    session.failedVerifyCount += 1;
    if (session.failedVerifyCount >= CONFIG.OTP_MAX_ATTEMPTS) {
      otpSessions.delete(identifier);
      throw Object.assign(new Error('too_many_attempts'), {
        code: 'too_many_attempts',
      });
    }
    throw Object.assign(new Error('invalid_code'), { code: 'invalid_code' });
  }

  // Success
  otpSessions.delete(identifier);
  const user = buildUserFromIdentifier(identifier);
  const token = `token_${user.id}_${now()}`;
  return { token, user };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  // Simulate network latency
  await new Promise<void>(res => setTimeout(res, 700));
  const user: AuthUser = {
    id: 'google_12345',
    name: 'Google User',
    email: 'user@example.com',
    avatarUrl: 'https://i.pravatar.cc/100?img=3',
    provider: 'google',
  };
  const token = `token_${user.id}_${now()}`;
  return { token, user };
}
