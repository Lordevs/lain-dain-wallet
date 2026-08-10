import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import fs from 'fs';
import path from 'path';

// Load .env file variables manually into process.env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !key.startsWith('#') && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    });
  }
} catch {
  // Ignore env loading errors
}

const config: CapacitorConfig = {
  appId: 'com.laindain.wallet',
  appName: 'Lain Dain Wallet',
  webDir: 'dist',
  server: {
    // Capacitor 7+ defaults this to 'https', which serves the app's own
    // WebView at https://localhost — Chromium's Mixed Content policy then
    // blocks any plain-http:// API call outright (before CORS or the
    // debug network-security-config's cleartext allowance even apply).
    // 'http://localhost' is still treated as a secure context by Chromium
    // (the platform specifically trusts the literal 'localhost' hostname
    // regardless of scheme), so this doesn't lose anything — and it's
    // safe for a real https:// production backend too, since Mixed
    // Content only ever blocks https-page-fetches-http, never the
    // reverse.
    androidScheme: 'http',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#FEFAF1',
      overlaysWebView: false,
    },
    SplashScreen: {
      // iOS does not have Android 12's separate OS-managed splash phase.
      // A zero duration therefore removes the configured launch image as soon
      // as Capacitor starts. Keep it briefly while the WebView initializes.
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#FEFAF1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Keyboard: {
      // Resize the native WKWebView instead of mutating document.body. Body
      // resizing races fixed overlays/drawers during the iOS keyboard animation
      // and can leave their visual and hit-test coordinate spaces out of sync.
      resize: KeyboardResize.Native,
      // KeyboardStyle.Light = "LIGHT"
      style: KeyboardStyle.Light,
      // Android: workaround for resize not working when StatusBar overlays the WebView
      resizeOnFullScreen: true,
      // iOS v8: tint the area behind keyboard to match app background automatically
      autoBackdropColor: 'auto',
    },
  },
};

// Gate the committed LAN dev-server URL for development live reload only
if (process.env.CAPACITOR_LIVE_RELOAD === 'true') {
  config.server = {
    ...config.server,                // keep androidScheme set above
    url: process.env.CAPACITOR_DEV_SERVER_URL, // Point to your active Vite dev server
    cleartext: true                  // Enables loading http pages in native wrappers
  };
}

export default config;
