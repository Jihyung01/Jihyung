import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Timer, Lightning, Pause, Rewind, FastForward, Infinity, 
  Spiral, Atom, Target, Brain, Heart, Crown
} from '@phosphor-icons/react'

// 초월적 시간 조작 인터페이스 - 시공간을 지배하는 궁극의 힘
export const TimeManipulationInterface: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [timeState, setTimeState] = useState({
    currentTime: Date.now(),
    timeFlow: 1.0, // 정상 시간 흐름
    timeDirection: 'forward',
    temporalStability: 98.7,
    chronoEnergy: 85.4,
    paradoxRisk: 12.3,
    timelineIntegrity: 99.1,
    quantumTunnelActive: false,
    timeVortexOpen: false,
    causalLoopDetected: false,
    temporalAnomalies: 3,
    timelineVariants: 847,
    dimensionalRifts: 2,
    pastConnections: 156,
    futureConnections: 89,
    alternateTimelines: 2847
  })

  const [timeControls] = useState([
    { id: 'pause', name: 'Pause Time', icon: Pause, risk: 'Low', energy: 20 },
    { id: 'slow', name: 'Slow Motion', icon: Rewind, risk: 'Low', energy: 35 },
    { id: 'fast', name: 'Time Acceleration', icon: FastForward, risk: 'Medium', energy: 50 },
    { id: 'reverse', name: 'Reverse Time', icon: Timer, risk: 'High', energy: 85 },
    { id: 'jump', name: 'Time Jump', icon: Lightning, risk: 'Extreme', energy: 95 },
    { id: 'loop', name: 'Time Loop', icon: Infinity, risk: 'Paradox', energy: 100 },
    { id: 'split', name: 'Timeline Split', icon: Spiral, risk: 'Reality', energy: 150 },
    { id: 'merge', name: 'Timeline Merge', icon: Atom, risk: 'Universe', energy: 200 }
  ])

  const [temporalEvents] = useState([
    { time: '2024-01-15 14:30', type: 'Timeline Created', effect: 'Reality Branch Alpha-7', status: 'Stable' },
    { time: '2024-01-15 15:45', type: 'Paradox Avoided', effect: 'Causal Loop Resolved', status: 'Safe' },
    { time: '2024-01-15 16:20', type: 'Future Echo', effect: 'Probability Wave Collapse', status: 'Monitored' },
    { time: '2024-01-15 17:10', type: 'Past Intervention', effect: 'Butterfly Effect Contained', status: 'Controlled' },
    { time: '2024-01-15 18:05', type: 'Dimensional Rift', effect: 'Multiverse Leak Sealed', status: 'Critical' },
    { time: '2024-01-15 19:30', type: 'Time Vortex', effect: 'Chronoton Storm', status: 'Warning' },
    { time: '2024-01-15 20:15', type: 'Reality Anchor', effect: 'Timeline Stabilized', status: 'Secure' },
    { time: '2024-01-15 21:45', type: 'Quantum Echo', effect: 'Probability Shifted', status: 'Active' }
  ])

  const [manipulationActive, setManipulationActive] = useState(false)
  const [selectedControl, setSelectedControl] = useState<string | null>(null)

  const executeTimeManipulation = async (controlId: string) => {
    setManipulationActive(true)
    setSelectedControl(controlId)
    
    const control = timeControls.find(c => c.id === controlId)
    if (!control) return

    // 시간 조작 시뮬레이션
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 150))
      
      setTimeState(prev => {
        const newState = { ...prev }
        
        switch (controlId) {
          case 'pause':
            newState.timeFlow = Math.max(0, 1 - (i / 100))
            break
          case 'slow':
            newState.timeFlow = Math.max(0.1, 1 - (i / 200))
            break
          case 'fast':
            newState.timeFlow = 1 + (i / 50)
            break
          case 'reverse':
            newState.timeDirection = i > 50 ? 'backward' : 'forward'
            newState.timeFlow = i > 50 ? -(i - 50) / 50 : 1
            break
          case 'jump':
            newState.currentTime = prev.currentTime + (Math.random() * 86400000)
            newState.temporalAnomalies = prev.temporalAnomalies + 1
            break
          case 'loop':
            newState.causalLoopDetected = i > 70
            newState.paradoxRisk = Math.min(100, prev.paradoxRisk + i / 10)
            break
          case 'split':
            newState.timelineVariants = prev.timelineVariants + Math.floor(i / 10)
            newState.dimensionalRifts = prev.dimensionalRifts + (i > 80 ? 1 : 0)
            break
          case 'merge':
            newState.alternateTimelines = Math.max(1, prev.alternateTimelines - Math.floor(i / 5))
            newState.timelineIntegrity = Math.min(100, prev.timelineIntegrity + i / 200)
            break
        }
        
        newState.chronoEnergy = Math.max(0, prev.chronoEnergy - control.energy / 100 * (i / 100))
        newState.temporalStability = Math.max(50, prev.temporalStability - (control.energy / 1000 * i))
        
        return newState
      })
    }
    
    setManipulationActive(false)
    setSelectedControl(null)
    toast.success(`Time Manipulation Complete: ${control.name}`)
  }

  const stabilizeTimeline = () => {
    setTimeState(prev => ({
      ...prev,
      timeFlow: 1.0,
      timeDirection: 'forward',
      temporalStability: Math.min(100, prev.temporalStability + 10),
      paradoxRisk: Math.max(0, prev.paradoxRisk - 20),
      causalLoopDetected: false,
      quantumTunnelActive: false,
      timeVortexOpen: false
    }))
    toast.success('Timeline Stabilized - Reality Secured')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-indigo-900/95 to-purple-900/95 backdrop-blur-lg z-50"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-7xl bg-black/30 backdrop-blur-sm rounded-3xl border border-indigo-500/30 p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ⏰ TIME MANIPULATION CONTROL CENTER ⏰
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Lightning className="w-6 h-6 text-red-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 시간 조작 제어판 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 시간 상태 모니터 */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-blue-300 mb-6 flex items-center">
                  <Timer className="w-8 h-8 mr-3" />
                  Temporal Status Monitor
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Time Flow Rate</span>
                      <span className={`font-bold text-xl ${timeState.timeFlow === 1 ? 'text-green-400' : timeState.timeFlow > 1 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {timeState.timeFlow.toFixed(1)}x
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">Direction: {timeState.timeDirection}</div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Temporal Stability</span>
                      <span className="text-green-400 font-bold text-xl">{timeState.temporalStability.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${timeState.temporalStability}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Chrono Energy</span>
                      <span className="text-cyan-400 font-bold text-xl">{timeState.chronoEnergy.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${timeState.chronoEnergy}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Paradox Risk</span>
                      <span className="text-red-400 font-bold text-xl">{timeState.paradoxRisk.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: `${timeState.paradoxRisk}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 시간 조작 컨트롤 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Lightning className="w-8 h-8 mr-3" />
                  Temporal Manipulation Controls
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {timeControls.map((control) => (
                    <motion.button
                      key={control.id}
                      onClick={() => executeTimeManipulation(control.id)}
                      disabled={manipulationActive || timeState.chronoEnergy < control.energy}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        selectedControl === control.id
                          ? 'bg-purple-600/50 border-purple-400'
                          : timeState.chronoEnergy < control.energy
                          ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-black/30 border-purple-500/30 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <control.icon className="w-6 h-6 text-purple-400" />
                        <span className="text-white font-semibold">{control.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        Risk: <span className={`font-medium ${
                          control.risk === 'Low' ? 'text-green-400' :
                          control.risk === 'Medium' ? 'text-yellow-400' :
                          control.risk === 'High' ? 'text-orange-400' :
                          'text-red-400'
                        }`}>{control.risk}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Energy Required: <span className="text-cyan-400">{control.energy}%</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={stabilizeTimeline}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Stabilize Timeline
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
                    Emergency Reset
                  </button>
                </div>
              </div>
            </div>

            {/* 시간 시각화 및 제어 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Temporal Visualization</h3>
                <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-32 h-32 border-2 border-indigo-500 rounded-full"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24 border-2 border-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-50"
                  />
                  <div className="text-center z-10">
                    <Timer className="w-8 h-8 text-white mx-auto mb-2" />
                    <div className="text-sm text-gray-300">Time Control</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-violet-300 mb-4">Timeline Status</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Current Timeline</span>
                    <span className="text-green-400">Prime Alpha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Timeline Integrity</span>
                    <span className="text-blue-400">{timeState.timelineIntegrity.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Past Connections</span>
                    <span className="text-purple-400">{timeState.pastConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Future Connections</span>
                    <span className="text-cyan-400">{timeState.futureConnections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Alternate Timelines</span>
                    <span className="text-yellow-400">{timeState.alternateTimelines.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-pink-300 mb-4">Causal Warnings</h3>
                <div className="space-y-2">
                  {timeState.causalLoopDetected && (
                    <div className="bg-red-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Lightning className="w-4 h-4 text-red-400" />
                        <span className="text-red-300 text-sm font-medium">Causal Loop Detected</span>
                      </div>
                    </div>
                  )}
                  {timeState.quantumTunnelActive && (
                    <div className="bg-purple-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Atom className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm font-medium">Quantum Tunnel Active</span>
                      </div>
                    </div>
                  )}
                  {timeState.timeVortexOpen && (
                    <div className="bg-blue-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Spiral className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-300 text-sm font-medium">Time Vortex Open</span>
                      </div>
                    </div>
                  )}
                  {timeState.paradoxRisk > 50 && (
                    <div className="bg-yellow-500/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-300 text-sm font-medium">High Paradox Risk</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
