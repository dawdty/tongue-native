# Tongue Native

Expo React Native client for Tongue.

## Run

```bash
npm install
npm start
```

The app calls the existing server at `http://localhost:3000` by default. When
running on a physical device, set `EXPO_PUBLIC_API_URL` to the computer's LAN
address instead, for example:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000 npm start
```

The native client supports language/scenario inputs, PDF/image OCR uploads, and
Realtime voice through the existing `/session` endpoint. Voice requires a custom
development build because `react-native-webrtc` cannot run in Expo Go:

```bash
npx expo run:ios
# or
npx expo run:android
```
