import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, FastForward, Rewind, Pause } from 'lucide-react'

interface TimeState {
  currentTime: Date
  timeFlow: number
  dimension: 'past' | 'present' | 'future'
  quantumTime: boolean
}

interface TimeManipulationInterfaceProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const TimeManipulationInterface: React.FC<TimeManipulationInterfaceProps> = ({ isOpen = true, onClose }) => {
  const [timeState, setTimeState] = useState<TimeState>({
    currentTime: new Date(),
    timeFlow: 1,
    dimension: 'present',
    quantumTime: false
  })

  const manipulateTime = (direction: 'forward' | 'backward' | 'pause') => {
    setTimeState(prev => {
      let newFlow = prev.timeFlow
      let newDimension = prev.dimension
      
      switch (direction) {
        case 'forward':
          newFlow = Math.min(prev.timeFlow * 2, 16)
          newDimension = 'future'
          break
        case 'backward':
          newFlow = Math.max(prev.timeFlow / 2, 0.125)
          newDimension = 'past'
          break
        case 'pause':
          newFlow = 0
          newDimension = 'present'
          break
      }
      
      return {
        ...prev,
        timeFlow: newFlow,
        dimension: newDimension,
        quantumTime: Math.abs(newFlow - 1) > 4
      }
    })
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (timeState.timeFlow !== 0) {
        setTimeState(prev => ({
          ...prev,
          currentTime: new Date(prev.currentTime.getTime() + (1000 * prev.timeFlow))
        }))
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [timeState.timeFlow])

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-2xl border border-blue-500/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-8 w-8 text-blue-400" />
        <h2 className="text-2xl font-bold text-blue-100">시간 조작 인터페이스</h2>
      </div>
      
      <div className="space-y-6">
        <div className="text-center p-6 bg-blue-800/20 rounded-lg">
          <div className="text-sm text-blue-300 mb-2">현재 시간</div>
          <div className="text-3xl font-mono text-blue-100">
            {timeState.currentTime.toLocaleTimeString()}
          </div>
          <div className="text-lg text-blue-200 mt-2">
            {timeState.currentTime.toLocaleDateString()}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-cyan-800/20 rounded-lg text-center">
            <div className="text-sm text-cyan-300">시간 흐름</div>
            <div className="text-2xl font-bold text-cyan-100">{timeState.timeFlow}x</div>
          </div>
          
          <div className="p-4 bg-teal-800/20 rounded-lg text-center">
            <div className="text-sm text-teal-300">차원</div>
            <div className="text-lg font-bold text-teal-100 capitalize">{timeState.dimension}</div>
          </div>
          
          <div className="p-4 bg-indigo-800/20 rounded-lg text-center">
            <div className="text-sm text-indigo-300">양자 시간</div>
            <div className="text-lg font-bold text-indigo-100">
              {timeState.quantumTime ? '활성' : '비활성'}
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          <motion.button
            onClick={() => manipulateTime('backward')}
            className="p-3 bg-orange-600 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Rewind className="h-6 w-6 text-white" />
          </motion.button>
          
          <motion.button
            onClick={() => manipulateTime('pause')}
            className="p-3 bg-red-600 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Pause className="h-6 w-6 text-white" />
          </motion.button>
          
          <motion.button
            onClick={() => manipulateTime('forward')}
            className="p-3 bg-green-600 rounded-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FastForward className="h-6 w-6 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
