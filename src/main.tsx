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

// Service Worker temporarily disabled to fix deployment issues
// Will be re-enabled after resolving MIME type and caching conflicts
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}
*/
