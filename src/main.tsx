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
