import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.beacon.sos',
  appName: 'Timet',
  webDir: 'dist',
  bundledWebRuntime: false,
  backgroundColor: '#08120f',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#08120f',
      showSpinner: false,
    },
  },
};

export default config;
