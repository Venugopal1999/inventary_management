/**
 * Cross-platform Storage Utility
 * Uses Capacitor Preferences on native, localStorage on web
 */

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = () => Capacitor.isNativePlatform();

// ============================================
// BASIC OPERATIONS
// ============================================

/**
 * Store a value
 */
export const setItem = async (key, value) => {
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

  if (isNative()) {
    await Preferences.set({ key, value: stringValue });
  } else {
    localStorage.setItem(key, stringValue);
  }
};

/**
 * Retrieve a value
 */
export const getItem = async (key) => {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
};

/**
 * Retrieve and parse JSON value
 */
export const getJSON = async (key) => {
  const value = await getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/**
 * Remove a value
 */
export const removeItem = async (key) => {
  if (isNative()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
};

/**
 * Clear all storage
 */
export const clear = async () => {
  if (isNative()) {
    await Preferences.clear();
  } else {
    localStorage.clear();
  }
};

/**
 * Get all keys
 */
export const keys = async () => {
  if (isNative()) {
    const { keys } = await Preferences.keys();
    return keys;
  } else {
    return Object.keys(localStorage);
  }
};

// ============================================
// AUTH TOKEN HELPERS
// ============================================

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';

/**
 * Store auth token
 */
export const setAuthToken = async (token) => {
  await setItem(AUTH_TOKEN_KEY, token);
};

/**
 * Get auth token
 */
export const getAuthToken = async () => {
  return await getItem(AUTH_TOKEN_KEY);
};

/**
 * Remove auth token
 */
export const removeAuthToken = async () => {
  await removeItem(AUTH_TOKEN_KEY);
};

/**
 * Store user data
 */
export const setUserData = async (userData) => {
  await setItem(USER_DATA_KEY, userData);
};

/**
 * Get user data
 */
export const getUserData = async () => {
  return await getJSON(USER_DATA_KEY);
};

/**
 * Clear auth data
 */
export const clearAuth = async () => {
  await removeItem(AUTH_TOKEN_KEY);
  await removeItem(USER_DATA_KEY);
};

// ============================================
// SYNC WRAPPERS (for compatibility with existing code)
// ============================================

/**
 * Synchronous localStorage wrapper for backwards compatibility
 * Use async versions when possible
 */
export const syncStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  },
  removeItem: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

export default {
  setItem,
  getItem,
  getJSON,
  removeItem,
  clear,
  keys,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setUserData,
  getUserData,
  clearAuth,
  syncStorage,
};
