import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Base path for Capacitor - must be empty for file:// protocol
  base: '',

  build: {
    // Output directory matching capacitor.config.ts webDir
    outDir: 'dist',

    // Generate source maps for debugging (disable for production)
    sourcemap: true,

    // Ensure assets use relative paths for Capacitor
    assetsDir: 'assets',

    rollupOptions: {
      output: {
        // Ensure consistent chunk naming
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          axios: ['axios']
        }
      }
    }
  },

  // Development server settings
  server: {
    host: true, // Expose to network for mobile testing
    port: 5173,
    strictPort: true
  }
})
