import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.uah.sgapro',
  appName: 'SGA Pro',
  webDir: 'dist/sga-fin/browser',
  server: {
    hostname: 'sga-pro.uah.cl',
    androidScheme: 'https'
  }
};

export default config;
