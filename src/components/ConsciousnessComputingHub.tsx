import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConsciousnessComputingHubProps {
  isOpen: boolean
  onClose: () => void
}

export function ConsciousnessComputingHub({ isOpen, onClose }: ConsciousnessComputingHubProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Consciousness Computing Hub
              </h2>
              <p className="text-gray-300 text-lg">
                Advanced neural processing interface for consciousness expansion and quantum computing integration.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                  <div className="text-purple-400 font-semibold mb-2">Neural Networks</div>
                  <div className="text-2xl font-bold text-white">42 Active</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 border border-blue-500/20">
                  <div className="text-blue-400 font-semibold mb-2">Quantum States</div>
                  <div className="text-2xl font-bold text-white">∞ Entangled</div>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:scale-105 transition-all duration-200"
              >
                Close Hub
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConsciousnessComputingHub
