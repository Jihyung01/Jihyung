import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'

interface FloatingToolbarProps {
  visible?: boolean
  children?: React.ReactNode
}

export function FloatingToolbar({ visible = false, children }: FloatingToolbarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="fixed top-4 right-4 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg z-50"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}