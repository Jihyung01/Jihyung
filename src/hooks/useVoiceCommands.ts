import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceCommand {
  command: string;
  action: () => void;
  confidence?: number;
  patterns?: string[];
}

export interface UseVoiceCommandsReturn {
  isListening: boolean;
  isSupported: boolean;
  voiceCommands: VoiceCommand[];
  startListening: () => void;
  stopListening: () => void;
  addCommand: (command: VoiceCommand) => void;
  removeCommand: (command: string) => void;
  transcript: string;
  confidence: number;
  error: string | null;
}

export const useVoiceCommands = (): UseVoiceCommandsReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR'; // Korean support
      recognition.maxAlternatives = 3;
      
      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const confidence = event.results[current][0].confidence;
        
        setTranscript(transcript);
        setConfidence(confidence);
        
        // Check for command matches
        const matchedCommand = voiceCommands.find(cmd => 
          cmd.patterns ? 
            cmd.patterns.some(pattern => transcript.toLowerCase().includes(pattern.toLowerCase())) :
            transcript.toLowerCase().includes(cmd.command.toLowerCase())
        );
        
        if (matchedCommand && confidence > (matchedCommand.confidence || 0.7)) {
          matchedCommand.action();
        }
      };
      
      recognition.onerror = (event: any) => {
        setError(`음성 인식 오류: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
    }
    
    // Default voice commands
    setVoiceCommands([
      {
        command: "대시보드",
        action: () => window.location.hash = '#dashboard',
        patterns: ["대시보드로", "홈으로", "메인으로"]
      },
      {
        command: "작업",
        action: () => window.location.hash = '#tasks',
        patterns: ["작업 관리", "할 일", "태스크"]
      },
      {
        command: "캘린더",
        action: () => window.location.hash = '#calendar',
        patterns: ["일정", "스케줄", "달력"]
      },
      {
        command: "노트",
        action: () => window.location.hash = '#notes',
        patterns: ["메모", "기록", "문서"]
      },
      {
        command: "AI 어시스턴트",
        action: () => {
          const event = new CustomEvent('openAI', { detail: true });
          document.dispatchEvent(event);
        },
        patterns: ["AI", "인공지능", "도움말"]
      }
    ]);
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [voiceCommands]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      try {
        recognitionRef.current.start();
        setError(null);
      } catch (err) {
        setError('음성 인식을 시작할 수 없습니다.');
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const addCommand = useCallback((command: VoiceCommand) => {
    setVoiceCommands(prev => [...prev, command]);
  }, []);

  const removeCommand = useCallback((command: string) => {
    setVoiceCommands(prev => prev.filter(cmd => cmd.command !== command));
  }, []);

  return {
    isListening,
    isSupported,
    voiceCommands,
    startListening,
    stopListening,
    addCommand,
    removeCommand,
    transcript,
    confidence,
    error
  };
};