import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import {
  Brain,
  Zap,
  Sparkles,
  Eye,
  Ear,
  Mic,
  Camera,
  MessageSquare,
  TrendingUp,
  Target,
  Lightbulb,
  Clock,
  Star,
  Users,
  Activity,
  Gauge,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  CheckSquare,
  FileText,
  Heart,
  Smile,
  Frown,
  Meh,
  AlertCircle,
  Shield,
  Rocket,
  Globe,
  Cpu,
  Database,
  Cloud,
  Wifi,
  Bluetooth,
  Smartphone,
  Watch,
  Headphones,
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  X,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Filter,
  Search,
  Share2,
  Download,
  Upload,
  Maximize2,
  Minimize2,
  Edit3,
  Save,
  Trash2,
  Copy,
  ExternalLink,
  RefreshCw,
  PowerOff,
  Power
} from 'lucide-react';

interface AIEnhancedFeaturesProps {
  onClose?: () => void;
  className?: string;
}

interface AIInsight {
  id: string;
  type: 'productivity' | 'wellness' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  data?: any;
}

interface BiometricData {
  heartRate: number;
  stressLevel: number;
  energyLevel: number;
  focusScore: number;
  timestamp: Date;
}

interface AIAssistantState {
  isListening: boolean;
  isProcessing: boolean;
  isResponding: boolean;
  currentMode: 'voice' | 'text' | 'vision' | 'context';
  confidence: number;
}

