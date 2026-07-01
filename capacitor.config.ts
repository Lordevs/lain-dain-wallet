import type { CapacitorConfig } from '@capacitor/cli';

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
  // server: {
  //   url: 'http://192.168.1.19:5173', // Point to your active Vite dev server
  //   cleartext: true               // Enables loading http pages in native wrappers
  // }
};

export default config;
