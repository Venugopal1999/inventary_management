/**
 * Capacitor Mobile Utilities
 * Handles platform detection, status bar, keyboard, and app lifecycle
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// ============================================
// PLATFORM DETECTION
// ============================================

export const isNative = () => Capacitor.isNativePlatform();
export const isAndroid = () => Capacitor.getPlatform() === 'android';
export const isIOS = () => Capacitor.getPlatform() === 'ios';
export const isWeb = () => Capacitor.getPlatform() === 'web';

// ============================================
// STATUS BAR
// ============================================

export const initStatusBar = async () => {
  if (!isNative()) return;

  try {
    // Set status bar style (light text for dark backgrounds)
    await StatusBar.setStyle({ style: Style.Light });

    // Set background color to match app theme
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#4F46E5' });
    }

    // Show status bar
    await StatusBar.show();
  } catch (error) {
    console.warn('StatusBar initialization failed:', error);
  }
};

export const setStatusBarLight = async () => {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#4F46E5' });
    }
  } catch (error) {
    console.warn('StatusBar setLight failed:', error);
  }
};

export const setStatusBarDark = async () => {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (isAndroid()) {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  } catch (error) {
    console.warn('StatusBar setDark failed:', error);
  }
};

export const hideStatusBar = async () => {
  if (!isNative()) return;
  try {
    await StatusBar.hide();
  } catch (error) {
    console.warn('StatusBar hide failed:', error);
  }
};

// ============================================
// SPLASH SCREEN
// ============================================

export const hideSplashScreen = async () => {
  if (!isNative()) return;
  try {
    await SplashScreen.hide();
  } catch (error) {
    console.warn('SplashScreen hide failed:', error);
  }
};

export const showSplashScreen = async () => {
  if (!isNative()) return;
  try {
    await SplashScreen.show({
      autoHide: false,
    });
  } catch (error) {
    console.warn('SplashScreen show failed:', error);
  }
};

// ============================================
// KEYBOARD
// ============================================

export const initKeyboard = async () => {
  if (!isNative()) return;

  try {
    // Configure keyboard behavior
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`);
      document.body.classList.add('keyboard-open');
    });

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px');
      document.body.classList.remove('keyboard-open');
    });
  } catch (error) {
    console.warn('Keyboard initialization failed:', error);
  }
};

export const hideKeyboard = async () => {
  if (!isNative()) return;
  try {
    await Keyboard.hide();
  } catch (error) {
    console.warn('Keyboard hide failed:', error);
  }
};

// ============================================
// HAPTICS (VIBRATION FEEDBACK)
// ============================================

export const hapticLight = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    // Haptics not available - fail silently
  }
};

export const hapticMedium = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    // Haptics not available - fail silently
  }
};

export const hapticHeavy = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    // Haptics not available - fail silently
  }
};

// ============================================
// APP LIFECYCLE
// ============================================

let backButtonListeners = [];

export const initAppLifecycle = async (onBackButton, onAppStateChange) => {
  if (!isNative()) return;

  try {
    // Handle hardware back button (Android)
    if (isAndroid()) {
      App.addListener('backButton', ({ canGoBack }) => {
        if (onBackButton) {
          onBackButton(canGoBack);
        } else if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });
    }

    // Handle app state changes (foreground/background)
    App.addListener('appStateChange', ({ isActive }) => {
      if (onAppStateChange) {
        onAppStateChange(isActive);
      }
    });

    // Handle app URL open (deep links)
    App.addListener('appUrlOpen', (event) => {
      console.log('App opened with URL:', event.url);
      // Handle deep linking here if needed
    });
  } catch (error) {
    console.warn('App lifecycle initialization failed:', error);
  }
};

export const exitApp = async () => {
  if (!isNative()) return;
  try {
    await App.exitApp();
  } catch (error) {
    console.warn('Exit app failed:', error);
  }
};

// ============================================
// FULL INITIALIZATION
// ============================================

export const initCapacitor = async (options = {}) => {
  const {
    onBackButton,
    onAppStateChange,
    statusBarStyle = 'light',
  } = options;

  if (!isNative()) {
    console.log('Running in web mode - Capacitor features disabled');
    return;
  }

  console.log(`Running on ${Capacitor.getPlatform()}`);

  // Initialize all native features
  await Promise.all([
    initStatusBar(),
    initKeyboard(),
    initAppLifecycle(onBackButton, onAppStateChange),
  ]);

  // Hide splash screen after initialization
  await hideSplashScreen();

  console.log('Capacitor initialized successfully');
};

export default {
  isNative,
  isAndroid,
  isIOS,
  isWeb,
  initCapacitor,
  initStatusBar,
  setStatusBarLight,
  setStatusBarDark,
  hideStatusBar,
  hideSplashScreen,
  showSplashScreen,
  initKeyboard,
  hideKeyboard,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  initAppLifecycle,
  exitApp,
};
