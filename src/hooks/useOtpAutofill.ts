import { useEffect } from 'react';
import {
  DeviceEventEmitter,
  EmitterSubscription,
  PermissionsAndroid,
  Platform,
} from 'react-native';

export function useOtpAutofill(onCode: (code: string) => void) {
  useEffect(() => {
    let sub: EmitterSubscription | null = null;
    let cancelled = false;

    async function init() {
      if (Platform.OS === 'android') {
        try {
          // Best-effort permission request; not strictly required for our mock event
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          );
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
          );
        } catch {
          // ignore
        }
        if (cancelled) return;
        sub = DeviceEventEmitter.addListener('MOCK_SMS', (message: string) => {
          const match = message?.match(/(\d{6})/);
          if (match) {
            onCode(match[1]);
          }
        });
      }
    }
    init();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [onCode]);
}


