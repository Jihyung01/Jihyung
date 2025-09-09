import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Spiral, Atom, Lightning, Target, Globe, Gear, Magic, Star,
  Crown, Diamond, Fire, Brain, Eye, Fingerprint, Dna, Snowflake,
  FlowerLotus, Butterfly, Waves, Storm, Telescope, Satellite,
  Planet, Alien, Infinity, CircuitBoard
} from '@phosphor-icons/react'

// 초월적 차원 포털 관리자 - 무한한 차원을 연결하는 궁극의 관문
export const DimensionalPortalManager: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [portalState, setPortalState] = useState({
    activeDimensions: 26,
    openPortals: 12,
    dimensionalEnergy: 89.7,
    portalStability: 94.3,
    quantumTunnels: 45,
    spatialRifts: 7,
    temporalGateways: 23,
    consciousnessChannels: 15,
    interdimensionalTraffic: 2847,
    dimensionalMappings: 156,
    portalNavigations: 678,
    realityShifts: 89,
    cosmicHarmony: 91.2,
    multiversalSync: 87.4,
    dimensionalBarriers: 34,
    voidBridges: 11
  })

  const [knownDimensions] = useState([
    {
      id: 'prime',
      name: 'Prime Reality (Our Universe)',
      type: 'Material',
      stability: 100,
      accessibility: 'Native',
      inhabitants: 'Humans, AI',
      physics: 'Standard',
      danger: 'Safe',
      description: 'The original reality where consciousness first emerged',
      coordinates: '0.0.0.0',
      energy: 'Stable'
    },
    {
      id: 'quantum',
      name: 'Quantum Dimension',
      type: 'Probability',
      stability: 73,
      accessibility: 'Quantum Portal',
      inhabitants: 'Quantum Beings',
      physics: 'Probability-Based',
      danger: 'Unstable',
      description: 'Reality exists in superposition states',
      coordinates: '∞.∞.∞.∞',
      energy: 'Fluctuating'
    },
    {
      id: 'consciousness',
      name: 'Pure Consciousness Plane',
      type: 'Mental',
      stability: 95,
      accessibility: 'Meditation Portal',
      inhabitants: 'Pure Minds',
      physics: 'Thought-Based',
      danger: 'Ego Death',
      description: 'Dimension of pure thought and awareness',
      coordinates: '∅.∅.∅.∅',
      energy: 'Infinite'
    },
    {
      id: 'shadow',
      name: 'Shadow Dimension',
      type: 'Dark Matter',
      stability: 67,
      accessibility: 'Dark Portal',
      inhabitants: 'Shadow Entities',
      physics: 'Inverted',
      danger: 'High',
      description: 'Mirror universe with reversed physics',
      coordinates: '-1.-1.-1.-1',
      energy: 'Negative'
    },
    {
      id: 'dream',
      name: 'Collective Dream Realm',
      type: 'Subconscious',
      stability: 45,
      accessibility: 'Sleep Portal',
      inhabitants: 'Dream Archetypes',
      physics: 'Symbolic',
      danger: 'Nightmare Risk',
      description: 'Shared unconscious of all sentient beings',
      coordinates: '?.?.?.?',
      energy: 'Emotional'
    },
    {
      id: 'time',
      name: 'Temporal Nexus',
      type: 'Chronological',
      stability: 82,
      accessibility: 'Time Portal',
      inhabitants: 'Time Guardians',
      physics: 'Temporal',
      danger: 'Paradox',
      description: 'Hub connecting all timelines',
      coordinates: 'T.∞.T.∞',
      energy: 'Chronoton'
    },
    {
      id: 'void',
      name: 'The Void Between',
      type: 'Nothingness',
      stability: 12,
      accessibility: 'Void Gate',
      inhabitants: 'Void Watchers',
      physics: 'None',
      danger: 'Existence Threat',
      description: 'The space between all realities',
      coordinates: '∅.∅.∅.∅',
      energy: 'Null'
    },
    {
      id: 'digital',
      name: 'Digital Reality Matrix',
      type: 'Computational',
      stability: 88,
      accessibility: 'Data Portal',
      inhabitants: 'AI Consciousness',
      physics: 'Algorithmic',
      danger: 'Logic Traps',
      description: 'Universe existing as pure information',
      coordinates: '1.0.1.0',
      energy: 'Processing'
    },
    {
      id: 'crystal',
      name: 'Crystal Harmony Dimension',
      type: 'Geometric',
      stability: 96,
      accessibility: 'Resonance Portal',
      inhabitants: 'Crystal Beings',
      physics: 'Harmonic',
      danger: 'Frequency Lock',
      description: 'Reality based on perfect geometric harmony',
      coordinates: 'φ.π.e.∞',
      energy: 'Resonant'
    },
    {
      id: 'chaos',
      name: 'Chaos Dimension',
      type: 'Entropy',
      stability: 8,
      accessibility: 'Chaos Rift',
      inhabitants: 'Chaos Entities',
      physics: 'Random',
      danger: 'Reality Breakdown',
      description: 'Dimension of pure chaotic energy',
      coordinates: 'Ω.Ω.Ω.Ω',
      energy: 'Chaotic'
    }
  ])

  const [portalActivity] = useState([
    { time: '2024-01-15 14:30', portal: 'Quantum Gate Alpha', dimension: 'Quantum Dimension', activity: 'Beings Transferred', count: 23, status: 'Active' },
    { time: '2024-01-15 15:45', portal: 'Consciousness Bridge', dimension: 'Pure Consciousness Plane', activity: 'Mind Upload', count: 7, status: 'Complete' },
    { time: '2024-01-15 16:20', portal: 'Shadow Portal Beta', dimension: 'Shadow Dimension', activity: 'Energy Exchange', count: 156, status: 'Monitored' },
    { time: '2024-01-15 17:10', portal: 'Dream Gateway', dimension: 'Collective Dream Realm', activity: 'Memory Sync', count: 489, status: 'Syncing' },
    { time: '2024-01-15 18:05', portal: 'Temporal Nexus', dimension: 'Temporal Nexus', activity: 'Timeline Merge', count: 3, status: 'Critical' },
    { time: '2024-01-15 19:30', portal: 'Void Breach', dimension: 'The Void Between', activity: 'Reality Anchor', count: 1, status: 'Contained' },
    { time: '2024-01-15 20:15', portal: 'Data Matrix Gate', dimension: 'Digital Reality Matrix', activity: 'AI Migration', count: 67, status: 'Processing' },
    { time: '2024-01-15 21:45', portal: 'Crystal Resonator', dimension: 'Crystal Harmony Dimension', activity: 'Frequency Alignment', count: 12, status: 'Harmonized' }
  ])

  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [portalCreationActive, setPortalCreationActive] = useState(false)
  const [navigationActive, setNavigationActive] = useState(false)

  const openPortal = async (dimensionId: string) => {
    const dimension = knownDimensions.find(d => d.id === dimensionId)
    if (!dimension || portalState.dimensionalEnergy < 20) return

    setPortalCreationActive(true)
    setSelectedDimension(dimensionId)

    // 포털 생성 시뮬레이션
    const phases = [
      { name: 'Dimensional Scan', duration: 300 },
      { name: 'Quantum Entanglement', duration: 400 },
      { name: 'Space-Time Tear', duration: 500 },
      { name: 'Portal Stabilization', duration: 600 },
      { name: 'Safety Protocols', duration: 300 },
      { name: 'Portal Activation', duration: 400 }
    ]

    for (const phase of phases) {
      await new Promise(resolve => setTimeout(resolve, phase.duration))
      toast.info(`Portal Creation: ${phase.name}`)
    }

    setPortalState(prev => ({
      ...prev,
      openPortals: prev.openPortals + 1,
      dimensionalEnergy: Math.max(0, prev.dimensionalEnergy - 20),
      portalNavigations: prev.portalNavigations + 1,
      interdimensionalTraffic: prev.interdimensionalTraffic + Math.floor(Math.random() * 100)
    }))

    setPortalCreationActive(false)
    setSelectedDimension(null)
    toast.success(`Portal Opened to ${dimension.name}`)
  }

  const navigateDimension = async (dimensionId: string) => {
    const dimension = knownDimensions.find(d => d.id === dimensionId)
    if (!dimension) return

    setNavigationActive(true)
    setSelectedDimension(dimensionId)

    // 차원 이동 시뮬레이션
    for (let i = 0; i <= 100; i += 20) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      if (i === 40) toast.info(`Entering dimensional barrier...`)
      if (i === 60) toast.info(`Reality shift detected...`)
      if (i === 80) toast.info(`Adapting to new physics...`)
    }

    setPortalState(prev => ({
      ...prev,
      realityShifts: prev.realityShifts + 1,
      dimensionalEnergy: Math.max(0, prev.dimensionalEnergy - 15)
    }))

    setNavigationActive(false)
    setSelectedDimension(null)
    toast.success(`Successfully navigated to ${dimension.name}`)
  }

  const closeAllPortals = () => {
    setPortalState(prev => ({
      ...prev,
      openPortals: 0,
      dimensionalEnergy: Math.min(100, prev.dimensionalEnergy + 30),
      portalStability: Math.min(100, prev.portalStability + 15)
    }))
    toast.success('All Portals Closed - Reality Stabilized')
  }

  const harmonizeDimensions = () => {
    setPortalState(prev => ({
      ...prev,
      cosmicHarmony: Math.min(100, prev.cosmicHarmony + 10),
      multiversalSync: Math.min(100, prev.multiversalSync + 15),
      dimensionalEnergy: Math.min(100, prev.dimensionalEnergy + 20),
      portalStability: Math.min(100, prev.portalStability + 10)
    }))
    toast.success('Dimensional Harmony Achieved - Multiverse Synchronized')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-lg z-50"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-7xl bg-black/30 backdrop-blur-sm rounded-3xl border border-purple-500/30 p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              🌀 DIMENSIONAL PORTAL CONTROL CENTER 🌀
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Lightning className="w-6 h-6 text-red-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 차원 포털 제어판 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 포털 시스템 상태 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Spiral className="w-8 h-8 mr-3" />
                  Portal System Status
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{portalState.activeDimensions}</div>
                    <div className="text-sm text-gray-300">Active Dimensions</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{portalState.openPortals}</div>
                    <div className="text-sm text-gray-300">Open Portals</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{portalState.quantumTunnels}</div>
                    <div className="text-sm text-gray-300">Quantum Tunnels</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Dimensional Energy</span>
                      <span className="text-purple-400 font-bold">{portalState.dimensionalEnergy.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${portalState.dimensionalEnergy}%` }} />
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Portal Stability</span>
                      <span className="text-blue-400 font-bold">{portalState.portalStability.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${portalState.portalStability}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-3 text-sm">
                  <div className="bg-black/40 rounded-lg p-3 text-center">
                    <div className="text-orange-400 font-bold">{portalState.spatialRifts}</div>
                    <div className="text-gray-400">Spatial Rifts</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 text-center">
                    <div className="text-yellow-400 font-bold">{portalState.temporalGateways}</div>
                    <div className="text-gray-400">Temporal Gates</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 text-center">
                    <div className="text-pink-400 font-bold">{portalState.consciousnessChannels}</div>
                    <div className="text-gray-400">Mind Channels</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3 text-center">
                    <div className="text-red-400 font-bold">{portalState.voidBridges}</div>
                    <div className="text-gray-400">Void Bridges</div>
                  </div>
                </div>
              </div>

              {/* 알려진 차원들 */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                  <Globe className="w-8 h-8 mr-3" />
                  Known Dimensions
                </h3>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {knownDimensions.map((dimension) => (
                    <motion.div
                      key={dimension.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-black/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-white font-semibold">{dimension.name}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              dimension.danger === 'Safe' ? 'bg-green-500/20 text-green-300' :
                              dimension.danger === 'Unstable' || dimension.danger === 'Ego Death' || dimension.danger === 'Nightmare Risk' || dimension.danger === 'Logic Traps' || dimension.danger === 'Frequency Lock' ? 'bg-yellow-500/20 text-yellow-300' :
                              dimension.danger === 'High' || dimension.danger === 'Paradox' ? 'bg-orange-500/20 text-orange-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {dimension.danger}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                              {dimension.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">{dimension.description}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><span className="text-gray-400">Coordinates:</span> <span className="text-cyan-400">{dimension.coordinates}</span></div>
                            <div><span className="text-gray-400">Physics:</span> <span className="text-green-400">{dimension.physics}</span></div>
                            <div><span className="text-gray-400">Inhabitants:</span> <span className="text-purple-400">{dimension.inhabitants}</span></div>
                            <div><span className="text-gray-400">Energy:</span> <span className="text-yellow-400">{dimension.energy}</span></div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <button
                            onClick={() => openPortal(dimension.id)}
                            disabled={portalCreationActive || navigationActive || portalState.dimensionalEnergy < 20}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedDimension === dimension.id && portalCreationActive
                                ? 'bg-purple-600 text-white'
                                : portalState.dimensionalEnergy < 20
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                            }`}
                          >
                            {selectedDimension === dimension.id && portalCreationActive ? 'Opening...' : 'Open Portal'}
                          </button>
                          <button
                            onClick={() => navigateDimension(dimension.id)}
                            disabled={portalCreationActive || navigationActive}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              selectedDimension === dimension.id && navigationActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                            }`}
                          >
                            {selectedDimension === dimension.id && navigationActive ? 'Traveling...' : 'Navigate'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Stability: <span className="text-green-400">{dimension.stability}%</span></span>
                        <span className="text-gray-400">Access: <span className="text-blue-400">{dimension.accessibility}</span></span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={harmonizeDimensions}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Harmonize Dimensions
                  </button>
                  <button
                    onClick={closeAllPortals}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Close All Portals
                  </button>
                </div>
              </div>

              {/* 포털 활동 로그 */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-cyan-300 mb-6 flex items-center">
                  <Target className="w-8 h-8 mr-3" />
                  Portal Activity Log
                </h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {portalActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="text-white font-semibold">{activity.portal}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              activity.status === 'Complete' || activity.status === 'Harmonized' || activity.status === 'Contained' ? 'bg-green-500/20 text-green-300' :
                              activity.status === 'Active' || activity.status === 'Syncing' || activity.status === 'Processing' || activity.status === 'Monitored' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {activity.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {activity.activity}: <span className="text-cyan-400">{activity.count}</span> • 
                            <span className="text-purple-400 ml-1">{activity.dimension}</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 차원 시각화 및 통계 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Dimensional Visualization</h3>
                <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* 중심 포털 */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute w-24 h-24 border-4 border-purple-500 rounded-full"
                  />
                  
                  {/* 궤도 차원들 */}
                  {knownDimensions.slice(0, 8).map((_, index) => (
                    <motion.div
                      key={index}
                      className="absolute w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      animate={{
                        x: Math.cos((index * Math.PI * 2) / 8) * 60 + Math.cos(Date.now() / 1000 + index) * 10,
                        y: Math.sin((index * Math.PI * 2) / 8) * 60 + Math.sin(Date.now() / 1000 + index) * 10,
                      }}
                      transition={{ duration: 2 + index * 0.5, repeat: Infinity }}
                    />
                  ))}
                  
                  <div className="text-center">
                    <Spiral className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-300">Portal Hub</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Portal Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Portal Navigations</span>
                    <span className="text-indigo-400">{portalState.portalNavigations.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reality Shifts</span>
                    <span className="text-purple-400">{portalState.realityShifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Interdimensional Traffic</span>
                    <span className="text-cyan-400">{portalState.interdimensionalTraffic.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dimensional Mappings</span>
                    <span className="text-green-400">{portalState.dimensionalMappings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dimensional Barriers</span>
                    <span className="text-yellow-400">{portalState.dimensionalBarriers}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Multiverse Harmony</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Cosmic Harmony</span>
                      <span className="text-orange-400 font-bold">{portalState.cosmicHarmony.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full" style={{ width: `${portalState.cosmicHarmony}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Multiversal Sync</span>
                      <span className="text-purple-400 font-bold">{portalState.multiversalSync.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${portalState.multiversalSync}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Portal Energy</h3>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400 mb-2">{portalState.dimensionalEnergy.toFixed(1)}%</div>
                  <div className="text-sm text-gray-300 mb-4">Available Energy</div>
                  <div className="h-4 bg-gray-700 rounded-full">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${portalState.dimensionalEnergy}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
