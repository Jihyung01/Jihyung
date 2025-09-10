import { useState, useEffect, useCallback, useRef } from 'react';

export interface ARMarker {
  id: string;
  position: { x: number; y: number; z: number };
  content: React.ReactNode;
  type: 'info' | 'action' | 'navigation' | 'data';
}

export interface ARSession {
  isActive: boolean;
  mode: 'immersive-ar' | 'inline' | 'viewer';
  features: string[];
}

export interface UseAugmentedRealityReturn {
  isSupported: boolean;
  isActive: boolean;
  arEnabled: boolean;
  session: ARSession | null;
  markers: ARMarker[];
  startAR: () => Promise<void>;
  stopAR: () => void;
  addMarker: (marker: ARMarker) => void;
  removeMarker: (id: string) => void;
  updateMarker: (id: string, updates: Partial<ARMarker>) => void;
  error: string | null;
  deviceOrientation: { alpha: number; beta: number; gamma: number };
  cameraStream: MediaStream | null;
}

export const useAugmentedReality = (): UseAugmentedRealityReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [arEnabled, setArEnabled] = useState(false);
  const [session, setSession] = useState<ARSession | null>(null);
  const [markers, setMarkers] = useState<ARMarker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const sessionRef = useRef<any>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    // Check WebXR AR support
    const checkARSupport = async () => {
      try {
        if (navigator.xr) {
          const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsSupported(isSupported);
        } else {
          // Fallback to device orientation API
          setIsSupported(!!window.DeviceOrientationEvent);
        }
      } catch (err) {
        console.log('WebXR not supported, using fallback AR features');
        setIsSupported(!!window.DeviceOrientationEvent);
      }
    };

    checkARSupport();

    // Device orientation listener for AR fallback
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
    }

    // Initialize default AR markers for demo
    setMarkers([
      {
        id: 'welcome',
        position: { x: 0, y: 0, z: -2 },
        content: '🚀 Welcome to AR Mode!',
        type: 'info'
      },
      {
        id: 'dashboard-nav',
        position: { x: -1, y: 0.5, z: -1.5 },
        content: '📊 Dashboard',
        type: 'navigation'
      },
      {
        id: 'tasks-nav',
        position: { x: 1, y: 0.5, z: -1.5 },
        content: '✅ Tasks',
        type: 'navigation'
      },
      {
        id: 'performance',
        position: { x: 0, y: 1, z: -1 },
        content: '⚡ Performance: 95%',
        type: 'data'
      }
    ]);

    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startAR = useCallback(async () => {
    setError(null);
    
    try {
      if (navigator.xr) {
        // Use WebXR for true AR
        const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['local', 'hit-test'],
          optionalFeatures: ['dom-overlay']
        });
        
        sessionRef.current = session;
        setSession({
          isActive: true,
          mode: 'immersive-ar',
          features: ['local', 'hit-test', 'dom-overlay']
        });
        setIsActive(true);
        setArEnabled(true);
        
        session.addEventListener('end', () => {
          setIsActive(false);
          setArEnabled(false);
          setSession(null);
        });
        
      } else {
        // Fallback AR using camera and device orientation
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          
          setCameraStream(stream);
          setSession({
            isActive: true,
            mode: 'viewer',
            features: ['camera', 'orientation']
          });
          setIsActive(true);
          setArEnabled(true);
          
          // Start AR render loop
          const renderLoop = () => {
            // AR rendering logic here
            animationRef.current = requestAnimationFrame(renderLoop);
          };
          renderLoop();
          
        } catch (cameraErr) {
          throw new Error('카메라 접근 권한이 필요합니다.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'AR 세션을 시작할 수 없습니다.');
      setIsActive(false);
      setArEnabled(false);
    }
  }, []);

  const stopAR = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.end();
    }
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setIsActive(false);
    setArEnabled(false);
    setSession(null);
  }, [cameraStream]);

  const addMarker = useCallback((marker: ARMarker) => {
    setMarkers(prev => [...prev, marker]);
  }, []);

  const removeMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(marker => marker.id !== id));
  }, []);

  const updateMarker = useCallback((id: string, updates: Partial<ARMarker>) => {
    setMarkers(prev => prev.map(marker => 
      marker.id === id ? { ...marker, ...updates } : marker
    ));
  }, []);

  return {
    isSupported,
    isActive,
    arEnabled,
    session,
    markers,
    startAR,
    stopAR,
    addMarker,
    removeMarker,
    updateMarker,
    error,
    deviceOrientation,
    cameraStream
  };
};