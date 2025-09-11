import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Lightbulb, 
  Target, 
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  X,
  ThumbsUp,
  ThumbsDown,
  Wand2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  dueDate?: string;
  energy?: number;
  category?: string;
}

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}

interface Suggestion {
  id: string;
  type: 'task' | 'note' | 'calendar' | 'productivity' | 'collaboration' | 'insight';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    handler: () => void;
  };
  data?: any;
  createdAt: string;
}

interface SmartSuggestionsProps {
  notes: Note[];
  tasks: Task[];
  events: Event[];
  onCreateTask: (task: Partial<Task>) => void;
  onCreateNote: (note: Partial<Note>) => void;
  onCreateEvent: (event: Partial<Event>) => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  notes,
  tasks,
  events,
  onCreateTask,
  onCreateNote,
  onCreateEvent
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    taskSuggestions: true,
    productivityInsights: true,
    calendarOptimizations: true,
    collaborationTips: true
  });

  // AI-powered analysis and suggestions
  const generateSuggestions = useMemo(() => {
    const allSuggestions: Suggestion[] = [];

    // 1. Task Management Suggestions
    if (userPreferences.taskSuggestions) {
      // Overdue tasks
      const overdueTasks = tasks.filter(task => 
        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
      );
      
      if (overdueTasks.length > 0) {
        allSuggestions.push({
          id: 'overdue-tasks',
          type: 'task',
          title: `${overdueTasks.length}개의 지연된 작업이 있습니다`,
          description: '지연된 작업들을 우선순위에 따라 재정리하고 일정을 조정해보세요.',
          confidence: 95,
          priority: 'high',
          action: {
            label: '지연된 작업 보기',
            handler: () => toast.info('작업 페이지로 이동합니다')
          },
          createdAt: new Date().toISOString()
        });
      }

      // High energy tasks during low energy time
      const highEnergyTasks = tasks.filter(task => 
        task.energy && task.energy > 7 && task.status === 'todo'
      );
      
      if (highEnergyTasks.length > 0) {
        allSuggestions.push({
          id: 'energy-optimization',
          type: 'productivity',
          title: '에너지 최적화 제안',
          description: `${highEnergyTasks.length}개의 고에너지 작업을 오전 시간대에 배치해보세요.`,
          confidence: 80,
          priority: 'medium',
          action: {
            label: '일정 조정하기',
            handler: () => {
              // Create calendar events for high energy tasks in morning
              highEnergyTasks.forEach(task => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                
                onCreateEvent({
                  title: `🎯 ${task.title}`,
                  description: `고에너지 작업: ${task.description}`,
                  startDate: tomorrow.toISOString(),
                  endDate: new Date(tomorrow.getTime() + 90 * 60000).toISOString()
                });
              });
              toast.success('고에너지 작업들을 오전 시간에 예약했습니다!');
            }
          },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 2. Productivity Insights
    if (userPreferences.productivityInsights) {
      // Task completion patterns
      const completedTasks = tasks.filter(task => task.status === 'completed');
      const totalTasks = tasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

      if (completionRate < 60 && totalTasks > 5) {
        allSuggestions.push({
          id: 'completion-rate',
          type: 'insight',
          title: '작업 완료율 개선',
          description: `현재 완료율이 ${Math.round(completionRate)}%입니다. 작은 작업부터 시작해보세요.`,
          confidence: 75,
          priority: 'medium',
          action: {
            label: '쉬운 작업 추천받기',
            handler: () => {
              const easyTasks = tasks.filter(task => 
                task.energy && task.energy <= 5 && task.status === 'todo'
              );
              if (easyTasks.length > 0) {
                toast.success(`${easyTasks.length}개의 쉬운 작업을 찾았습니다!`);
              }
            }
          },
          createdAt: new Date().toISOString()
        });
      }

      // Note-to-task conversion suggestion
      const actionableNotes = notes.filter(note => 
        note.content.includes('TODO') || 
        note.content.includes('할 일') ||
        note.content.includes('해야') ||
        note.tags.some(tag => ['action', 'todo', '할일'].includes(tag.toLowerCase()))
      );

      if (actionableNotes.length > 0) {
        allSuggestions.push({
          id: 'note-to-task',
          type: 'note',
          title: '노트에서 작업 추출',
          description: `${actionableNotes.length}개의 노트에서 실행 가능한 작업을 찾았습니다.`,
          confidence: 70,
          priority: 'medium',
          action: {
            label: '작업으로 변환',
            handler: () => {
              actionableNotes.forEach(note => {
                // Extract potential tasks from note content
                const taskTitle = note.title.startsWith('TODO') ? 
                  note.title.replace('TODO:', '').trim() : 
                  `노트에서 추출: ${note.title}`;
                
                onCreateTask({
                  title: taskTitle,
                  description: note.content.substring(0, 200),
                  priority: 'medium',
                  category: 'from-notes'
                });
              });
              toast.success(`${actionableNotes.length}개의 작업을 생성했습니다!`);
            }
          },
          data: { notes: actionableNotes },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 3. Calendar Optimization
    if (userPreferences.calendarOptimizations) {
      const today = new Date();
      const todayEvents = events.filter(event => 
        new Date(event.startDate).toDateString() === today.toDateString()
      );

      if (todayEvents.length > 5) {
        allSuggestions.push({
          id: 'calendar-overload',
          type: 'calendar',
          title: '일정 과부하 경고',
          description: `오늘 ${todayEvents.length}개의 일정이 있습니다. 일부를 다른 날로 옮겨보세요.`,
          confidence: 85,
          priority: 'high',
          createdAt: new Date().toISOString()
        });
      }

      // Meeting-free time suggestion
      const workingHours = 8;
      const meetingHours = todayEvents.length * 1; // Assume 1 hour per meeting
      const focusTime = workingHours - meetingHours;

      if (focusTime < 4 && todayEvents.length > 3) {
        allSuggestions.push({
          id: 'focus-time',
          type: 'productivity',
          title: '집중 시간 부족',
          description: `오늘 집중 시간이 ${focusTime}시간밖에 없습니다. "집중 시간" 블록을 예약해보세요.`,
          confidence: 80,
          priority: 'medium',
          action: {
            label: '집중 시간 예약',
            handler: () => {
              const focusStart = new Date();
              focusStart.setHours(14, 0, 0, 0); // 2 PM
              const focusEnd = new Date(focusStart);
              focusEnd.setHours(16, 0, 0, 0); // 4 PM
              
              onCreateEvent({
                title: '🧠 집중 시간 (방해 금지)',
                description: '깊은 집중이 필요한 작업을 위한 시간',
                startDate: focusStart.toISOString(),
                endDate: focusEnd.toISOString()
              });
              toast.success('집중 시간이 예약되었습니다!');
            }
          },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 4. Collaboration Suggestions
    if (userPreferences.collaborationTips) {
      const teamTasks = tasks.filter(task => 
        task.description?.includes('@') || 
        task.category?.includes('team') ||
        task.category?.includes('meeting')
      );

      if (teamTasks.length > 0) {
        allSuggestions.push({
          id: 'team-collaboration',
          type: 'collaboration',
          title: '팀 협업 개선',
          description: `${teamTasks.length}개의 팀 작업이 있습니다. 정기 체크인을 예약해보세요.`,
          confidence: 70,
          priority: 'medium',
          action: {
            label: '팀 미팅 예약',
            handler: () => {
              const nextWeek = new Date();
              nextWeek.setDate(nextWeek.getDate() + 7);
              nextWeek.setHours(10, 0, 0, 0);
              
              onCreateEvent({
                title: '👥 팀 체크인 미팅',
                description: '진행 중인 프로젝트 상황 공유 및 협업 개선',
                startDate: nextWeek.toISOString(),
                endDate: new Date(nextWeek.getTime() + 60 * 60000).toISOString()
              });
              toast.success('팀 체크인 미팅이 예약되었습니다!');
            }
          },
          createdAt: new Date().toISOString()
        });
      }
    }

    // 5. Smart Learning Suggestions
    const learningKeywords = ['학습', '공부', '연구', 'learn', 'study', 'research'];
    const learningContent = [...notes, ...tasks].filter(item =>
      learningKeywords.some(keyword => 
        item.title.toLowerCase().includes(keyword) ||
        (item as any).content?.toLowerCase().includes(keyword)
      )
    );

    if (learningContent.length > 2) {
      allSuggestions.push({
        id: 'learning-schedule',
        type: 'productivity',
        title: '학습 스케줄 최적화',
        description: `${learningContent.length}개의 학습 관련 항목을 발견했습니다. 정기적인 학습 시간을 만들어보세요.`,
        confidence: 75,
        priority: 'medium',
        action: {
          label: '학습 일정 만들기',
          handler: () => {
            // Create weekly learning session
            const learningTime = new Date();
            learningTime.setDate(learningTime.getDate() + 1);
            learningTime.setHours(19, 0, 0, 0);
            
            onCreateEvent({
              title: '📚 학습 시간',
              description: '개인 성장을 위한 학습 및 연구 시간',
              startDate: learningTime.toISOString(),
              endDate: new Date(learningTime.getTime() + 90 * 60000).toISOString()
            });
            toast.success('정기 학습 시간이 설정되었습니다!');
          }
        },
        createdAt: new Date().toISOString()
      });
    }

    return allSuggestions.filter(s => !dismissedSuggestions.has(s.id));
  }, [notes, tasks, events, dismissedSuggestions, userPreferences]);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions.slice(0, 5)); // Show top 5 suggestions
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [generateSuggestions]);

  const dismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    toast.success('제안이 숨겨졌습니다');
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'task': return <Target className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'productivity': return <TrendingUp className="h-4 w-4" />;
      case 'collaboration': return <Users className="h-4 w-4" />;
      case 'insight': return <BarChart3 className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200/50 dark:border-blue-700/50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-8 w-8 text-blue-600" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                AI가 분석 중입니다...
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                더 나은 생산성을 위한 맞춤 제안을 준비하고 있어요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-900/10 dark:to-blue-900/10 border-green-200/50 dark:border-green-700/50">
        <CardContent className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
            모든 것이 완벽해 보여요! 🎉
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            현재 특별한 개선 제안이 없습니다. 계속 좋은 습관을 유지하세요!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold">AI 맞춤 제안</h2>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            {suggestions.length}개
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {suggestion.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {suggestion.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority === 'high' ? '높음' : 
                             suggestion.priority === 'medium' ? '보통' : '낮음'}
                          </Badge>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissSuggestion(suggestion.id)}
                            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">신뢰도</span>
                          <Progress 
                            value={suggestion.confidence} 
                            className="w-16 h-1"
                          />
                          <span className="text-xs font-medium text-gray-600">
                            {suggestion.confidence}%
                          </span>
                        </div>

                        {suggestion.action && (
                          <Button
                            onClick={suggestion.action.handler}
                            size="sm"
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-7 text-xs"
                          >
                            {suggestion.action.label}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};