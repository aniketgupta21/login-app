Secure Login Flow (React Native)
================================

This app demonstrates a secure login flow in React Native with:

- Login with Email/Phone & OTP (6-digit)
- Simulated Google OAuth sign-in
- Persistent auth state (token + user) with AsyncStorage
- Robust UX: validation, error handling, resend cooldown, rate limiting
- Android OTP auto-fill via a mocked SMS event

Tech Stack
----------

- React Native 0.80, React 19
- TypeScript
- React Navigation (native-stack)
- AsyncStorage
- Gesture Handler, Screens, Safe Area Context

Project Structure
-----------------

```
src/
  App.tsx                         # App root, providers, navigation
  navigation/
    index.tsx                     # Auth stack (Login/Otp) and App stack (Home)
  context/
    AuthContext.tsx               # Auth state (token, user, actions)
  screens/
    LoginScreen.tsx               # Email/phone + OTP request, Google button
    OtpInputScreen.tsx            # 6-digit OTP, resend timer, auto-fill (Android)
    HomeScreen.tsx                # Dashboard: user info + logout
  services/
    authService.ts                # Simulated OTP + Google auth logic
    storage.ts                    # AsyncStorage helpers
  hooks/
    useOtpAutofill.ts             # Listens for mocked SMS to auto-fill on Android
  utils/
    constants.ts                  # Storage keys
  config.ts                       # Env-style configuration (OTP window, client id)
```

Getting Started
---------------

Prerequisites
- Node >= 18 and Yarn
- Java 17 (for Android)
- Xcode (iOS) and/or Android Studio (Android)

1) Install dependencies

```
yarn
```

2) iOS

```
cd ios && pod install && cd ..
yarn ios
```

3) Android

```
yarn android
```

Configuration
-------------

`src/config.ts` reads from environment variables with safe fallbacks:
- GOOGLE_OAUTH_CLIENT_ID (default: demo-google-client-id)
- OTP_EXPIRY_SECONDS (default: 120)
- OTP_RESEND_SECONDS (default: 60)
- OTP_MAX_ATTEMPTS (default: 5)
- OTP_RATE_LIMIT_WINDOW_MS (default: 300000)

You can export these via your shell or CI; otherwise the defaults are used.

How It Works
------------
- LoginScreen
  - Validates email or 10-digit phone input (more than 10 disables OTP).
  - Requests OTP via `authService.requestOtp`.
  - Simulated Google Sign-in via `authService.signInWithGoogle`.
- OtpInputScreen
  - 6-digit numeric input with auto-advance.
  - Android: mocked SMS event auto-fills code within ~1.2s.
  - Resend cooldown timer (default 60s) with “Resend in Xs” countdown.
  - Errors: invalid_code, expired, rate_limited, too_many_attempts.
- AuthContext
  - Persists `token` and `user` to AsyncStorage.
  - Restores on boot; navigator routes to Home when authenticated.
- HomeScreen
  - Shows user info and a Logout button.

Testing Tips
------------
- Wrong OTP: Enter any 6 digits different from the code to see an error.
  - Android auto-fill is mocked; to test manual input, quickly type before ~1.2s auto-fill or temporarily comment the mock event emission in `authService.requestOtp`.
- Expired OTP: Wait past `OTP_EXPIRY_SECONDS` before verifying.
- Too many attempts: Enter wrong OTP repeatedly (>= OTP_MAX_ATTEMPTS).
- Already authenticated redirect: Tap Logout on Home, or clear app data:
  ```
  adb shell pm clear com.dummyapp
  ```

Android Notes
-------------
- Java 17 required:
  ```
  /usr/libexec/java_home -V
  export JAVA_HOME=$(/usr/libexec/java_home -v 17)
  ```
- If Gradle can’t find Node:
  ```
  export NODE_BINARY=$(command -v node)
  cd android && ./gradlew clean && cd ..
  yarn android
  ```
- OTP auto-fill uses a mocked SMS broadcast; permissions are declared in `AndroidManifest.xml` (RECEIVE_SMS, READ_SMS).

Accessibility & UX
------------------
- Safe area handling across screens.
- Accessible labels on inputs and buttons.
- Clear validation and error states with feedback.

Scripts
-------
- iOS: `yarn ios`
- Android: `yarn android`
- Start Metro: `yarn start`
- Tests: `yarn test`

License
-------
MIT (example). Update as needed.


