import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Atom, Zap, Settings } from 'lucide-react'

interface RealityState {
  dimension: number
  stability: number
  quantumField: boolean
  manipulationLevel: number
}

interface RealityManipulationSystemProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const RealityManipulationSystem: React.FC<RealityManipulationSystemProps> = ({ isOpen = true, onClose }) => {
  const [reality, setReality] = useState<RealityState>({
    dimension: 3,
    stability: 100,
    quantumField: false,
    manipulationLevel: 0
  })

  const manipulateReality = (type: 'dimension' | 'quantum' | 'stability') => {
    setReality(prev => {
      switch (type) {
        case 'dimension':
          return {
            ...prev,
            dimension: prev.dimension < 11 ? prev.dimension + 1 : prev.dimension,
            stability: Math.max(prev.stability - 10, 0)
          }
        case 'quantum':
          return {
            ...prev,
            quantumField: !prev.quantumField,
            stability: prev.quantumField ? prev.stability + 20 : prev.stability - 20
          }
        case 'stability':
          return {
            ...prev,
            stability: Math.min(prev.stability + 10, 100)
          }
        default:
          return prev
      }
    })
  }

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-2xl border border-red-500/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Atom className="h-8 w-8 text-red-400" />
        <h2 className="text-2xl font-bold text-red-100">현실 조작 시스템</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-red-800/20 rounded-lg">
            <label className="text-sm text-red-300">차원 레벨</label>
            <div className="text-3xl font-bold text-red-100">{reality.dimension}D</div>
          </div>
          
          <div className="p-4 bg-orange-800/20 rounded-lg">
            <label className="text-sm text-orange-300">안정성</label>
            <div className="text-3xl font-bold text-orange-100">{reality.stability}%</div>
            <div className="w-full bg-orange-900/30 rounded-full h-2 mt-2">
              <div 
                className="bg-orange-400 h-2 rounded-full transition-all"
                style={{ width: `${reality.stability}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-yellow-800/20 rounded-lg">
            <label className="text-sm text-yellow-300">양자 필드</label>
            <div className="text-lg font-bold text-yellow-100">
              {reality.quantumField ? '활성화됨' : '비활성화됨'}
            </div>
          </div>
          
          <div className="p-4 bg-pink-800/20 rounded-lg">
            <label className="text-sm text-pink-300">조작 레벨</label>
            <div className="text-2xl font-bold text-pink-100">
              {reality.manipulationLevel}
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <motion.button
          onClick={() => manipulateReality('dimension')}
          className="p-4 bg-gradient-to-r from-red-600 to-red-500 rounded-lg font-bold text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={reality.dimension >= 11}
        >
          <Zap className="inline mr-2" />
          차원 확장
        </motion.button>
        
        <motion.button
          onClick={() => manipulateReality('quantum')}
          className="p-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg font-bold text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Atom className="inline mr-2" />
          양자 토글
        </motion.button>
        
        <motion.button
          onClick={() => manipulateReality('stability')}
          className="p-4 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg font-bold text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={reality.stability >= 100}
        >
          <Settings className="inline mr-2" />
          안정화
        </motion.button>
      </div>
    </motion.div>
  )
}
