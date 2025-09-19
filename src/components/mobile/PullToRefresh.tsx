import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ArrowDown } from 'lucide-react'
import { usePullToRefresh } from '../../hooks/useMobileGestures'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  className?: string
  threshold?: number
  isEnabled?: boolean
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  threshold = 80,
  isEnabled = true
}) => {
  const { ref, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh,
    threshold,
    isEnabled
  })

  const refreshThreshold = threshold * 0.8
  const isReady = pullDistance > refreshThreshold

  return (
    <div
      ref={ref}
      className={`relative overflow-auto ${className}`}
      style={{
        paddingTop: isRefreshing ? 60 : Math.min(pullDistance, 60)
      }}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center h-16 bg-gradient-to-b from-blue-50 to-transparent"
          >
            <div className="flex items-center gap-3 text-blue-600">
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">새로고침 중...</span>
                </>
              ) : isReady ? (
                <>
                  <motion.div
                    animate={{ rotate: 180 }}
                    className="text-green-600"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </motion.div>
                  <span className="text-sm font-medium text-green-600">놓으면 새로고침</span>
                </>
              ) : (
                <>
                  <ArrowDown className="w-5 h-5" />
                  <span className="text-sm font-medium">아래로 당겨서 새로고침</span>
                </>
              )}
            </div>

            {/* Progress indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                style={{
                  width: `${Math.min((pullDistance / threshold) * 100, 100)}%`
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <motion.div
        animate={{
          y: isRefreshing ? 0 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </div>
  )
}