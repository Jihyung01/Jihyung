import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Circle, Square, Triangle } from 'lucide-react'

interface Portal {
  id: string
  dimension: string
  status: 'active' | 'inactive' | 'unstable'
  coordinates: { x: number; y: number; z: number }
}

interface DimensionalPortalManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const DimensionalPortalManager: React.FC<DimensionalPortalManagerProps> = ({ isOpen = true, onClose }) => {
  const [portals, setPortals] = useState<Portal[]>([
    {
      id: 'portal-1',
      dimension: '4차원',
      status: 'active',
      coordinates: { x: 100, y: 200, z: 50 }
    },
    {
      id: 'portal-2', 
      dimension: '5차원',
      status: 'inactive',
      coordinates: { x: 300, y: 150, z: 100 }
    },
    {
      id: 'portal-3',
      dimension: '11차원',
      status: 'unstable',
      coordinates: { x: 200, y: 300, z: 200 }
    }
  ])

  const createPortal = () => {
    const newPortal: Portal = {
      id: `portal-${Date.now()}`,
      dimension: `${Math.floor(Math.random() * 8) + 4}차원`,
      status: 'inactive',
      coordinates: {
        x: Math.random() * 400,
        y: Math.random() * 400,
        z: Math.random() * 300
      }
    }
    setPortals(prev => [...prev, newPortal])
  }

  const togglePortal = (id: string) => {
    setPortals(prev => prev.map(portal => 
      portal.id === id 
        ? { 
            ...portal, 
            status: portal.status === 'active' ? 'inactive' : 'active' 
          }
        : portal
    ))
  }

  return (
    <motion.div 
      className="p-8 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl border border-indigo-500/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Circle className="h-8 w-8 text-indigo-400" />
        <h2 className="text-2xl font-bold text-indigo-100">차원 포털 관리자</h2>
      </div>
      
      <div className="space-y-4">
        {portals.map((portal) => (
          <motion.div
            key={portal.id}
            className={`p-4 rounded-lg border ${
              portal.status === 'active' 
                ? 'bg-green-800/20 border-green-500/30' 
                : portal.status === 'unstable'
                ? 'bg-red-800/20 border-red-500/30'
                : 'bg-gray-800/20 border-gray-500/30'
            }`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{portal.dimension}</h3>
                <p className="text-sm text-gray-300">
                  좌표: ({portal.coordinates.x}, {portal.coordinates.y}, {portal.coordinates.z})
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                  portal.status === 'active' 
                    ? 'bg-green-600 text-white' 
                    : portal.status === 'unstable'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-600 text-white'
                }`}>
                  {portal.status === 'active' ? '활성' : portal.status === 'unstable' ? '불안정' : '비활성'}
                </div>
                
                <motion.button
                  onClick={() => togglePortal(portal.id)}
                  className="p-2 bg-indigo-600 rounded-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={portal.status === 'unstable'}
                >
                  {portal.status === 'active' ? (
                    <Square className="h-4 w-4 text-white" />
                  ) : (
                    <Triangle className="h-4 w-4 text-white" />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        onClick={createPortal}
        className="w-full mt-6 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-bold text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Circle className="inline mr-2" />
        새 포털 생성
      </motion.button>
    </motion.div>
  )
}
