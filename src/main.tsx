import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./index.css"

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

// Ensure File constructor is properly available
if (typeof window !== 'undefined' && !window.File) {
  console.warn('File constructor not available')
}

createRoot(root).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <App />
  </ErrorBoundary>
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, prompt user to refresh
                if (confirm('새 버전이 있습니다. 업데이트하시겠습니까?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });

        // Handle controller change
        registration.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });

  // Handle messages from Service Worker
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLAIM_CLIENTS' });
  }

  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Message from Service Worker:', event.data);
  });
}
