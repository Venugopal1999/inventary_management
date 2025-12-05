import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initCapacitor } from './utils/capacitor'

// Initialize Capacitor for native mobile features
initCapacitor({
  onBackButton: (canGoBack) => {
    if (canGoBack) {
      window.history.back();
    }
    // Don't exit app on back button - let user navigate
  },
  onAppStateChange: (isActive) => {
    if (isActive) {
      console.log('App resumed');
      // Optionally refresh data when app comes to foreground
    } else {
      console.log('App paused');
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
