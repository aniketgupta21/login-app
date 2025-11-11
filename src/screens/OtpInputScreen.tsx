import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { maskIdentifier } from '../utils/validation';
import { useAuth } from '../context/AuthContext';
import { useOtpAutofill } from '../hooks/useOtpAutofill';

type RouteParams = {
  identifier: string;
  resendAvailableAt?: number;
  expiresAt?: number;
};

const OTP_LENGTH = 6;

const OtpInputScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const {
    identifier,
    resendAvailableAt: initialResendAt = Date.now(),
    expiresAt: initialExpiresAt = Date.now(),
  } = (route.params as RouteParams) ?? {};
  const { requestOtp, verifyOtp, loading, error, isAuthenticated } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resendAt, setResendAt] = useState<number>(initialResendAt);
  const [expiresAt, setExpiresAt] = useState<number>(initialExpiresAt);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [nowTs, setNowTs] = useState<number>(Date.now());

  // Autofill hook
  useOtpAutofill(code => {
    if (code?.length === OTP_LENGTH) {
      setDigits(code.split('').slice(0, OTP_LENGTH));
    }
  });

  // Focus first cell on mount
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // If authenticated, go back to app
  useEffect(() => {
    if (isAuthenticated) {
      nav.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [isAuthenticated, nav]);

  const secondsUntilResend = Math.max(0, Math.ceil((resendAt - nowTs) / 1000));
  const resendDisabled = secondsUntilResend > 0 || loading || submitting;

  const code = useMemo(() => digits.join(''), [digits]);
  const canSubmit = code.length === OTP_LENGTH && !submitting && !loading;

  const onChangeDigit = useCallback((idx: number, val: string) => {
    const v = val.replace(/[^\d]/g, '');
    setDigits(prev => {
      const next = [...prev];
      next[idx] = v.slice(-1);
      return next;
    });
    if (v.length > 0) {
      inputs.current[idx + 1]?.focus();
    }
  }, []);

  const onKeyPress = useCallback((idx: number, key: string) => {
    if (key === 'Backspace') {
      setDigits(prev => {
        const next = [...prev];
        if (next[idx]) {
          next[idx] = '';
          return next;
        }
        if (idx > 0) {
          inputs.current[idx - 1]?.focus();
          next[idx - 1] = '';
        }
        return next;
      });
    }
  }, []);

  const submit = useCallback(async () => {
    if (!canSubmit) return;
    setLocalError(null);
    try {
      setSubmitting(true);
      await verifyOtp(identifier, code);
    } catch (e: any) {
      setLocalError(e?.code ?? 'invalid_code');
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, verifyOtp, identifier, code]);

  useEffect(() => {
    if (code.length === OTP_LENGTH) {
      submit();
    }
  }, [code, submit]);

  const resend = useCallback(async () => {
    setLocalError(null);
    try {
      const resp = await requestOtp(identifier);
      setResendAt(resp.resendAvailableAt);
      setExpiresAt(resp.expiresAt);
    } catch (e: any) {
      setLocalError(e?.code ?? 'rate_limited');
    }
  }, [identifier, requestOtp]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (Date.now() < resendAt) {
      intervalId = setInterval(() => {
        setNowTs(Date.now());
        if (Date.now() >= resendAt && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 1000);
    } else {
      setNowTs(Date.now());
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resendAt]);
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
    >
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          Enter OTP
        </Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to {maskIdentifier(identifier)}
        </Text>

        <View style={styles.otpRow} accessibilityLabel="OTP input">
          {digits.map((d, idx) => (
            <TextInput
              key={idx}
              ref={r => {
                inputs.current[idx] = r;
              }}
              style={styles.otpCell}
              keyboardType="number-pad"
              maxLength={1}
              value={d}
              onChangeText={v => onChangeDigit(idx, v)}
              onKeyPress={({ nativeEvent }) => onKeyPress(idx, nativeEvent.key)}
              accessible
              accessibilityLabel={`Digit ${idx + 1}`}
            />
          ))}
        </View>

        {(localError || error) && (
          <Text style={styles.errorText}>
            {localError ?? error ?? 'Something went wrong'}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, !canSubmit ? styles.buttonDisabled : null]}
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Verify"
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          <TouchableOpacity
            disabled={resendDisabled}
            onPress={resend}
            accessibilityRole="button"
            accessibilityLabel="Resend OTP"
          >
            <Text
              style={[
                styles.resendText,
                resendDisabled ? styles.resendDisabled : null,
              ]}
            >
              {resendDisabled ? `Resend in ${secondsUntilResend}s` : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {submitting && (
        <View style={styles.fullscreenOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={{ marginTop: 10, color: '#111827', fontWeight: '600' }}>
            Verifying...
          </Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { color: '#6b7280', marginBottom: 16 },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  otpCell: {
    width: 48,
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
  },
  errorText: { color: '#dc2626', marginTop: 10 },
  button: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontWeight: '700' },
  resendRow: { marginTop: 16, alignItems: 'center' },
  resendText: { color: '#4f46e5', fontWeight: '600' },
  resendDisabled: { color: '#9ca3af' },
  fullscreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OtpInputScreen;
