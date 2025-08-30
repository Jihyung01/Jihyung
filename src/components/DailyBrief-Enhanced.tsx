import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Brain,
  Target,
  Zap,
  Plus,
  RefreshCw,
  Star,
  AlertCircle
} from 'lucide-react';
import enhancedAPI, { type DailyBrief as DailyBriefType, type Task, type Note, type CalendarEvent } from '@/lib/enhanced-api';
import { format, isToday, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

export const DailyBrief: React.FC = () => {
  const [briefData, setBriefData] = useState<DailyBriefType | null>(null);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      
      // 병렬로 모든 데이터 로드
      const today = format(new Date(), 'yyyy-MM-dd');
      const [brief, tasks, notes, events] = await Promise.all([
        enhancedAPI.getDailyBrief(today).catch(() => null),
        enhancedAPI.getTodayTasks().catch(() => []),
        enhancedAPI.getRecentNotes(5).catch(() => []),
        enhancedAPI.getCalendarEvents(
          format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss"),
          format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss")
        ).catch(() => [])
      ]);

      setBriefData(brief);
      setTodayTasks(tasks);
      setRecentNotes(notes);
      setTodayEvents(events);
    } catch (error) {
      console.error('Failed to load daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadDailyData();
    setRefreshing(false);
  };

  const toggleTaskStatus = async (taskId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await enhancedAPI.updateTask(taskId, { 
        status: newStatus,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
      });
      await loadDailyData(); // 데이터 새로고침
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  useEffect(() => {
    loadDailyData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedTasks = todayTasks.filter(task => task.status === 'completed');
  const pendingTasks = todayTasks.filter(task => task.status !== 'completed');
  const completionRate = todayTasks.length > 0 ? (completedTasks.length / todayTasks.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">오늘의 브리핑</h2>
          <p className="text-muted-foreground">
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 생산성 요약 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            오늘의 생산성
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{todayTasks.length}</div>
              <div className="text-sm text-muted-foreground">총 작업</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <div className="text-sm text-muted-foreground">완료됨</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
              <div className="text-sm text-muted-foreground">진행 중</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Math.round(completionRate)}%</div>
              <div className="text-sm text-muted-foreground">완료율</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>진행률</span>
              <span>{Math.round(completionRate)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 오늘의 작업 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                오늘의 작업
              </div>
              <Badge variant="secondary">{todayTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>오늘 예정된 작업이 없습니다</p>
                  <Button size="sm" className="mt-2 gap-2">
                    <Plus className="w-4 h-4" />
                    작업 추가
                  </Button>
                </div>
              ) : (
                todayTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                    >
                      <CheckCircle2 
                        className={`w-5 h-5 ${
                          task.status === 'completed' 
                            ? 'text-green-600 fill-green-100' 
                            : 'text-muted-foreground'
                        }`} 
                      />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                        {task.energy && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Zap className="w-3 h-3" />
                            {task.energy}/10
                          </div>
                        )}
                        {task.due_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.due_at), 'HH:mm')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 노트 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                최근 노트
              </div>
              <Badge variant="secondary">{recentNotes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>최근 작성된 노트가 없습니다</p>
                  <Button size="sm" className="mt-2 gap-2">
                    <Plus className="w-4 h-4" />
                    노트 작성
                  </Button>
                </div>
              ) : (
                recentNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="font-medium mb-1">{note.title || '제목 없음'}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {note.content.slice(0, 100)}...
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {note.tags.map((tag) => (
                          <Badge key={tag} variant="outline" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(note.updated_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 오늘의 일정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              오늘의 일정
            </div>
            <Badge variant="secondary">{todayEvents.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>오늘 예정된 일정이 없습니다</p>
                <Button size="sm" className="mt-2 gap-2">
                  <Plus className="w-4 h-4" />
                  일정 추가
                </Button>
              </div>
            ) : (
              todayEvents.map((event) => (
                <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                  <div className="w-2 h-12 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(event.start_at), 'HH:mm')} - {format(new Date(event.end_at), 'HH:mm')}
                      {event.location && (
                        <>
                          <Separator orientation="vertical" className="h-3" />
                          {event.location}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI 인사이트 */}
      {briefData?.insights && briefData.insights.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              AI 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {briefData.insights.map((insight, index) => (
                <div key={index} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium text-sm">{insight.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{insight.description}</div>
                      {insight.score && (
                        <div className="text-xs text-primary font-medium mt-1">
                          점수: {insight.score}/100
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
