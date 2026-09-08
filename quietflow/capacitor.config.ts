import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.quietflow.mobile',
  appName: 'QuietFlow',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 300,
      backgroundColor: '#0a0910',
    },
  },
};

export default config;
