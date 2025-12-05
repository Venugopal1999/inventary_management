import axios from 'axios';
import { Capacitor } from '@capacitor/core';

/**
 * Determine the correct API base URL based on platform
 * - Web: Use environment variable or localhost
 * - Android Emulator: Use 10.0.2.2 (maps to host machine localhost)
 * - Android Device: Use your production URL or local network IP
 * - iOS Simulator: Use localhost
 * - iOS Device: Use your production URL or local network IP
 */
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Platform-specific defaults
  const platform = Capacitor.getPlatform();

  switch (platform) {
    case 'android':
      // 10.0.2.2 is Android emulator's alias for host machine localhost
      // For real devices, replace with your production URL or local network IP
      return 'http://10.0.2.2:8000/api';

    case 'ios':
      // iOS simulator can use localhost directly
      // For real devices, replace with your production URL or local network IP
      return 'http://localhost:8000/api';

    default:
      // Web browser
      return 'http://localhost:8000/api';
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Disable credentials - using token auth instead
  withCredentials: false,
  timeout: 30000, // 30 second timeout for slower mobile connections
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors gracefully on mobile
    if (!error.response) {
      console.error('Network error - check your connection');
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export helper to update base URL at runtime (useful for switching environments)
export const setApiBaseUrl = (url) => {
  api.defaults.baseURL = url;
};

export const getApiUrl = () => api.defaults.baseURL;

export default api;
