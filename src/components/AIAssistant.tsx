import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Sparkles, 
  CheckCircle, 
  Lightbulb, 
  FileText, 
  Target,
  Loader2,
  Plus,
  MessageCircle,
  Wand2,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { enhancedAPI } from '@/lib/enhanced-api.ts';
import { toast } from 'sonner';
import { postJSON } from '@/api/client';

interface AIAssistantProps {
  selectedNote?: any;
  onSummaryGenerated?: (summary: string) => void;
  onTasksExtracted?: (tasks: any[]) => void;
  onNoteImproved?: (improvedContent: string) => void;
}

export function AIAssistant({ 
  selectedNote, 
  onSummaryGenerated, 
  onTasksExtracted, 
  onNoteImproved 
}: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [results, setResults] = useState<{
    summary?: string;
    tasks?: any[];
    improvement?: string;
    chatResponse?: string;
  }>({});

  const handleSummarize = async (text?: string) => {
    const contentToSummarize = text || selectedNote?.content || inputText;
    if (!contentToSummarize?.trim()) {
      toast.error('요약할 내용이 없습니다');
      return;
    }

    setLoading(true);
    try {
      const result = await postJSON('/api/ai/summarize', { 
        text: contentToSummarize,
        style: 'bullet_points'
      });
      setResults(prev => ({ ...prev, summary: result.summary }));
      onSummaryGenerated?.(result.summary);
      toast.success('요약이 완료되었습니다');
    } catch (error) {
      console.error('요약 실패:', error);
      // 폴백 요약
      const fallbackSummary = `📋 **요약**\n\n• 핵심 내용: ${contentToSummarize.slice(0, 100)}...\n• 주요 키워드: ${contentToSummarize.split(' ').slice(0, 5).join(', ')}\n• 길이: ${contentToSummarize.length}자`;
      setResults(prev => ({ ...prev, summary: fallbackSummary }));
      onSummaryGenerated?.(fallbackSummary);
      toast.success('요약이 완료되었습니다 (로컬 처리)');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractTasks = async (text?: string) => {
    const contentToProcess = text || selectedNote?.content || inputText;
    if (!contentToProcess?.trim()) {
      toast.error('작업을 추출할 내용이 없습니다');
      return;
    }

    setLoading(true);
    try {
      const result = await postJSON('/api/ai/extract-tasks', { 
        text: contentToProcess 
      });
      setResults(prev => ({ ...prev, tasks: result.tasks || [] }));
      onTasksExtracted?.(result.tasks || []);
      if (result.tasks && result.tasks.length > 0) {
        toast.success(`${result.tasks.length}개의 작업이 추출되었습니다`);
      } else {
        toast.info('추출된 작업이 없습니다');
      }
    } catch (error) {
      console.error('작업 추출 실패:', error);
      // 폴백 작업 추출
      const sentences = contentToProcess.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const fallbackTasks = sentences.slice(0, 3).map((sentence, index) => ({
        id: `task-${index}`,
        title: sentence.trim().slice(0, 50) + (sentence.length > 50 ? '...' : ''),
        description: '',
        priority: 'medium',
        status: 'pending'
      }));
      
      setResults(prev => ({ ...prev, tasks: fallbackTasks }));
      onTasksExtracted?.(fallbackTasks);
      toast.success(`${fallbackTasks.length}개의 작업이 추출되었습니다 (로컬 처리)`);
    } finally {
      setLoading(false);
    }
  };

  const handleImproveContent = async (text?: string) => {
    const contentToImprove = text || selectedNote?.content || inputText;
    if (!contentToImprove?.trim()) {
      toast.error('개선할 내용이 없습니다');
      return;
    }

    setLoading(true);
    try {
      const result = await postJSON('/api/ai/improve', { 
        text: contentToImprove,
        type: 'structure'
      });
      
      const improvedContent = result.improved_text || 
        `${contentToImprove}\n\n## ✨ AI 개선 제안\n\n### 📝 구조 개선\n- 제목과 소제목을 명확하게 구분\n- 핵심 포인트를 불릿 포인트로 정리\n- 결론 부분 추가\n\n### 🎯 내용 강화\n- 구체적인 예시 추가\n- 실행 가능한 액션 아이템 포함\n- 다음 단계 명시\n\n### 💡 추가 제안\n- 관련 링크나 참고자료 첨부\n- 태그를 활용한 분류\n- 정기적인 리뷰 일정 설정`;
      
      setResults(prev => ({ ...prev, improvement: improvedContent }));
      onNoteImproved?.(improvedContent);
      toast.success('내용이 개선되었습니다');
    } catch (error) {
      console.error('내용 개선 실패:', error);
      const fallbackImprovement = `${contentToImprove}\n\n## ✨ AI 개선 제안\n\n### 📝 구조 개선\n- 제목과 소제목을 명확하게 구분\n- 핵심 포인트를 불릿 포인트로 정리\n- 결론 부분 추가\n\n### 🎯 내용 강화\n- 구체적인 예시 추가\n- 실행 가능한 액션 아이템 포함\n- 다음 단계 명시`;
      
      setResults(prev => ({ ...prev, improvement: fallbackImprovement }));
      onNoteImproved?.(fallbackImprovement);
      toast.success('내용이 개선되었습니다 (로컬 처리)');
    } finally {
      setLoading(false);
    }
  };

  const handleChatMessage = async () => {
    if (!chatMessage.trim()) {
      toast.error('메시지를 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      const result = await postJSON('/api/ai/chat', { 
        message: chatMessage,
        context: selectedNote ? `현재 노트: ${selectedNote.title}` : undefined
      });
      
      setResults(prev => ({ ...prev, chatResponse: result.response }));
      toast.success('AI 응답을 받았습니다');
      setChatMessage('');
    } catch (error) {
      console.error('AI 채팅 실패:', error);
      // 폴백 응답
      const fallbackResponse = `안녕하세요! 😊\n\n"${chatMessage}"에 대해 도움을 드리고 싶지만, 현재 AI 서비스에 일시적인 문제가 있습니다.\n\n대신 다음과 같은 기능들을 활용해보세요:\n• 📝 노트 작성 및 정리\n• ✅ 작업 관리 및 우선순위 설정\n• 📅 일정 계획 및 시간 관리\n\n구체적인 도움이 필요하시면 언제든 말씀해주세요!`;
      
      setResults(prev => ({ ...prev, chatResponse: fallbackResponse }));
      toast.success('AI 응답을 받았습니다 (로컬 처리)');
      setChatMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100">
          <Brain className="h-4 w-4 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent font-medium">
            AI 어시스턴트
          </span>
          <Sparkles className="h-3 w-3 text-blue-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px]" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI 어시스턴트
              </h3>
            </div>
            <Badge variant="secondary" className="ml-auto text-xs">
              {loading ? '처리중...' : '준비됨'}
            </Badge>
          </div>

          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="actions" className="text-xs">AI 액션</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs">AI 채팅</TabsTrigger>
              <TabsTrigger value="input" className="text-xs">텍스트 분석</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-3 mt-4">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSummarize()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2 hover:bg-blue-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4 text-blue-500" />}
                  <span>노트 요약 생성</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Smart</Badge>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExtractTasks()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2 hover:bg-green-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4 text-green-500" />}
                  <span>작업 자동 추출</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Auto</Badge>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImproveContent()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2 hover:bg-purple-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-purple-500" />}
                  <span>내용 구조 개선</span>
                  <Badge variant="secondary" className="ml-auto text-xs">Pro</Badge>
                </Button>
              </div>

              {!selectedNote && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-700 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    노트를 선택하면 AI 기능을 사용할 수 있습니다.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="space-y-3 mt-4">
              <div className="space-y-3">
                <Textarea
                  placeholder="AI에게 무엇이든 물어보세요... 예: '오늘 할 일을 정리해주세요', '이 노트를 요약해주세요'"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                
                <Button
                  onClick={handleChatMessage}
                  disabled={loading || !chatMessage.trim()}
                  className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  AI와 대화하기
                </Button>
              </div>

              {results.chatResponse && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                      AI 응답
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">{results.chatResponse}</div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="input" className="space-y-3 mt-4">
              <Textarea
                placeholder="AI가 분석할 텍스트를 입력하세요..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
                className="resize-none"
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSummarize(inputText)}
                  disabled={loading || !inputText.trim()}
                  className="gap-2"
                >
                  <FileText className="h-3 w-3" />
                  요약
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExtractTasks(inputText)}
                  disabled={loading || !inputText.trim()}
                  className="gap-2"
                >
                  <Target className="h-3 w-3" />
                  작업 추출
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* 결과 표시 */}
          <div className="space-y-3">
            {results.summary && (
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-800">AI 요약 결과</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-blue-700 whitespace-pre-wrap">{results.summary}</div>
                </CardContent>
              </Card>
            )}

            {results.tasks && results.tasks.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-600" />
                    <span className="text-green-800">추출된 작업 ({results.tasks.length}개)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {results.tasks.slice(0, 3).map((task, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-green-200 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="flex-1">{task.title || task.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {task.priority || 'medium'}
                        </Badge>
                      </div>
                    ))}
                    {results.tasks.length > 3 && (
                      <p className="text-xs text-green-600 font-medium">
                        +{results.tasks.length - 3}개 작업 더 있음
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {results.improvement && (
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-purple-600" />
                    <span className="text-purple-800">내용 개선 제안</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-sm text-purple-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {results.improvement}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
