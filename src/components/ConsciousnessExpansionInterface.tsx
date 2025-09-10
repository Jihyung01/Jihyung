import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Sparkles, Atom } from 'lucide-react'

interface ConsciousnessState {
  level: number
  dimensions: number
  quantumEntanglement: boolean
  awareness: number
}

export const ConsciousnessExpansionInterface: React.FC = () => {
  const [consciousness, setConsciousness] = useState<ConsciousnessState>({
    level: 1,
    dimensions: 3,
    quantumEntanglement: false,
    awareness: 0.1
  })

  const expandConsciousness = () => {
    setConsciousness(prev => ({
      ...prev,
      level: Math.min(prev.level + 1, 11),
      dimensions: Math.min(prev.dimensions + 1, 26),
      awareness: Math.min(prev.awareness + 0.1, 1.0),
      quantumEntanglement: prev.level > 5
    }))
  }

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-purple-900/20 to-indigo-900/20 rounded-2xl border border-purple-500/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-purple-400" />
        <h2 className="text-2xl font-bold text-purple-100">의식 확장 인터페이스</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-purple-800/20 rounded-lg">
            <label className="text-sm text-purple-300">의식 레벨</label>
            <div className="text-3xl font-bold text-purple-100">{consciousness.level}/11</div>
          </div>
          
          <div className="p-4 bg-indigo-800/20 rounded-lg">
            <label className="text-sm text-indigo-300">차원 접근</label>
            <div className="text-3xl font-bold text-indigo-100">{consciousness.dimensions}D</div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-violet-800/20 rounded-lg">
            <label className="text-sm text-violet-300">양자 얽힘</label>
            <div className="text-lg font-bold text-violet-100">
              {consciousness.quantumEntanglement ? '활성' : '비활성'}
            </div>
          </div>
          
          <div className="p-4 bg-pink-800/20 rounded-lg">
            <label className="text-sm text-pink-300">각성도</label>
            <div className="text-2xl font-bold text-pink-100">
              {(consciousness.awareness * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
      
      <motion.button
        onClick={expandConsciousness}
        className="w-full mt-6 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg font-bold text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={consciousness.level >= 11}
      >
        <Sparkles className="inline mr-2" />
        의식 확장
      </motion.button>
    </motion.div>
  )
}
