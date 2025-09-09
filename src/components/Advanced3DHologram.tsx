import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWebGL } from '@/hooks/useWebGL';

interface Advanced3DHologramProps {
  data: any;
  type: 'temporal' | 'dimensional' | 'consciousness' | 'quantum';
  enabled: boolean;
  className?: string;
}

export const Advanced3DHologram: React.FC<Advanced3DHologramProps> = ({ 
  data, 
  type, 
  enabled, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { gl, isSupported } = useWebGL(canvasRef);
  const [animationFrame, setAnimationFrame] = useState<number>(0);

  useEffect(() => {
    if (!enabled || !gl) return;

    let frameId: number;
    
    const animate = () => {
      setAnimationFrame(prev => prev + 1);
      frameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [enabled, gl]);

  const renderHologram = () => {
    if (!isSupported) {
      return (
        <div className="relative w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🌀</div>
            <div className="text-white/80">
              {type === 'temporal' && '시간 시각화'}
              {type === 'dimensional' && '차원 포털'}
              {type === 'consciousness' && '의식 필드'}
              {type === 'quantum' && '양자 상태'}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          width={300}
          height={300}
        />
        
        {/* Holographic overlay effects */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              animate={{
                x: [
                  Math.random() * 300,
                  Math.random() * 300,
                  Math.random() * 300
                ],
                y: [
                  Math.random() * 300,
                  Math.random() * 300,
                  Math.random() * 300
                ],
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Holographic scan lines */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent"
          animate={{
            y: [-300, 300]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    );
  };

  if (!enabled) {
    return (
      <div className={`w-full h-64 bg-gray-800/50 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-400">홀로그램 비활성화</div>
      </div>
    );
  }

  return (
    <motion.div
      className={`relative overflow-hidden rounded-lg border border-cyan-500/30 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        boxShadow: '0 0 50px rgba(6, 182, 212, 0.3)',
        background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)'
      }}
    >
      {renderHologram()}
      
      {/* Holographic frame effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
      </div>
      
      {/* Data readout */}
      <div className="absolute bottom-2 left-2 text-xs text-cyan-400 font-mono">
        {type.toUpperCase()} • FRAME: {animationFrame % 1000}
      </div>
    </motion.div>
  );
};
