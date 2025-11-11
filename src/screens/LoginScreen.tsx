import React, { useCallback, useMemo, useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { isValidEmail, normalizeIdentifier } from '../utils/validation';
import { useAuth } from '../context/AuthContext';

const LoginScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { requestOtp, signInWithGoogle, loading, error, isAuthenticated } =
    useAuth();
  const [input, setInput] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const isValid = useMemo(() => {
    const v = input.trim();
    const isEmail = isValidEmail(v);
    const digits = v.replace(/\D/g, '');
    const isPhoneLike = !v.includes('@');
    const isPhone10 = isPhoneLike && digits.length === 10;
    return isEmail || isPhone10;
  }, [input]);

  const onSendOtp = useCallback(async () => {
    setLocalError(null);
    if (!isValid) {
      setLocalError('invalid_identifier');
      return;
    }
    const identifier = normalizeIdentifier(input);
    try {
      setSending(true);
      const resp = await requestOtp(identifier);
      nav.navigate('Otp', {
        identifier,
        resendAvailableAt: resp.resendAvailableAt,
        expiresAt: resp.expiresAt,
      });
    } catch (e: any) {
      setLocalError(e?.code ?? 'unknown_error');
    } finally {
      setSending(false);
    }
  }, [input, isValid, nav, requestOtp]);

  const onGoogle = useCallback(async () => {
    setLocalError(null);
    try {
      await signInWithGoogle();
      // Navigation will auto-switch on auth state
    } catch (e: any) {
      setLocalError(e?.code ?? 'oauth_error');
    }
  }, [signInWithGoogle]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.title}>
          Welcome
        </Text>
        <Text style={styles.subtitle}>Login securely to continue</Text>

        <Text style={styles.label}>Email or Phone</Text>
        <TextInput
          accessibilityLabel="Email or Phone"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            !isValid && input.length > 0 ? styles.inputError : null,
          ]}
          placeholder="you@example.com or +1 555 555 5555"
          value={input}
          onChangeText={setInput}
          textContentType="username"
        />
        {localError === 'invalid_identifier' && (
          <Text style={styles.errorText}>
            Please enter a valid email or phone
          </Text>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Login with OTP"
          style={[
            styles.button,
            !(isValid && !sending) ? styles.buttonDisabled : null,
          ]}
          onPress={onSendOtp}
          disabled={!isValid || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login with OTP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          style={[styles.buttonSecondary]}
          onPress={onGoogle}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={styles.buttonSecondaryText}>Continue with Google</Text>
          )}
        </TouchableOpacity>
      </View>
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
  label: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  inputError: { borderColor: '#ef4444' },
  errorText: { color: '#dc2626', marginTop: 6 },
  button: {
    marginTop: 16,
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#a5b4fc' },
  buttonText: { color: '#fff', fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  divider: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 8, color: '#9ca3af' },
  buttonSecondary: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonSecondaryText: { color: '#111827', fontWeight: '700' },
});

export default LoginScreen;
