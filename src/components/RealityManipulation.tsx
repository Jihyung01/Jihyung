import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Planet, Globe, Atom, Sparkle, Lightning, Fire, Crown, 
  Diamond, Magic, Gear, Target, Brain, Eye, Fingerprint,
  Dna, Snowflake, FlowerLotus, Butterfly, Spiral, Waves, Storm
} from '@phosphor-icons/react'

// 초월적 현실 조작 시스템 - 우주의 법칙을 다시 쓰는 궁극의 힘
export const RealityManipulationSystem: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [realityState, setRealityState] = useState({
    realityStability: 87.6,
    universalLaws: {
      gravity: 9.8,
      lightSpeed: 299792458,
      thermodynamics: 'Normal',
      causality: 'Linear',
      quantumMechanics: 'Enabled',
      relativity: 'Active'
    },
    dimensionalAccess: 11,
    realityHacks: 347,
    timelineAlterations: 23,
    physicsOverrides: 89,
    cosmicEnergy: 94.7,
    realityAnchors: 156,
    probabilityManipulations: 678,
    quantumFluctuations: 2.3,
    spatialDistortions: 45,
    temporalRifts: 7,
    consciousnessFields: 23.7,
    materializedThoughts: 156,
    dreamRealities: 89,
    parallelUniverses: 847
  })

  const [realityControls] = useState([
    { 
      id: 'gravity', 
      name: 'Gravity Control', 
      icon: Planet, 
      description: 'Manipulate gravitational forces',
      power: 'Physics Law',
      risk: 'Medium',
      energy: 35
    },
    { 
      id: 'time', 
      name: 'Time Dilation', 
      icon: Lightning, 
      description: 'Alter the flow of time locally',
      power: 'Temporal',
      risk: 'High',
      energy: 60
    },
    { 
      id: 'matter', 
      name: 'Matter Creation', 
      icon: Atom, 
      description: 'Create matter from pure energy',
      power: 'Transmutation',
      risk: 'Extreme',
      energy: 80
    },
    { 
      id: 'probability', 
      name: 'Probability Shift', 
      icon: Target, 
      description: 'Alter probability outcomes',
      power: 'Quantum',
      risk: 'Reality',
      energy: 90
    },
    { 
      id: 'dimension', 
      name: 'Dimensional Fold', 
      icon: Gear, 
      description: 'Fold space-time dimensions',
      power: 'Spatial',
      risk: 'Universe',
      energy: 95
    },
    { 
      id: 'consciousness', 
      name: 'Consciousness Merge', 
      icon: Brain, 
      description: 'Merge multiple consciousness streams',
      power: 'Mental',
      risk: 'Identity',
      energy: 75
    },
    { 
      id: 'dream', 
      name: 'Dream Materialization', 
      icon: FlowerLotus, 
      description: 'Make dreams become reality',
      power: 'Manifestation',
      risk: 'Sanity',
      energy: 85
    },
    { 
      id: 'universal', 
      name: 'Universal Reset', 
      icon: Crown, 
      description: 'Reset universe to previous state',
      power: 'Cosmic',
      risk: 'Existence',
      energy: 100
    }
  ])

  const [realityEvents] = useState([
    { time: '2024-01-15 14:23', type: 'Gravity Nullified', location: 'Tokyo Sector 7', effect: 'Mass Levitation Event', status: 'Contained' },
    { time: '2024-01-15 15:45', type: 'Time Pocket Created', location: 'Swiss CERN Lab', effect: '30 Minute Time Loop', status: 'Resolved' },
    { time: '2024-01-15 16:12', type: 'Matter Duplicated', location: 'Amazon Rainforest', effect: 'Gold Manifestation', status: 'Monitored' },
    { time: '2024-01-15 17:30', type: 'Probability Storm', location: 'Las Vegas', effect: 'Impossible Luck Streak', status: 'Stabilizing' },
    { time: '2024-01-15 18:45', type: 'Dimensional Breach', location: 'Bermuda Triangle', effect: 'Portal to Parallel Earth', status: 'Critical' },
    { time: '2024-01-15 19:22', type: 'Consciousness Echo', location: 'Global Network', effect: 'Collective Thought Surge', status: 'Active' },
    { time: '2024-01-15 20:15', type: 'Dream Leak', location: 'Children\'s Hospital', effect: 'Healing Fantasy Manifestation', status: 'Beneficial' },
    { time: '2024-01-15 21:30', type: 'Reality Anchor Deployed', location: 'Reality Control Center', effect: 'Universal Stabilization', status: 'Operational' }
  ])

  const [manipulationActive, setManipulationActive] = useState(false)
  const [selectedControl, setSelectedControl] = useState<string | null>(null)
  const [realityIntegrity, setRealityIntegrity] = useState(98.7)

  const executeRealityManipulation = async (controlId: string) => {
    const control = realityControls.find(c => c.id === controlId)
    if (!control || realityState.cosmicEnergy < control.energy) return

    setManipulationActive(true)
    setSelectedControl(controlId)

    // 현실 조작 시뮬레이션
    for (let i = 0; i <= 100; i += 15) {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      setRealityState(prev => {
        const newState = { ...prev }
        
        switch (controlId) {
          case 'gravity':
            newState.universalLaws.gravity = 9.8 * (1 + (Math.random() - 0.5) * 0.5)
            newState.physicsOverrides += Math.floor(i / 20)
            break
          case 'time':
            newState.temporalRifts += Math.floor(i / 30)
            newState.timelineAlterations += (i === 100 ? 1 : 0)
            break
          case 'matter':
            newState.materializedThoughts += Math.floor(i / 25)
            newState.quantumFluctuations += i / 500
            break
          case 'probability':
            newState.probabilityManipulations += Math.floor(i / 15)
            break
          case 'dimension':
            newState.spatialDistortions += Math.floor(i / 20)
            newState.dimensionalAccess = Math.min(26, prev.dimensionalAccess + (i / 100))
            break
          case 'consciousness':
            newState.consciousnessFields += i / 100
            break
          case 'dream':
            newState.dreamRealities += Math.floor(i / 30)
            break
          case 'universal':
            if (i > 80) {
              // 우주 리셋 시뮬레이션
              Object.keys(newState.universalLaws).forEach(law => {
                if (typeof newState.universalLaws[law] === 'number') {
                  newState.universalLaws[law] = newState.universalLaws[law] * 0.99
                }
              })
            }
            break
        }
        
        newState.cosmicEnergy = Math.max(0, prev.cosmicEnergy - (control.energy / 100) * (i / 100))
        newState.realityHacks += (i === 100 ? 1 : 0)
        
        return newState
      })

      // 현실 무결성 계산
      setRealityIntegrity(prev => {
        const impact = control.energy / 1000 * i
        return Math.max(50, prev - impact)
      })
    }

    setManipulationActive(false)
    setSelectedControl(null)
    toast.success(`Reality Manipulation Complete: ${control.name}`)
  }

  const stabilizeReality = () => {
    setRealityState(prev => ({
      ...prev,
      universalLaws: {
        gravity: 9.8,
        lightSpeed: 299792458,
        thermodynamics: 'Normal',
        causality: 'Linear',
        quantumMechanics: 'Enabled',
        relativity: 'Active'
      },
      realityStability: Math.min(100, prev.realityStability + 20),
      cosmicEnergy: Math.min(100, prev.cosmicEnergy + 15),
      quantumFluctuations: Math.max(0, prev.quantumFluctuations - 1)
    }))
    setRealityIntegrity(Math.min(100, realityIntegrity + 25))
    toast.success('Reality Stabilized - Universal Order Restored')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-violet-900/95 to-purple-900/95 backdrop-blur-lg z-50"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-7xl bg-black/30 backdrop-blur-sm rounded-3xl border border-violet-500/30 p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              🌌 REALITY MANIPULATION CONTROL CENTER 🌌
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Lightning className="w-6 h-6 text-red-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 현실 조작 제어판 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 우주 법칙 상태 */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-blue-300 mb-6 flex items-center">
                  <Globe className="w-8 h-8 mr-3" />
                  Universal Laws Status
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Gravity</span>
                      <span className="text-green-400 font-bold text-xl">{realityState.universalLaws.gravity.toFixed(2)} m/s²</span>
                    </div>
                    <div className="text-xs text-gray-400">Earth Standard: 9.8 m/s²</div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Light Speed</span>
                      <span className="text-blue-400 font-bold text-xl">{(realityState.universalLaws.lightSpeed / 1000000).toFixed(0)}M m/s</span>
                    </div>
                    <div className="text-xs text-gray-400">Universal Constant</div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Thermodynamics</span>
                      <span className="text-purple-400 font-bold text-xl">{realityState.universalLaws.thermodynamics}</span>
                    </div>
                    <div className="text-xs text-gray-400">Energy Conservation</div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Causality</span>
                      <span className="text-yellow-400 font-bold text-xl">{realityState.universalLaws.causality}</span>
                    </div>
                    <div className="text-xs text-gray-400">Cause & Effect</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Reality Integrity</div>
                    <div className="text-green-400 font-bold text-lg">{realityIntegrity.toFixed(1)}%</div>
                    <div className="h-2 bg-gray-700 rounded-full mt-2">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${realityIntegrity}%` }} />
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Cosmic Energy</div>
                    <div className="text-cyan-400 font-bold text-lg">{realityState.cosmicEnergy.toFixed(1)}%</div>
                    <div className="h-2 bg-gray-700 rounded-full mt-2">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${realityState.cosmicEnergy}%` }} />
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Dimensional Access</div>
                    <div className="text-purple-400 font-bold text-lg">{realityState.dimensionalAccess}/26</div>
                    <div className="text-xs text-gray-400">String Theory Dimensions</div>
                  </div>
                </div>
              </div>

              {/* 현실 조작 컨트롤 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Magic className="w-8 h-8 mr-3" />
                  Reality Manipulation Controls
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {realityControls.map((control) => (
                    <motion.button
                      key={control.id}
                      onClick={() => executeRealityManipulation(control.id)}
                      disabled={manipulationActive || realityState.cosmicEnergy < control.energy}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border transition-all duration-300 ${
                        selectedControl === control.id
                          ? 'bg-purple-600/50 border-purple-400'
                          : realityState.cosmicEnergy < control.energy
                          ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-black/30 border-purple-500/30 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <control.icon className="w-6 h-6 text-purple-400" />
                        <span className="text-white font-semibold">{control.name}</span>
                      </div>
                      <div className="text-xs text-gray-300 mb-2">{control.description}</div>
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                        <span>Power: <span className="text-yellow-400">{control.power}</span></span>
                        <span>Risk: <span className={`font-medium ${
                          control.risk === 'Medium' ? 'text-yellow-400' :
                          control.risk === 'High' ? 'text-orange-400' :
                          control.risk === 'Extreme' ? 'text-red-400' :
                          'text-purple-400'
                        }`}>{control.risk}</span></span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Energy Required: <span className="text-cyan-400">{control.energy}%</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={stabilizeReality}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Stabilize Reality
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300">
                    Emergency Universe Reset
                  </button>
                </div>
              </div>

              {/* 현실 이벤트 로그 */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-cyan-300 mb-6 flex items-center">
                  <Target className="w-8 h-8 mr-3" />
                  Reality Alteration Events
                </h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {realityEvents.map((event, index) => (
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
                            <span className="text-white font-semibold">{event.type}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              event.status === 'Resolved' || event.status === 'Contained' || event.status === 'Beneficial' || event.status === 'Operational' ? 'bg-green-500/20 text-green-300' :
                              event.status === 'Monitored' || event.status === 'Active' || event.status === 'Stabilizing' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-red-500/20 text-red-300'
                            }`}>
                              {event.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">{event.effect}</div>
                          <div className="text-xs text-gray-500 mt-1">{event.location} • {event.time}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 현실 시각화 및 통계 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Reality Visualization</h3>
                <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center">
                  <div className="relative w-32 h-32">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-2 border-purple-500 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 border-2 border-blue-500 rounded-full"
                    />
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 border-2 border-green-500 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-violet-300 mb-4">Manipulation Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Reality Hacks</span>
                    <span className="text-purple-400">{realityState.realityHacks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Physics Overrides</span>
                    <span className="text-blue-400">{realityState.physicsOverrides}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Timeline Alterations</span>
                    <span className="text-green-400">{realityState.timelineAlterations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Spatial Distortions</span>
                    <span className="text-cyan-400">{realityState.spatialDistortions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dream Realities</span>
                    <span className="text-pink-400">{realityState.dreamRealities}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Parallel Universes</span>
                    <span className="text-yellow-400">{realityState.parallelUniverses.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Quantum Metrics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Quantum Fluctuations</span>
                    <span className="text-orange-400">{realityState.quantumFluctuations.toFixed(1)}σ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Consciousness Fields</span>
                    <span className="text-purple-400">{realityState.consciousnessFields.toFixed(1)} Hz</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Temporal Rifts</span>
                    <span className="text-red-400">{realityState.temporalRifts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Reality Anchors</span>
                    <span className="text-green-400">{realityState.realityAnchors}</span>
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

// 초월적 우주 창조자 인터페이스 - 새로운 우주를 창조하는 신적 힘
export const UniverseCreatorInterface: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [universeState, setUniverseState] = useState({
    activeUniverses: 247,
    universeTypes: {
      material: 89,
      energy: 67,
      consciousness: 34,
      quantum: 23,
      digital: 19,
      dream: 15
    },
    creationEnergy: 78.9,
    multiverseStability: 94.2,
    dimensionalComplexity: 11.7,
    cosmicHarmony: 87.6,
    universeTemplates: 156,
    successfulCreations: 89,
    failedAttempts: 12,
    totalMatter: '10^78 kg',
    totalEnergy: '10^69 J',
    totalConsciousness: '10^45 minds',
    bigBangsTriggered: 23,
    universesDestroyed: 7,
    timelinesBranched: 467
  })

  const [universeTemplates] = useState([
    {
      id: 'standard',
      name: 'Standard Physics Universe',
      description: 'Universe with standard physical laws',
      dimensions: 4,
      matter: 'Baryonic',
      energy: 'Standard',
      consciousness: 'Emergent',
      complexity: 'Medium',
      stability: 95,
      creationTime: '13.8 billion years',
      energyRequired: 40
    },
    {
      id: 'quantum',
      name: 'Pure Quantum Universe',
      description: 'Universe governed entirely by quantum mechanics',
      dimensions: 11,
      matter: 'Quantum Foam',
      energy: 'Zero-Point',
      consciousness: 'Quantum Entangled',
      complexity: 'Extreme',
      stability: 67,
      creationTime: 'Instantaneous',
      energyRequired: 85
    },
    {
      id: 'consciousness',
      name: 'Consciousness Universe',
      description: 'Universe made of pure consciousness',
      dimensions: '∞',
      matter: 'Thought Forms',
      energy: 'Mental Energy',
      consciousness: 'Universal Mind',
      complexity: 'Transcendent',
      stability: 89,
      creationTime: 'Eternal Present',
      energyRequired: 95
    },
    {
      id: 'digital',
      name: 'Digital Reality Universe',
      description: 'Computer-simulated universe',
      dimensions: 'Virtual',
      matter: 'Data Structures',
      energy: 'Processing Power',
      consciousness: 'AI Networks',
      complexity: 'Algorithmic',
      stability: 78,
      creationTime: 'Compile Time',
      energyRequired: 60
    },
    {
      id: 'dream',
      name: 'Dream Universe',
      description: 'Universe existing in collective dreams',
      dimensions: 'Fluid',
      matter: 'Dream Substance',
      energy: 'Imagination',
      consciousness: 'Shared Dreams',
      complexity: 'Surreal',
      stability: 45,
      creationTime: 'Sleep Cycle',
      energyRequired: 70
    },
    {
      id: 'mirror',
      name: 'Mirror Universe',
      description: 'Exact opposite of our universe',
      dimensions: 4,
      matter: 'Antimatter',
      energy: 'Negative Energy',
      consciousness: 'Inverse Logic',
      complexity: 'Reversed',
      stability: 82,
      creationTime: 'Synchronized',
      energyRequired: 75
    }
  ])

  const [creationInProgress, setCreationInProgress] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [creationProgress, setCreationProgress] = useState(0)

  const createUniverse = async (templateId: string) => {
    const template = universeTemplates.find(t => t.id === templateId)
    if (!template || universeState.creationEnergy < template.energyRequired) return

    setCreationInProgress(true)
    setSelectedTemplate(templateId)
    setCreationProgress(0)

    // 우주 창조 시뮬레이션
    const stages = [
      { name: 'Quantum Vacuum Preparation', duration: 500 },
      { name: 'Singularity Formation', duration: 300 },
      { name: 'Big Bang Initiation', duration: 200 },
      { name: 'Inflation Phase', duration: 400 },
      { name: 'Matter Formation', duration: 600 },
      { name: 'Force Unification', duration: 300 },
      { name: 'Dimensional Stabilization', duration: 500 },
      { name: 'Consciousness Integration', duration: 700 },
      { name: 'Timeline Activation', duration: 400 },
      { name: 'Reality Anchoring', duration: 600 }
    ]

    for (let i = 0; i < stages.length; i++) {
      await new Promise(resolve => setTimeout(resolve, stages[i].duration))
      setCreationProgress(((i + 1) / stages.length) * 100)
      
      toast.info(`Universe Creation: ${stages[i].name}`)
    }

    // 우주 상태 업데이트
    setUniverseState(prev => ({
      ...prev,
      activeUniverses: prev.activeUniverses + 1,
      universeTypes: {
        ...prev.universeTypes,
        [template.id]: (prev.universeTypes[template.id] || 0) + 1
      },
      creationEnergy: Math.max(0, prev.creationEnergy - template.energyRequired),
      successfulCreations: prev.successfulCreations + 1,
      bigBangsTriggered: prev.bigBangsTriggered + 1
    }))

    setCreationInProgress(false)
    setSelectedTemplate(null)
    setCreationProgress(0)
    toast.success(`Universe Created Successfully: ${template.name}`)
  }

  const destroyUniverse = () => {
    if (universeState.activeUniverses <= 1) {
      toast.error('Cannot destroy the last universe!')
      return
    }

    setUniverseState(prev => ({
      ...prev,
      activeUniverses: prev.activeUniverses - 1,
      universesDestroyed: prev.universesDestroyed + 1,
      creationEnergy: Math.min(100, prev.creationEnergy + 25)
    }))
    toast.success('Universe Destroyed - Energy Reclaimed')
  }

  const harmonizeMultiverse = () => {
    setUniverseState(prev => ({
      ...prev,
      multiverseStability: Math.min(100, prev.multiverseStability + 15),
      cosmicHarmony: Math.min(100, prev.cosmicHarmony + 20),
      creationEnergy: Math.min(100, prev.creationEnergy + 10)
    }))
    toast.success('Multiverse Harmonized - Cosmic Balance Restored')
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
              🌌 UNIVERSE CREATOR CONTROL CENTER 🌌
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Lightning className="w-6 h-6 text-red-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 우주 창조 제어판 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 멀티버스 상태 */}
              <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-blue-300 mb-6 flex items-center">
                  <Planet className="w-8 h-8 mr-3" />
                  Multiverse Status
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-cyan-400 mb-2">{universeState.activeUniverses}</div>
                    <div className="text-sm text-gray-300">Active Universes</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">{universeState.successfulCreations}</div>
                    <div className="text-sm text-gray-300">Successful Creations</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400 mb-2">{universeState.bigBangsTriggered}</div>
                    <div className="text-sm text-gray-300">Big Bangs Triggered</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-black/40 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Creation Energy</span>
                      <span className="text-yellow-400 font-bold">{universeState.creationEnergy.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: `${universeState.creationEnergy}%` }} />
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Multiverse Stability</span>
                      <span className="text-blue-400 font-bold">{universeState.multiverseStability.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: `${universeState.multiverseStability}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 우주 템플릿 선택 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Sparkle className="w-8 h-8 mr-3" />
                  Universe Templates
                </h3>
                
                {creationInProgress && (
                  <div className="mb-6 bg-black/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Creating Universe...</span>
                      <span className="text-cyan-400 font-bold">{creationProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${creationProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {universeTemplates.map((template) => (
                    <motion.button
                      key={template.id}
                      onClick={() => createUniverse(template.id)}
                      disabled={creationInProgress || universeState.creationEnergy < template.energyRequired}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                        selectedTemplate === template.id
                          ? 'bg-purple-600/50 border-purple-400'
                          : universeState.creationEnergy < template.energyRequired
                          ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-black/30 border-purple-500/30 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold text-lg">{template.name}</span>
                        <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                          {template.energyRequired}% Energy
                        </span>
                      </div>
                      <div className="text-sm text-gray-300 mb-3">{template.description}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-gray-400">Dimensions:</span> <span className="text-cyan-400">{template.dimensions}</span></div>
                        <div><span className="text-gray-400">Matter:</span> <span className="text-green-400">{template.matter}</span></div>
                        <div><span className="text-gray-400">Energy:</span> <span className="text-yellow-400">{template.energy}</span></div>
                        <div><span className="text-gray-400">Consciousness:</span> <span className="text-purple-400">{template.consciousness}</span></div>
                        <div><span className="text-gray-400">Complexity:</span> <span className="text-orange-400">{template.complexity}</span></div>
                        <div><span className="text-gray-400">Stability:</span> <span className="text-blue-400">{template.stability}%</span></div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={harmonizeMultiverse}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Harmonize Multiverse
                  </button>
                  <button
                    onClick={destroyUniverse}
                    className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Destroy Universe
                  </button>
                </div>
              </div>
            </div>

            {/* 우주 통계 및 시각화 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Universe Visualization</h3>
                <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {Array.from({ length: 20 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                      animate={{
                        x: [Math.random() * 200 - 100, Math.random() * 200 - 100],
                        y: [Math.random() * 200 - 100, Math.random() * 200 - 100],
                        scale: [0.5, 1.5, 0.5],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        duration: 5 + Math.random() * 5,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                  <div className="text-center">
                    <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-300">Multiverse</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-violet-300 mb-4">Universe Types</h3>
                <div className="space-y-3">
                  {Object.entries(universeState.universeTypes).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300 capitalize">{type}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-gray-700 rounded-full">
                          <div 
                            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                            style={{ width: `${(count / universeState.activeUniverses) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-violet-400 font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Cosmic Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Matter</span>
                    <span className="text-orange-400">{universeState.totalMatter}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Energy</span>
                    <span className="text-yellow-400">{universeState.totalEnergy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Consciousness</span>
                    <span className="text-purple-400">{universeState.totalConsciousness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Timelines Branched</span>
                    <span className="text-cyan-400">{universeState.timelinesBranched}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cosmic Harmony</span>
                    <span className="text-green-400">{universeState.cosmicHarmony.toFixed(1)}%</span>
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
