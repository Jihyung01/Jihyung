import { useState, useEffect, useRef } from 'react';

export const useWebGL = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
  const [gl, setGL] = useState<WebGLRenderingContext | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (context) {
      setGL(context as WebGLRenderingContext);
      setIsSupported(true);
    } else {
      setIsSupported(false);
    }
  }, [canvasRef]);
  
  const createShader = (type: number, source: string) => {
    if (!gl) return null;
    
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  };
  
  const createProgram = (vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
    if (!gl) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    
    return program;
  };
  
  return {
    gl,
    isSupported,
    createShader,
    createProgram
  };
};

export const useThreeJS = () => {
  const [scene, setScene] = useState<any>(null);
  const [camera, setCamera] = useState<any>(null);
  const [renderer, setRenderer] = useState<any>(null);
  
  const initThreeJS = (container: HTMLElement) => {
    // Three.js는 실제로는 설치되어 있지 않지만, 구조만 만들어둡니다
    console.log('Three.js would be initialized here');
    
    // Mock objects for development
    const mockScene = {
      add: (object: any) => console.log('Adding object to scene'),
      remove: (object: any) => console.log('Removing object from scene')
    };
    
    const mockCamera = {
      position: { x: 0, y: 0, z: 5 },
      lookAt: (x: number, y: number, z: number) => console.log(`Camera looking at ${x}, ${y}, ${z}`)
    };
    
    const mockRenderer = {
      setSize: (width: number, height: number) => console.log(`Renderer size: ${width}x${height}`),
      render: (scene: any, camera: any) => console.log('Rendering scene'),
      domElement: container
    };
    
    setScene(mockScene);
    setCamera(mockCamera);
    setRenderer(mockRenderer);
    
    return { scene: mockScene, camera: mockCamera, renderer: mockRenderer };
  };
  
  return {
    scene,
    camera,
    renderer,
    initThreeJS
  };
};
