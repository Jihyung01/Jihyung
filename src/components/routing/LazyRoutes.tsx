import React, { Suspense, lazy } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { motion } from 'framer-motion'

// Lazy load components for code splitting
const DashboardView = lazy(() => import('../DashboardView-UltraModern'))
const NotesPage = lazy(() => import('../pages/NotesPage-UltraModern'))
const TasksPage = lazy(() => import('../pages/TasksPage-UltraModern'))
const CalendarPage = lazy(() => import('../pages/CalendarPage-UltraModern-Enhanced'))
const CollaborationPage = lazy(() => import('../pages/CollaborationPage').then(module => ({ default: module.CollaborationPage })))

// Loading component
const LoadingSpinner = ({ message = '로딩중...' }: { message?: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-l-indigo-500 rounded-full animate-pulse mx-auto"></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">JIHYUNG</h3>
      <p className="text-sm text-gray-500">{message}</p>
    </motion.div>
  </div>
)

// Error fallback
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center max-w-md"
    >
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
      <p className="text-gray-600 mb-4">페이지를 불러오는 중 문제가 발생했습니다.</p>
      <button
        onClick={resetErrorBoundary}
        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
      >
        다시 시도
      </button>
    </motion.div>
  </div>
)

// Wrapper component with error boundary and suspense
export const LazyRoute: React.FC<{ children: React.ReactNode; loadingMessage?: string }> = ({
  children,
  loadingMessage
}) => (
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <Suspense fallback={<LoadingSpinner message={loadingMessage} />}>
      {children}
    </Suspense>
  </ErrorBoundary>
)

// Pre-configured lazy routes
export const LazyDashboard = () => (
  <LazyRoute loadingMessage="대시보드 로딩중...">
    <DashboardView />
  </LazyRoute>
)

export const LazyNotes = () => (
  <LazyRoute loadingMessage="노트 페이지 로딩중...">
    <NotesPage />
  </LazyRoute>
)

export const LazyTasks = () => (
  <LazyRoute loadingMessage="태스크 페이지 로딩중...">
    <TasksPage />
  </LazyRoute>
)

export const LazyCalendar = () => (
  <LazyRoute loadingMessage="캘린더 로딩중...">
    <CalendarPage />
  </LazyRoute>
)

export const LazyCollaboration = () => (
  <LazyRoute loadingMessage="협업 페이지 로딩중...">
    <CollaborationPage />
  </LazyRoute>
)