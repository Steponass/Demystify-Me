import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import '@styles/css-reset.css'
import '@styles/fonts.css'
import '@styles/variables.css'
import '@styles/globals.css'

const registerServiceWorker = async () => {
  // Only register in production and if the browser supports Service Workers
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);
      
      // Listen for updates to the Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, could show a notification if necessary
            console.log('New content available! Please refresh.');
          }
        });
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

registerServiceWorker();