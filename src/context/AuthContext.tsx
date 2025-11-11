import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getJSON, getString, setJSON, setString } from '../services/storage';
import { STORAGE_KEYS } from '../utils/constants';
import {
  AuthResult,
  AuthUser,
  requestOtp,
  signInWithGoogle,
  verifyOtp,
} from '../services/authService';

type AuthContextValue = {
  initializing: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  requestOtp: (
    identifier: string,
  ) => Promise<{ resendAvailableAt: number; expiresAt: number }>;
  verifyOtp: (identifier: string, code: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue>({
  initializing: true,
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
  requestOtp: async () => ({ resendAvailableAt: 0, expiresAt: 0 }),
  verifyOtp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getString(STORAGE_KEYS.authToken);
        const storedUser = await getJSON<AuthUser>(STORAGE_KEYS.authUser);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  const handleAuthSuccess = useCallback(async (result: AuthResult) => {
    setToken(result.token);
    setUser(result.user);
    await setString(STORAGE_KEYS.authToken, result.token);
    await setJSON<AuthUser>(STORAGE_KEYS.authUser, result.user);
  }, []);

  const requestOtpAction = useCallback(async (identifier: string) => {
    setError(null);
    return requestOtp(identifier);
  }, []);

  const verifyOtpAction = useCallback(
    async (identifier: string, code: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await verifyOtp(identifier, code);
        // Hold a loader for 4 seconds before finalizing auth and navigating
        await new Promise<void>(resolve => setTimeout(() => resolve(), 4000));
        await handleAuthSuccess(result);
      } catch (e: any) {
        setError(e?.code ?? 'unknown_error');
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [handleAuthSuccess],
  );

  const signInWithGoogleAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      await handleAuthSuccess(result);
    } catch (e: any) {
      setError(e?.code ?? 'oauth_error');
      throw e;
    } finally {
      setLoading(false);
    }
  }, [handleAuthSuccess]);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    await setString(STORAGE_KEYS.authToken, '');
    await setJSON<AuthUser | null>(STORAGE_KEYS.authUser, null as any);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      isAuthenticated: !!token && !!user,
      user,
      token,
      loading,
      error,
      requestOtp: requestOtpAction,
      verifyOtp: verifyOtpAction,
      signInWithGoogle: signInWithGoogleAction,
      logout,
    }),
    [
      initializing,
      token,
      user,
      loading,
      error,
      requestOtpAction,
      verifyOtpAction,
      signInWithGoogleAction,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
