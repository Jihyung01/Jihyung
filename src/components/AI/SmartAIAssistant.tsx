import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Brain,
  Sparkles,
  Send,
  Mic,
  MicOff,
  MessageSquare,
  Lightbulb,
  Target,
  Calendar,
  FileText,
  Zap,
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  X,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Settings,
  Maximize2,
  Minimize2,
  User,
  Bot
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { enhancedAPI, type Note, type Task, type CalendarEvent } from '../../lib/enhanced-api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    type: 'note' | 'task' | 'event' | 'general';
    data?: any;
  };
  suggestions?: string[];
  actions?: Array<{
    label: string;
    action: () => void;
    icon?: React.ReactNode;
  }>;
}

interface SmartAIAssistantProps {
  notes?: Note[];
  tasks?: Task[];
  events?: CalendarEvent[];
  currentContext?: 'dashboard' | 'notes' | 'tasks' | 'calendar' | 'collaboration';
  onNoteCreate?: (note: Partial<Note>) => void;
  onTaskCreate?: (task: Partial<Task>) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => void;
  className?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const SmartAIAssistant: React.FC<SmartAIAssistantProps> = ({
  notes = [],
  tasks = [],
  events = [],
  currentContext = 'dashboard',
  onNoteCreate,
  onTaskCreate,
  onEventCreate,
  className = '',
  isMinimized = false,
  onToggleMinimize
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiMode, setAIMode] = useState<'chat' | 'assistant' | 'coach' | 'analyst'>('assistant');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [autoResponse, setAutoResponse] = useState(true);
  const [contextAware, setContextAware] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 초기 웰컴 메시지
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
        context: { type: 'general' },
        suggestions: getContextSuggestions()
      };
      setMessages([welcomeMessage]);
    }
  }, [currentContext]);

  const getWelcomeMessage = () => {
    const contextMessages = {
      dashboard: '안녕하세요! 대시보드 AI 어시스턴트입니다. 오늘의 일정, 할 일, 생산성 분석을 도와드릴 수 있습니다. 무엇을 도와드릴까요?',
      notes: '노트 페이지 AI 어시스턴트입니다! 📝 노트 작성, 정리, 검색, 요약 등을 도와드릴 수 있습니다.',
      tasks: '태스크 관리 AI 어시스턴트입니다! 🎯 할 일 관리, 우선순위 설정, 일정 계획 등을 도와드립니다.',
      calendar: '캘린더 AI 어시스턴트입니다! 📅 일정 관리, 시간 최적화, 회의 계획 등을 도와드릴게요.',
      collaboration: '협업 AI 어시스턴트입니다! 🤝 팀 협업, 프로젝트 관리, 커뮤니케이션을 도와드립니다.'
    };
    return contextMessages[currentContext] || contextMessages.dashboard;
  };

  const getContextSuggestions = () => {
    const suggestions = {
      dashboard: [
        '오늘의 일정 요약해줘',
        '우선순위 높은 할 일 알려줘', 
        '생산성 분석 보여줘',
        '이번 주 목표 설정하기'
      ],
      notes: [
        '새 노트 작성 도움',
        '기존 노트 요약해줘',
        '노트 정리 방법 추천',
        '중요한 노트 찾기'
      ],
      tasks: [
        '새 할 일 추가하기',
        '오늘 해야 할 일 정리',
        '우선순위 재설정',
        '진행률 분석해줘'
      ],
      calendar: [
        '새 일정 만들기',
        '시간 충돌 확인',
        '최적 회의 시간 추천',
        '이번 주 일정 요약'
      ],
      collaboration: [
        '팀 프로젝트 현황',
        '협업 효율성 분석',
        '회의 일정 조율',
        '문서 공유 도움'
      ]
    };
    return suggestions[currentContext] || suggestions.dashboard;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
      context: { type: 'general' }
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 컨텍스트 정보 준비
      const contextData = {
        currentPage: currentContext,
        notesCount: notes.length,
        tasksCount: tasks.length,
        eventsCount: events.length,
        recentNotes: notes.slice(0, 3).map(n => ({ title: n.title, content: n.content?.slice(0, 100) })),
        todayTasks: tasks.filter(t => t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString()),
        todayEvents: events.filter(e => new Date(e.start_at).toDateString() === new Date().toDateString())
      };

      const response = await enhancedAPI.chatWithAI(input, JSON.stringify(contextData));
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.response || '죄송합니다. 응답을 생성할 수 없습니다.',
        timestamp: new Date(),
        context: { type: 'general' },
        suggestions: generateSmartSuggestions(input, response.response),
        actions: generateActionButtons(input, response.response)
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // 자동 액션 실행
      if (autoResponse) {
        executeAutoActions(input, response.response);
      }
      
    } catch (error) {
      console.error('AI Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getFallbackResponse(input),
        timestamp: new Date(),
        context: { type: 'general' },
        suggestions: getContextSuggestions()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('AI 응답 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackResponse = (userInput: string): string => {
    const input_lower = userInput.toLowerCase();
    
    // 한국어 패턴 매칭
    if (input_lower.includes('안녕') || input_lower.includes('hi') || input_lower.includes('hello')) {
      return '안녕하세요! 😊 무엇을 도와드릴까요?';
    }
    
    if (input_lower.includes('노트') || input_lower.includes('메모')) {
      return `📝 현재 ${notes.length}개의 노트가 있습니다. 새 노트를 작성하거나 기존 노트를 정리하는 것을 도와드릴 수 있어요!`;
    }
    
    if (input_lower.includes('할일') || input_lower.includes('태스크') || input_lower.includes('task')) {
      return `🎯 현재 ${tasks.length}개의 할 일이 있습니다. 오늘 해야 할 일을 정리하거나 새 태스크를 추가하는 것을 도와드릴게요!`;
    }
    
    if (input_lower.includes('일정') || input_lower.includes('캘린더') || input_lower.includes('calendar')) {
      return `📅 현재 ${events.length}개의 일정이 있습니다. 새 일정을 만들거나 시간 관리를 도와드릴 수 있어요!`;
    }
    
    if (input_lower.includes('도움') || input_lower.includes('help')) {
      return '다음과 같은 도움을 드릴 수 있습니다:\n• 📝 노트 작성 및 관리\n• 🎯 할 일 계획 및 우선순위\n• 📅 일정 관리 및 최적화\n• 📊 생산성 분석\n• 🤝 협업 지원';
    }
    
    return '죄송합니다. 지금은 응답을 생성할 수 없지만, 계속해서 여러분의 생산성을 높이는데 도움을 드리고 싶습니다! 구체적인 질문이나 요청사항을 말씀해 주세요. 🚀';
  };

  const generateSmartSuggestions = (userInput: string, aiResponse: string): string[] => {
    const input_lower = userInput.toLowerCase();
    
    if (input_lower.includes('노트')) {
      return ['노트 템플릿 추천', '태그 자동 분류', '관련 노트 찾기', '노트 백업하기'];
    }
    
    if (input_lower.includes('할일') || input_lower.includes('태스크')) {
      return ['우선순위 자동 설정', '일정에 추가하기', '하위 태스크 생성', '진행률 추적'];
    }
    
    if (input_lower.includes('일정') || input_lower.includes('캘린더')) {
      return ['회의실 예약', '참석자 초대', '알림 설정', '반복 일정 만들기'];
    }
    
    return getContextSuggestions();
  };

  const generateActionButtons = (userInput: string, aiResponse: string) => {
    const actions = [];
    const input_lower = userInput.toLowerCase();
    
    if (input_lower.includes('노트') && onNoteCreate) {
      actions.push({
        label: '새 노트 작성',
        action: () => {
          onNoteCreate({ title: '새 노트', content: '' });
          toast.success('새 노트 작성 화면으로 이동합니다');
        },
        icon: <FileText className="h-4 w-4" />
      });
    }
    
    if (input_lower.includes('할일') && onTaskCreate) {
      actions.push({
        label: '새 할 일 추가',
        action: () => {
          onTaskCreate({ title: '새 할 일', priority: 'medium', status: 'pending' });
          toast.success('새 할 일 추가 화면으로 이동합니다');
        },
        icon: <Target className="h-4 w-4" />
      });
    }
    
    if (input_lower.includes('일정') && onEventCreate) {
      actions.push({
        label: '새 일정 만들기',
        action: () => {
          onEventCreate({ title: '새 일정', start_at: new Date().toISOString() });
          toast.success('새 일정 생성 화면으로 이동합니다');
        },
        icon: <Calendar className="h-4 w-4" />
      });
    }
    
    return actions;
  };

  const executeAutoActions = (userInput: string, aiResponse: string) => {
    // 자동 액션 로직 (필요시 구현)
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('클립보드에 복사되었습니다');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (isMinimized) {
    return (
      <motion.div
        className={`fixed bottom-4 right-4 z-50 ${className}`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Button
          onClick={onToggleMinimize}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
        >
          <Brain className="h-6 w-6 text-white" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`flex flex-col h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-2xl"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="h-6 w-6" />
          </motion.div>
          <div>
            <h3 className="font-semibold">AI 어시스턴트</h3>
            <p className="text-xs opacity-80">
              {aiMode === 'chat' ? '채팅 모드' : 
               aiMode === 'assistant' ? '어시스턴트 모드' :
               aiMode === 'coach' ? '코치 모드' : '분석 모드'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={aiMode} onValueChange={(value: any) => setAIMode(value)}>
            <SelectTrigger className="w-32 h-8 text-xs bg-white/20 border-white/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">채팅</SelectItem>
              <SelectItem value="assistant">어시스턴트</SelectItem>
              <SelectItem value="coach">코치</SelectItem>
              <SelectItem value="analyst">분석</SelectItem>
            </SelectContent>
          </Select>
          
          {onToggleMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleMinimize}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div className={`max-w-[70%] ${message.type === 'user' ? 'order-1' : ''}`}>
                  <div className={`
                    p-3 rounded-2xl 
                    ${message.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }
                  `}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Suggestions */}
                  {message.suggestions && showSuggestions && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {message.actions && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.actions.map((action, index) => (
                        <motion.button
                          key={index}
                          onClick={action.action}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {action.icon}
                          {action.label}
                        </motion.button>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center text-white flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-2 h-2 bg-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-2 h-2 bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-purple-200 dark:border-purple-800">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="AI에게 질문하거나 도움을 요청하세요..."
              className="pr-12 bg-white/80 dark:bg-gray-800/80 border-purple-200 dark:border-purple-700 rounded-xl"
              disabled={isLoading}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-8 w-8 p-0"
              onClick={() => setIsListening(!isListening)}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
        
        {/* Quick Settings */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1">
              <Switch 
                checked={showSuggestions} 
                onCheckedChange={setShowSuggestions}
                className="scale-75"
              />
              <span className="text-gray-600 dark:text-gray-400">제안</span>
            </label>
            <label className="flex items-center gap-1">
              <Switch 
                checked={contextAware} 
                onCheckedChange={setContextAware}
                className="scale-75"
              />
              <span className="text-gray-600 dark:text-gray-400">컨텍스트</span>
            </label>
          </div>
          
          <div className="text-gray-500 dark:text-gray-400">
            💡 {currentContext} 모드
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SmartAIAssistant;