export const AIEnhancedFeatures: React.FC<AIEnhancedFeaturesProps> = ({
  onClose,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<'ai-assistant' | 'insights' | 'biometrics' | 'predictions'>('ai-assistant');
  const [assistantState, setAssistantState] = useState<AIAssistantState>({
    isListening: false,
    isProcessing: false,
    isResponding: false,
    currentMode: 'voice',
    confidence: 0
  });

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'productivity',
      title: '최적 작업 시간대 발견',
      description: '오전 9시-11시에 가장 높은 생산성을 보입니다. 이 시간대에 중요한 업무를 배치해보세요.',
      confidence: 89,
      impact: 'high',
      actionable: true,
      data: { timeSlot: '09:00-11:00', efficiency: 89 }
    },
    {
      id: '2',
      type: 'wellness',
      title: '스트레스 패턴 분석',
      description: '화요일과 목요일에 스트레스 수준이 높습니다. 이 날들에는 휴식 시간을 더 확보하세요.',
      confidence: 76,
      impact: 'medium',
      actionable: true,
      data: { highStressDays: ['Tuesday', 'Thursday'] }
    },
    {
      id: '3',
      type: 'prediction',
      title: '다음 주 업무량 예측',
      description: '다음 주에 현재보다 25% 많은 업무량이 예상됩니다. 미리 일정을 조정해보세요.',
      confidence: 82,
      impact: 'high',
      actionable: true,
      data: { increase: 25, category: 'meetings' }
    }
  ]);

  const [biometricData, setBiometricData] = useState<BiometricData>({
    heartRate: 72,
    stressLevel: 35,
    energyLevel: 78,
    focusScore: 85,
    timestamp: new Date()
  });

  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [contextualSuggestions, setContextualSuggestions] = useState([
    '오늘 할 일 우선순위를 정해주세요',
    '스트레스 해소를 위한 방법을 알려주세요',
    '효율적인 시간 관리 팁을 추천해주세요',
    '건강한 작업 환경을 만드는 방법은?'
  ]);

  const recognitionRef = useRef<any | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'ko-KR';

        recognitionRef.current.onstart = () => {
          setAssistantState(prev => ({ ...prev, isListening: true }));
        };

        recognitionRef.current.onresult = (event) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');

          setVoiceTranscript(transcript);
          setAssistantState(prev => ({ ...prev, confidence: event.results[0]?.[0]?.confidence || 0 }));
        };

        recognitionRef.current.onend = () => {
          setAssistantState(prev => ({ ...prev, isListening: false }));
          if (voiceTranscript) {
            processVoiceCommand(voiceTranscript);
          }
        };

        recognitionRef.current.onerror = (event) => {
          toast.error('음성 인식 오류: ' + event.error);
          setAssistantState(prev => ({ ...prev, isListening: false }));
        };
      }
    }

    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceTranscript]);

  // Simulate biometric data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBiometricData(prev => ({
        ...prev,
        heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 4)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + (Math.random() - 0.5) * 10)),
        energyLevel: Math.max(0, Math.min(100, prev.energyLevel + (Math.random() - 0.5) * 8)),
        focusScore: Math.max(0, Math.min(100, prev.focusScore + (Math.random() - 0.5) * 6)),
        timestamp: new Date()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Start voice recognition
  const startVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && !assistantState.isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        toast.error('음성 인식을 시작할 수 없습니다.');
      }
    }
  }, [assistantState.isListening]);

  // Stop voice recognition
  const stopVoiceRecognition = useCallback(() => {
    if (recognitionRef.current && assistantState.isListening) {
      recognitionRef.current.stop();
    }
  }, [assistantState.isListening]);

  // Process voice command
  const processVoiceCommand = useCallback(async (command: string) => {
    setAssistantState(prev => ({ ...prev, isProcessing: true }));

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    let response = '';
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('할 일') || lowerCommand.includes('task')) {
      response = '새로운 할 일을 추가해드릴까요? 어떤 작업을 하시려고 하시나요?';
    } else if (lowerCommand.includes('일정') || lowerCommand.includes('스케줄')) {
      response = '일정을 확인해보니 오늘 3개의 미팅이 예정되어 있습니다. 더 자세한 정보를 원하시면 말씀해주세요.';
    } else if (lowerCommand.includes('스트레스') || lowerCommand.includes('피로')) {
      response = '현재 스트레스 수준이 다소 높네요. 5분간 깊은 호흡을 하거나 짧은 산책을 추천드립니다.';
    } else {
      response = '말씀해주신 내용을 분석 중입니다. 더 구체적으로 설명해주시면 더 나은 도움을 드릴 수 있습니다.';
    }

    setAiResponse(response);
    setAssistantState(prev => ({ ...prev, isProcessing: false, isResponding: true }));

    // Text-to-speech
    if (synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(response);
      utterance.lang = 'ko-KR';
      utterance.onend = () => {
        setAssistantState(prev => ({ ...prev, isResponding: false }));
      };
      synthRef.current.speak(utterance);
    }

    setVoiceTranscript('');
  }, []);

  // Apply AI insight
  const applyInsight = useCallback((insight: AIInsight) => {
    toast.success(`"${insight.title}" 인사이트가 적용되었습니다!`);

    // Here you would integrate with your app's state management
    // to actually apply the insight (e.g., reschedule tasks, set reminders)
  }, []);

  // Get emotion from biometric data
  const getEmotionFromBiometrics = useCallback((data: BiometricData) => {
    const score = (data.energyLevel + data.focusScore - data.stressLevel) / 3;

    if (score > 70) return { emoji: <Smile className="h-6 w-6 text-green-500" />, label: '좋음', color: 'text-green-600' };
    if (score > 40) return { emoji: <Meh className="h-6 w-6 text-yellow-500" />, label: '보통', color: 'text-yellow-600' };
    return { emoji: <Frown className="h-6 w-6 text-red-500" />, label: '주의', color: 'text-red-600' };
  }, []);

  const currentEmotion = getEmotionFromBiometrics(biometricData);

  const tabs = [
    { id: 'ai-assistant', label: 'AI 어시스턴트', icon: <Brain className="h-4 w-4" /> },
    { id: 'insights', label: 'AI 인사이트', icon: <Lightbulb className="h-4 w-4" /> },
    { id: 'biometrics', label: '바이오메트릭', icon: <Activity className="h-4 w-4" /> },
    { id: 'predictions', label: '예측 분석', icon: <TrendingUp className="h-4 w-4" /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`w-full max-w-6xl mx-auto ${className}`}
    >
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/30 shadow-2xl">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white relative">
                <Brain className="h-6 w-6" />
                {assistantState.isListening && (
                  <motion.div
                    className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">AI 강화 기능</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  인공지능으로 생산성을 극대화하세요
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mt-6">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* AI Assistant Tab */}
          {activeTab === 'ai-assistant' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Voice Interface */}
              <div className="text-center p-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-3xl">
                <motion.div
                  className={`mx-auto w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
                    assistantState.isListening
                      ? 'bg-gradient-to-r from-red-500 to-pink-500'
                      : assistantState.isProcessing
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                      : 'bg-gradient-to-r from-purple-500 to-violet-500'
                  } text-white shadow-2xl`}
                  animate={assistantState.isListening ? {
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(239, 68, 68, 0.4)",
                      "0 0 0 20px rgba(239, 68, 68, 0)",
                      "0 0 0 0 rgba(239, 68, 68, 0)"
                    ]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {assistantState.isListening ? (
                    <Mic className="h-12 w-12" />
                  ) : assistantState.isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Cpu className="h-12 w-12" />
                    </motion.div>
                  ) : (
                    <Brain className="h-12 w-12" />
                  )}
                </motion.div>

                <h3 className="text-2xl font-bold mb-2">
                  {assistantState.isListening ? '듣고 있습니다...' :
                   assistantState.isProcessing ? '분석 중...' :
                   assistantState.isResponding ? '답변 중...' :
                   'AI 어시스턴트'}
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {assistantState.isListening ? '명령을 말씀해주세요' :
                   assistantState.isProcessing ? '요청을 처리하고 있습니다' :
                   '버튼을 눌러 음성 명령을 시작하세요'}
                </p>

                {/* Voice Transcript */}
                {voiceTranscript && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 dark:bg-gray-800/60 rounded-2xl p-4 mb-4"
                  >
                    <p className="text-gray-800 dark:text-gray-200">"{voiceTranscript}"</p>
                    {assistantState.confidence > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          인식 정확도: {Math.round(assistantState.confidence * 100)}%
                        </div>
                        <Progress value={assistantState.confidence * 100} className="h-1" />
                      </div>
                    )}
                  </motion.div>
                )}

                {/* AI Response */}
                {aiResponse && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-2xl p-4 mb-4"
                  >
                    <div className="flex items-start gap-3">
                      <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <p className="text-gray-800 dark:text-gray-200 text-left">{aiResponse}</p>
                    </div>
                  </motion.div>
                )}

                {/* Control Buttons */}
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={assistantState.isListening ? stopVoiceRecognition : startVoiceRecognition}
                    disabled={assistantState.isProcessing || assistantState.isResponding}
                    className={`${assistantState.isListening
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700'
                    } px-8 py-3`}
                  >
                    {assistantState.isListening ? (
                      <>
                        <Square className="h-4 w-4 mr-2" />
                        정지
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        음성 명령
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setVoiceTranscript('');
                      setAiResponse('');
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                </div>
              </div>

              {/* Contextual Suggestions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  추천 명령어
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contextualSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      onClick={() => processVoiceCommand(suggestion)}
                      className="p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* AI Insights Tab */}
          {activeTab === 'insights' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {aiInsights.map((insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg text-white ${
                            insight.type === 'productivity' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            insight.type === 'wellness' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                            insight.type === 'prediction' ? 'bg-gradient-to-r from-purple-500 to-violet-500' :
                            'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}>
                            {insight.type === 'productivity' ? <TrendingUp className="h-4 w-4" /> :
                             insight.type === 'wellness' ? <Heart className="h-4 w-4" /> :
                             insight.type === 'prediction' ? <Eye className="h-4 w-4" /> :
                             <Lightbulb className="h-4 w-4" />}
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {insight.type}
                          </Badge>
                        </div>

                        <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
                          {insight.impact === 'high' ? '높음' : insight.impact === 'medium' ? '보통' : '낮음'}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-lg mb-2">{insight.title}</h4>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{insight.description}</p>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>신뢰도</span>
                            <span>{insight.confidence}%</span>
                          </div>
                          <Progress value={insight.confidence} className="h-2" />
                        </div>

                        {insight.actionable && (
                          <Button
                            onClick={() => applyInsight(insight)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                          >
                            <Zap className="h-4 w-4 mr-2" />
                            인사이트 적용
                          </Button>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Biometrics Tab */}
          {activeTab === 'biometrics' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Current Status */}
              <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl">
                      {currentEmotion.emoji}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">현재 상태</h3>
                      <p className={`text-sm font-medium ${currentEmotion.color}`}>
                        {currentEmotion.label}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">{Math.round((biometricData.energyLevel + biometricData.focusScore) / 2)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">전체 점수</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      label: '심박수',
                      value: `${Math.round(biometricData.heartRate)} BPM`,
                      progress: (biometricData.heartRate - 60) / 40 * 100,
                      icon: <Heart className="h-4 w-4" />,
                      color: 'from-red-500 to-pink-500'
                    },
                    {
                      label: '스트레스',
                      value: `${Math.round(biometricData.stressLevel)}%`,
                      progress: biometricData.stressLevel,
                      icon: <AlertCircle className="h-4 w-4" />,
                      color: 'from-yellow-500 to-orange-500'
                    },
                    {
                      label: '에너지',
                      value: `${Math.round(biometricData.energyLevel)}%`,
                      progress: biometricData.energyLevel,
                      icon: <Zap className="h-4 w-4" />,
                      color: 'from-green-500 to-emerald-500'
                    },
                    {
                      label: '집중도',
                      value: `${Math.round(biometricData.focusScore)}%`,
                      progress: biometricData.focusScore,
                      icon: <Target className="h-4 w-4" />,
                      color: 'from-blue-500 to-cyan-500'
                    }
                  ].map((metric, index) => (
                    <div key={metric.label} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-1.5 bg-gradient-to-r ${metric.color} text-white rounded-lg`}>
                          {metric.icon}
                        </div>
                        <span className="text-sm font-medium">{metric.label}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xl font-bold">{metric.value}</div>
                        <Progress
                          value={Math.max(0, Math.min(100, metric.progress))}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Device Connections */}
              <Card className="p-6">
                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Bluetooth className="h-5 w-5" />
                  연결된 장치
                </h4>

                <div className="space-y-4">
                  {[
                    { name: 'Apple Watch Series 9', status: 'connected', battery: 87, icon: <Watch className="h-5 w-5" /> },
                    { name: 'Samsung Galaxy Buds', status: 'connected', battery: 72, icon: <Headphones className="h-5 w-5" /> },
                    { name: 'iPhone 15 Pro', status: 'connected', battery: 95, icon: <Smartphone className="h-5 w-5" /> }
                  ].map((device, index) => (
                    <div key={device.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg">
                          {device.icon}
                        </div>
                        <div>
                          <h5 className="font-medium">{device.name}</h5>
                          <p className="text-sm text-green-600 dark:text-green-400">연결됨</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium">{device.battery}%</div>
                        <Progress value={device.battery} className="w-16 h-1 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Prediction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    title: '다음 주 생산성 예측',
                    prediction: '87%',
                    trend: 'up',
                    confidence: 84,
                    description: '현재 패턴을 기반으로 다음 주 생산성이 향상될 것으로 예상됩니다.',
                    factors: ['수면 패턴 개선', '운동 루틴 안정화', '스트레스 감소']
                  },
                  {
                    title: '최적 휴식 시간 추천',
                    prediction: '오후 2:30',
                    trend: 'neutral',
                    confidence: 76,
                    description: '바이오리듬 분석 결과 오후 2:30에 10분간 휴식을 권장합니다.',
                    factors: ['집중력 저하 구간', '스트레스 증가 시점', '에너지 충전 필요']
                  },
                  {
                    title: '업무 완료 예상 시간',
                    prediction: '오후 5:45',
                    trend: 'down',
                    confidence: 91,
                    description: '현재 진행 속도를 고려할 때 예정된 업무를 오후 5:45에 완료 예상됩니다.',
                    factors: ['현재 진행률 73%', '평균 작업 속도', '남은 작업량']
                  },
                  {
                    title: '스트레스 위험 알림',
                    prediction: '내일 오전',
                    trend: 'up',
                    confidence: 68,
                    description: '내일 오전에 스트레스 수준이 높아질 가능성이 있습니다.',
                    factors: ['중요 미팅 예정', '마감 업무 3건', '수면 시간 부족']
                  }
                ].map((prediction, index) => (
                  <motion.div
                    key={prediction.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-semibold text-lg">{prediction.title}</h4>
                        <div className={`p-2 rounded-lg ${
                          prediction.trend === 'up' ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' :
                          prediction.trend === 'down' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {prediction.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                           prediction.trend === 'down' ? <TrendingUp className="h-4 w-4 rotate-180" /> :
                           <Activity className="h-4 w-4" />}
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                          {prediction.prediction}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {prediction.description}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>예측 정확도</span>
                            <span>{prediction.confidence}%</span>
                          </div>
                          <Progress value={prediction.confidence} className="h-2" />
                        </div>

                        <div>
                          <h5 className="font-medium text-sm mb-2">주요 요인:</h5>
                          <ul className="space-y-1">
                            {prediction.factors.map((factor, factorIndex) => (
                              <li key={factorIndex} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* AI Learning Progress */}
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">AI 학습 진행상황</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        더 많은 데이터로 더 정확한 예측을 제공합니다
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: '행동 패턴 분석', progress: 87, dataPoints: 2847 },
                    { label: '생산성 모델링', progress: 73, dataPoints: 1923 },
                    { label: '웰니스 추적', progress: 94, dataPoints: 3562 }
                  ].map((model, index) => (
                    <div key={model.label} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                      <h5 className="font-medium mb-2">{model.label}</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>학습 완료도</span>
                          <span>{model.progress}%</span>
                        </div>
                        <Progress value={model.progress} className="h-2" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {model.dataPoints.toLocaleString()}개 데이터 포인트
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AIEnhancedFeatures;