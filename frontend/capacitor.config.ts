import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.inventorymanager.app',
  appName: 'Inventory Manager',
  webDir: 'dist',

  // Server configuration for development
  server: {
    // For production, remove this block - the app will use bundled files
    // For development with live reload, uncomment:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true,

    androidScheme: 'https',
    allowNavigation: [
      'https://*.yourdomain.com',  // Your production API domain
      'http://localhost:8000',      // Local development
      'http://10.0.2.2:8000',       // Android emulator -> host machine
      'http://192.168.*.*:8000'     // Local network
    ]
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: '#4F46E5', // Indigo-600 to match your app theme
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'small',
      spinnerColor: '#FFFFFF',
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4F46E5'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: ''
    }
  },

  android: {
    allowMixedContent: true,  // Allow HTTP during development
    captureInput: true,
    webContentsDebuggingEnabled: true,  // Set to false for production

    // Gradle build settings
    buildOptions: {
      keystorePath: 'release-keystore.jks',
      keystoreAlias: 'inventory-manager',
    }
  }
};

export default config;
