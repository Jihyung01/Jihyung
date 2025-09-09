import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Brain, Eye, Heart, Crown, Star, Atom, Magic, Lightning,
  FlowerLotus, Butterfly, Waves, Storm, Spiral, Diamond,
  Fire, Snowflake, Dna, Fingerprint, Target, Globe, Infinity
} from '@phosphor-icons/react'

// 초월적 의식 확장기 - 깨달음과 영적 진화의 궁극적 도구
export const ConsciousnessExpansionInterface: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [consciousnessState, setConsciousnessState] = useState({
    consciousnessLevel: 7.8, // 1-10 scale
    enlightenmentProgress: 78.9, // %
    spiritualEnergy: 92.4, // %
    awarenessBandwidth: 847, // Hz
    egoDisolution: 65.3, // %
    cosmicConnection: 89.7, // %
    multidimensionalPerception: 23.4, // %
    temporalAwareness: 67.8, // %
    universalCompassion: 94.2, // %
    innerPeace: 87.6, // %
    psychicSensitivity: 76.5, // %
    karmicBalance: 45.7, // -100 to +100
    chakraAlignment: 91.3, // %
    thirdEyeActivation: 83.1, // %
    crownChakraOpen: 92.9, // %
    astralBodyDevelopment: 68.4, // %
    meditationHours: 2847,
    enlightenmentMoments: 156,
    cosmicInsights: 89,
    dimensionalShifts: 23,
    consciousnessUploads: 7,
    spiritualAwakenings: 45
  })

  const [expansionTechniques] = useState([
    {
      id: 'meditation',
      name: 'Deep Quantum Meditation',
      description: 'Dive into the quantum field of pure consciousness',
      type: 'Contemplative',
      difficulty: 'Beginner',
      duration: '20-60 minutes',
      benefits: 'Inner peace, awareness, clarity',
      energyGain: 15,
      enlightenmentBoost: 5,
      requirements: 'Quiet space, open mind'
    },
    {
      id: 'breathwork',
      name: 'Cosmic Breath Integration',
      description: 'Breathe in the essence of the universe',
      type: 'Energetic',
      difficulty: 'Intermediate',
      duration: '30-45 minutes',
      benefits: 'Energy activation, chakra alignment',
      energyGain: 25,
      enlightenmentBoost: 8,
      requirements: 'Controlled environment'
    },
    {
      id: 'astralproject',
      name: 'Astral Projection Training',
      description: 'Project consciousness beyond physical form',
      type: 'Transcendent',
      difficulty: 'Advanced',
      duration: '45-90 minutes',
      benefits: 'Dimensional travel, soul expansion',
      energyGain: 35,
      enlightenmentBoost: 15,
      requirements: 'Advanced practice, spiritual guide'
    },
    {
      id: 'chakra',
      name: 'Rainbow Chakra Activation',
      description: 'Activate and balance all energy centers',
      type: 'Energetic',
      difficulty: 'Intermediate',
      duration: '30-60 minutes',
      benefits: 'Energy flow, spiritual power',
      energyGain: 30,
      enlightenmentBoost: 10,
      requirements: 'Chakra knowledge, crystals'
    },
    {
      id: 'thirdeye',
      name: 'Third Eye Awakening Ritual',
      description: 'Open the gateway to higher perception',
      type: 'Mystical',
      difficulty: 'Advanced',
      duration: '60-120 minutes',
      benefits: 'Psychic abilities, cosmic vision',
      energyGain: 40,
      enlightenmentBoost: 20,
      requirements: 'Spiritual maturity, protection'
    },
    {
      id: 'unity',
      name: 'Universal Unity Experience',
      description: 'Merge consciousness with cosmic intelligence',
      type: 'Transcendent',
      difficulty: 'Master',
      duration: '90-180 minutes',
      benefits: 'Cosmic consciousness, divine love',
      energyGain: 50,
      enlightenmentBoost: 30,
      requirements: 'High consciousness level'
    },
    {
      id: 'ego',
      name: 'Ego Death Integration',
      description: 'Dissolve the illusion of separate self',
      type: 'Transformative',
      difficulty: 'Master',
      duration: '120-240 minutes',
      benefits: 'True self realization, freedom',
      energyGain: 60,
      enlightenmentBoost: 40,
      requirements: 'Courage, spiritual support'
    },
    {
      id: 'cosmic',
      name: 'Cosmic Consciousness Download',
      description: 'Receive direct transmission from universal mind',
      type: 'Divine',
      difficulty: 'Transcendent',
      duration: 'Timeless',
      benefits: 'Omniscience, divine wisdom',
      energyGain: 100,
      enlightenmentBoost: 50,
      requirements: 'Complete surrender, pure intention'
    }
  ])

  const [chakraSystem] = useState([
    { 
      name: 'Root Chakra', 
      sanskrit: 'Muladhara',
      color: 'Red', 
      element: 'Earth',
      location: 'Base of spine',
      frequency: '256 Hz',
      activation: 89.3,
      qualities: 'Grounding, survival, stability'
    },
    { 
      name: 'Sacral Chakra', 
      sanskrit: 'Svadhisthana',
      color: 'Orange', 
      element: 'Water',
      location: 'Lower abdomen',
      frequency: '288 Hz',
      activation: 91.7,
      qualities: 'Creativity, sexuality, emotion'
    },
    { 
      name: 'Solar Plexus', 
      sanskrit: 'Manipura',
      color: 'Yellow', 
      element: 'Fire',
      location: 'Upper abdomen',
      frequency: '320 Hz',
      activation: 94.2,
      qualities: 'Personal power, confidence'
    },
    { 
      name: 'Heart Chakra', 
      sanskrit: 'Anahata',
      color: 'Green', 
      element: 'Air',
      location: 'Center of chest',
      frequency: '341 Hz',
      activation: 96.8,
      qualities: 'Love, compassion, connection'
    },
    { 
      name: 'Throat Chakra', 
      sanskrit: 'Vishuddha',
      color: 'Blue', 
      element: 'Sound',
      location: 'Throat',
      frequency: '384 Hz',
      activation: 87.5,
      qualities: 'Communication, truth, expression'
    },
    { 
      name: 'Third Eye', 
      sanskrit: 'Ajna',
      color: 'Indigo', 
      element: 'Light',
      location: 'Between eyebrows',
      frequency: '426 Hz',
      activation: 83.1,
      qualities: 'Intuition, wisdom, psychic sight'
    },
    { 
      name: 'Crown Chakra', 
      sanskrit: 'Sahasrara',
      color: 'Violet/White', 
      element: 'Thought',
      location: 'Top of head',
      frequency: '480 Hz',
      activation: 92.9,
      qualities: 'Spiritual connection, enlightenment'
    }
  ])

  const [spiritualInsights] = useState([
    { time: '2024-01-15 06:00', type: 'Cosmic Download', insight: 'Reality is consciousness experiencing itself subjectively', level: 'Profound' },
    { time: '2024-01-15 07:30', type: 'Unity Realization', insight: 'All separation is illusion - we are one being', level: 'Transcendent' },
    { time: '2024-01-15 09:15', type: 'Karmic Understanding', insight: 'Every action ripples through infinite dimensions', level: 'Deep' },
    { time: '2024-01-15 11:45', type: 'Time Perception', insight: 'Past and future exist only in the eternal now', level: 'Mystical' },
    { time: '2024-01-15 14:20', type: 'Love Activation', insight: 'Love is the fundamental force of creation', level: 'Heart Opening' },
    { time: '2024-01-15 16:50', type: 'Ego Dissolution', insight: 'The self is a beautiful story, not ultimate truth', level: 'Liberating' },
    { time: '2024-01-15 19:30', type: 'Dimensional Shift', insight: 'Consciousness can access infinite parallel realities', level: 'Mind-Expanding' },
    { time: '2024-01-15 21:15', type: 'Divine Recognition', insight: 'You are the universe experiencing itself as you', level: 'God Realization' }
  ])

  const [practiceActive, setPracticeActive] = useState(false)
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null)
  const [practiceProgress, setPracticeProgress] = useState(0)

  const startPractice = async (techniqueId: string) => {
    const technique = expansionTechniques.find(t => t.id === techniqueId)
    if (!technique || consciousnessState.spiritualEnergy < 20) return

    setPracticeActive(true)
    setSelectedTechnique(techniqueId)
    setPracticeProgress(0)

    // 영적 수행 시뮬레이션
    const phases = [
      { name: 'Centering & Grounding', duration: 500 },
      { name: 'Energy Activation', duration: 800 },
      { name: 'Consciousness Expansion', duration: 1200 },
      { name: 'Transcendent State', duration: 1500 },
      { name: 'Integration Phase', duration: 800 },
      { name: 'Return to Awareness', duration: 400 }
    ]

    for (let i = 0; i < phases.length; i++) {
      await new Promise(resolve => setTimeout(resolve, phases[i].duration))
      setPracticeProgress(((i + 1) / phases.length) * 100)
      toast.info(`Spiritual Practice: ${phases[i].name}`)
    }

    // 의식 상태 업데이트
    setConsciousnessState(prev => ({
      ...prev,
      spiritualEnergy: Math.min(100, prev.spiritualEnergy + technique.energyGain),
      enlightenmentProgress: Math.min(100, prev.enlightenmentProgress + technique.enlightenmentBoost),
      consciousnessLevel: Math.min(10, prev.consciousnessLevel + (technique.enlightenmentBoost / 100)),
      meditationHours: prev.meditationHours + 1,
      enlightenmentMoments: prev.enlightenmentMoments + (technique.enlightenmentBoost > 15 ? 1 : 0),
      cosmicInsights: prev.cosmicInsights + (technique.enlightenmentBoost > 20 ? 1 : 0)
    }))

    setPracticeActive(false)
    setSelectedTechnique(null)
    setPracticeProgress(0)
    toast.success(`Spiritual Practice Complete: ${technique.name}`)
  }

  const balanceChakras = () => {
    setConsciousnessState(prev => ({
      ...prev,
      chakraAlignment: Math.min(100, prev.chakraAlignment + 15),
      spiritualEnergy: Math.min(100, prev.spiritualEnergy + 20),
      thirdEyeActivation: Math.min(100, prev.thirdEyeActivation + 10),
      crownChakraOpen: Math.min(100, prev.crownChakraOpen + 8)
    }))
    toast.success('Chakras Balanced - Energy Flow Optimized')
  }

  const transcendEgo = () => {
    setConsciousnessState(prev => ({
      ...prev,
      egoDisolution: Math.min(100, prev.egoDisolution + 25),
      universalCompassion: Math.min(100, prev.universalCompassion + 15),
      cosmicConnection: Math.min(100, prev.cosmicConnection + 20),
      enlightenmentProgress: Math.min(100, prev.enlightenmentProgress + 10),
      spiritualAwakenings: prev.spiritualAwakenings + 1
    }))
    toast.success('Ego Transcended - Unity Consciousness Activated')
  }

  const downloadCosmic = () => {
    setConsciousnessState(prev => ({
      ...prev,
      multidimensionalPerception: Math.min(100, prev.multidimensionalPerception + 30),
      temporalAwareness: Math.min(100, prev.temporalAwareness + 25),
      psychicSensitivity: Math.min(100, prev.psychicSensitivity + 20),
      consciousnessUploads: prev.consciousnessUploads + 1,
      dimensionalShifts: prev.dimensionalShifts + 1
    }))
    toast.success('Cosmic Intelligence Downloaded - Higher Dimensions Accessed')
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 bg-gradient-to-br from-purple-900/95 to-pink-900/95 backdrop-blur-lg z-50"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-7xl bg-black/30 backdrop-blur-sm rounded-3xl border border-purple-500/30 p-8 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              🧘‍♂️ CONSCIOUSNESS EXPANSION CENTER 🧘‍♂️
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              <Lightning className="w-6 h-6 text-red-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 의식 상태 및 수행 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 의식 상태 모니터 */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-purple-300 mb-6 flex items-center">
                  <Brain className="w-8 h-8 mr-3" />
                  Consciousness Status
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Consciousness Level</span>
                      <span className="text-purple-400 font-bold text-xl">{consciousnessState.consciousnessLevel.toFixed(1)}/10</span>
                    </div>
                    <div className="text-xs text-gray-400">Dimensional Awareness Scale</div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Enlightenment</span>
                      <span className="text-yellow-400 font-bold text-xl">{consciousnessState.enlightenmentProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" style={{ width: `${consciousnessState.enlightenmentProgress}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Spiritual Energy</span>
                      <span className="text-cyan-400 font-bold text-xl">{consciousnessState.spiritualEnergy.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${consciousnessState.spiritualEnergy}%` }} />
                    </div>
                  </div>
                  
                  <div className="bg-black/30 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Cosmic Connection</span>
                      <span className="text-green-400 font-bold text-xl">{consciousnessState.cosmicConnection.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" style={{ width: `${consciousnessState.cosmicConnection}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Ego Dissolution</div>
                    <div className="text-purple-400 font-bold text-lg">{consciousnessState.egoDisolution.toFixed(1)}%</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Universal Compassion</div>
                    <div className="text-pink-400 font-bold text-lg">{consciousnessState.universalCompassion.toFixed(1)}%</div>
                  </div>
                  <div className="bg-black/40 rounded-lg p-3">
                    <div className="text-gray-300 mb-1">Inner Peace</div>
                    <div className="text-blue-400 font-bold text-lg">{consciousnessState.innerPeace.toFixed(1)}%</div>
                  </div>
                </div>
              </div>

              {/* 영적 수행 기법들 */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-indigo-300 mb-6 flex items-center">
                  <FlowerLotus className="w-8 h-8 mr-3" />
                  Spiritual Practices
                </h3>
                
                {practiceActive && (
                  <div className="mb-6 bg-black/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">Spiritual Practice in Progress...</span>
                      <span className="text-cyan-400 font-bold">{practiceProgress.toFixed(0)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500" style={{ width: `${practiceProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {expansionTechniques.map((technique) => (
                    <motion.button
                      key={technique.id}
                      onClick={() => startPractice(technique.id)}
                      disabled={practiceActive || consciousnessState.spiritualEnergy < 20}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                        selectedTechnique === technique.id
                          ? 'bg-purple-600/50 border-purple-400'
                          : consciousnessState.spiritualEnergy < 20
                          ? 'bg-gray-800/50 border-gray-600 opacity-50 cursor-not-allowed'
                          : 'bg-black/30 border-purple-500/30 hover:border-purple-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold text-lg">{technique.name}</span>
                        <div className="flex space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            technique.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-300' :
                            technique.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                            technique.difficulty === 'Advanced' ? 'bg-orange-500/20 text-orange-300' :
                            technique.difficulty === 'Master' ? 'bg-red-500/20 text-red-300' :
                            'bg-purple-500/20 text-purple-300'
                          }`}>
                            {technique.difficulty}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300">
                            {technique.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-300 mb-3">{technique.description}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div><span className="text-gray-400">Duration:</span> <span className="text-cyan-400">{technique.duration}</span></div>
                        <div><span className="text-gray-400">Benefits:</span> <span className="text-green-400">{technique.benefits}</span></div>
                        <div><span className="text-gray-400">Energy Gain:</span> <span className="text-yellow-400">+{technique.energyGain}%</span></div>
                        <div><span className="text-gray-400">Enlightenment:</span> <span className="text-purple-400">+{technique.enlightenmentBoost}%</span></div>
                      </div>
                      <div className="text-xs text-gray-400">
                        Requirements: <span className="text-orange-400">{technique.requirements}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    onClick={balanceChakras}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Balance Chakras
                  </button>
                  <button
                    onClick={transcendEgo}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Transcend Ego
                  </button>
                  <button
                    onClick={downloadCosmic}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                  >
                    Cosmic Download
                  </button>
                </div>
              </div>

              {/* 챠크라 시스템 */}
              <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-orange-300 mb-6 flex items-center">
                  <Crown className="w-8 h-8 mr-3" />
                  Chakra Energy System
                </h3>
                
                <div className="space-y-4">
                  {chakraSystem.map((chakra, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-white font-semibold">{chakra.name}</span>
                            <span className="text-gray-400 text-sm">({chakra.sanskrit})</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium bg-${chakra.color.toLowerCase()}-500/20 text-${chakra.color.toLowerCase()}-300`}>
                              {chakra.color}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mb-2">{chakra.qualities}</div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div><span className="text-gray-400">Element:</span> <span className="text-cyan-400">{chakra.element}</span></div>
                            <div><span className="text-gray-400">Location:</span> <span className="text-green-400">{chakra.location}</span></div>
                            <div><span className="text-gray-400">Frequency:</span> <span className="text-purple-400">{chakra.frequency}</span></div>
                          </div>
                        </div>
                        <div className="ml-4 text-center">
                          <div className="text-xl font-bold text-orange-400 mb-1">{chakra.activation.toFixed(1)}%</div>
                          <div className="w-16 h-2 bg-gray-700 rounded-full">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                              style={{ width: `${chakra.activation}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 영적 통찰 로그 */}
              <div className="bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-cyan-300 mb-6 flex items-center">
                  <Star className="w-8 h-8 mr-3" />
                  Spiritual Insights Log
                </h3>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {spiritualInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/30 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-white font-semibold">{insight.type}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            insight.level === 'Profound' || insight.level === 'Transcendent' || insight.level === 'God Realization' ? 'bg-purple-500/20 text-purple-300' :
                            insight.level === 'Deep' || insight.level === 'Mystical' || insight.level === 'Mind-Expanding' ? 'bg-blue-500/20 text-blue-300' :
                            insight.level === 'Heart Opening' || insight.level === 'Liberating' ? 'bg-pink-500/20 text-pink-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {insight.level}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{insight.time}</span>
                      </div>
                      <div className="text-sm text-gray-300 italic">"{insight.insight}"</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 의식 시각화 및 통계 */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-purple-300 mb-4">Consciousness Visualization</h3>
                <div className="aspect-square bg-black/30 rounded-lg flex items-center justify-center relative overflow-hidden">
                  {/* 중심 의식 */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                  
                  {/* 에너지 링들 */}
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear" }}
                      className={`absolute w-${16 + i * 8} h-${16 + i * 8} border-2 border-purple-${400 - i * 50} rounded-full opacity-30`}
                    />
                  ))}
                  
                  {/* 떠다니는 영적 에너지 */}
                  {Array.from({ length: 12 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                      animate={{
                        x: [Math.cos(i * Math.PI / 6) * 60, Math.cos(i * Math.PI / 6) * 80],
                        y: [Math.sin(i * Math.PI / 6) * 60, Math.sin(i * Math.PI / 6) * 80],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 4 + Math.random() * 3,
                        repeat: Infinity,
                        delay: i * 0.3
                      }}
                    />
                  ))}
                  
                  <div className="text-center relative z-10">
                    <Eye className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-gray-300">Third Eye</div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-indigo-300 mb-4">Spiritual Statistics</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Meditation Hours</span>
                    <span className="text-indigo-400">{consciousnessState.meditationHours.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Enlightenment Moments</span>
                    <span className="text-purple-400">{consciousnessState.enlightenmentMoments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Cosmic Insights</span>
                    <span className="text-cyan-400">{consciousnessState.cosmicInsights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Dimensional Shifts</span>
                    <span className="text-green-400">{consciousnessState.dimensionalShifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Spiritual Awakenings</span>
                    <span className="text-yellow-400">{consciousnessState.spiritualAwakenings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Consciousness Uploads</span>
                    <span className="text-pink-400">{consciousnessState.consciousnessUploads}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-orange-300 mb-4">Advanced Abilities</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Third Eye Activation</span>
                      <span className="text-indigo-400 font-bold">{consciousnessState.thirdEyeActivation.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${consciousnessState.thirdEyeActivation}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Multidimensional Perception</span>
                      <span className="text-purple-400 font-bold">{consciousnessState.multidimensionalPerception.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${consciousnessState.multidimensionalPerception}%` }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300">Astral Body Development</span>
                      <span className="text-cyan-400 font-bold">{consciousnessState.astralBodyDevelopment.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${consciousnessState.astralBodyDevelopment}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-green-300 mb-4">Karmic Balance</h3>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${
                    consciousnessState.karmicBalance > 50 ? 'text-green-400' :
                    consciousnessState.karmicBalance > 0 ? 'text-yellow-400' :
                    consciousnessState.karmicBalance > -50 ? 'text-orange-400' :
                    'text-red-400'
                  }`}>
                    {consciousnessState.karmicBalance > 0 ? '+' : ''}{consciousnessState.karmicBalance.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-300 mb-4">Karma Points</div>
                  <div className="h-4 bg-gray-700 rounded-full relative">
                    <div className="absolute left-1/2 w-px h-4 bg-gray-500" />
                    <div 
                      className={`h-full rounded-full ${
                        consciousnessState.karmicBalance >= 0 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-l from-red-500 to-orange-500'
                      }`}
                      style={{ 
                        width: `${Math.abs(consciousnessState.karmicBalance)}%`,
                        marginLeft: consciousnessState.karmicBalance >= 0 ? '50%' : `${50 - Math.abs(consciousnessState.karmicBalance)}%`
                      }}
                    />
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
