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
  },
};

// Gate the committed LAN dev-server URL for development live reload only
if (process.env.CAPACITOR_LIVE_RELOAD === 'true') {
  config.server = {
    url: process.env.CAPACITOR_DEV_SERVER_URL, // Point to your active Vite dev server
    cleartext: true                  // Enables loading http pages in native wrappers
  };
}

export default config;
