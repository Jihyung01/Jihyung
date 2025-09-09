import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";


import SuperApp from './App-SuperEnhanced.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <SuperApp />
  {/* <Toaster position="top-right" /> */}
  </ErrorBoundary>
)
