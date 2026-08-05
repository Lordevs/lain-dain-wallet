import type { CapacitorConfig } from '@capacitor/cli';
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
} catch (e) {
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
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#FEFAF1',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    Keyboard: {
      // KeyboardResize.Body = "body" — only body element resizes, not the viewport
      // Only applies on iOS; Android handles it via resizeOnFullScreen
      resize: 'body' as any,
      // KeyboardStyle.Light = "LIGHT"
      style: 'LIGHT' as any,
      // Android: workaround for resize not working when StatusBar overlays the WebView
      resizeOnFullScreen: true,
      // iOS v8: tint the area behind keyboard to match app background automatically
      autoBackdropColor: 'auto' as any,
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
