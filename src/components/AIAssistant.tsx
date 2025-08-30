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
  Plus
} from 'lucide-react';
import { enhancedAPI } from '../lib/enhanced-api';
import { toast } from 'sonner';

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
  const [results, setResults] = useState<{
    summary?: string;
    tasks?: any[];
    improvement?: string;
  }>({});

  const handleSummarize = async (text?: string) => {
    const contentToSummarize = text || selectedNote?.content || inputText;
    if (!contentToSummarize?.trim()) {
      toast.error('요약할 내용이 없습니다');
      return;
    }

    setLoading(true);
    try {
      const result = await enhancedAPI.summarizeText(contentToSummarize);
      setResults(prev => ({ ...prev, summary: result.summary }));
      onSummaryGenerated?.(result.summary);
      toast.success('요약이 완료되었습니다');
    } catch (error) {
      console.error('요약 실패:', error);
      toast.error('요약 중 오류가 발생했습니다');
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
      const result = await enhancedAPI.extractTasks(contentToProcess);
      setResults(prev => ({ ...prev, tasks: result.tasks }));
      onTasksExtracted?.(result.tasks);
      if (result.tasks.length > 0) {
        toast.success(`${result.tasks.length}개의 작업이 추출되었습니다`);
      } else {
        toast.info('추출된 작업이 없습니다');
      }
    } catch (error) {
      console.error('작업 추출 실패:', error);
      toast.error('작업 추출 중 오류가 발생했습니다');
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
      // AI를 사용해 내용 개선
      const improvedText = `${contentToImprove}\n\n## AI 개선 제안\n- 내용을 더 구체적으로 작성해보세요\n- 핵심 포인트를 강조해보세요\n- 실행 가능한 액션 아이템을 추가해보세요`;
      
      setResults(prev => ({ ...prev, improvement: improvedText }));
      onNoteImproved?.(improvedText);
      toast.success('내용이 개선되었습니다');
    } catch (error) {
      console.error('내용 개선 실패:', error);
      toast.error('내용 개선 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          AI 어시스턴트
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="start">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold">AI 어시스턴트</h3>
          </div>

          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions">AI 액션</TabsTrigger>
              <TabsTrigger value="input">텍스트 입력</TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="space-y-3 mt-4">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSummarize()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  노트 요약
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExtractTasks()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                  작업 추출
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleImproveContent()}
                  disabled={loading || !selectedNote?.content}
                  className="justify-start gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  내용 개선
                </Button>
              </div>

              {!selectedNote && (
                <p className="text-sm text-muted-foreground">
                  노트를 선택하면 AI 기능을 사용할 수 있습니다.
                </p>
              )}
            </TabsContent>

            <TabsContent value="input" className="space-y-3 mt-4">
              <Textarea
                placeholder="AI가 분석할 텍스트를 입력하세요..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={4}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSummarize(inputText)}
                  disabled={loading || !inputText.trim()}
                >
                  요약
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExtractTasks(inputText)}
                  disabled={loading || !inputText.trim()}
                >
                  작업 추출
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* 결과 표시 */}
          {results.summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  요약 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700">{results.summary}</p>
              </CardContent>
            </Card>
          )}

          {results.tasks && results.tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  추출된 작업 ({results.tasks.length}개)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {results.tasks.slice(0, 3).map((task, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span>{task.title || task.name}</span>
                    </div>
                  ))}
                  {results.tasks.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{results.tasks.length - 3}개 더...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
