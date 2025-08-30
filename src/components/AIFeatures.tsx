import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Target, 
  Zap, 
  FileText, 
  CheckCircle,
  Clock,
  Search,
  Sparkles
} from 'lucide-react';
import { enhancedAPI } from '@/lib/enhanced-api.ts';

interface AIFeaturesProps {
  onTasksExtracted?: (tasks: any[]) => void;
  onSummaryGenerated?: (summary: string) => void;
}

export const AIFeatures: React.FC<AIFeaturesProps> = ({ 
  onTasksExtracted, 
  onSummaryGenerated 
}) => {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<any[]>([]);
  const [productivity, setProductivity] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      const result = await enhancedAPI.summarizeText(inputText, 'concise');
      setSummary(result.summary);
      onSummaryGenerated?.(result.summary);
    } catch (error) {
      console.error('요약 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractTasks = async () => {
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      const result = await enhancedAPI.extractTasks(inputText);
      setExtractedTasks(result.tasks);
      onTasksExtracted?.(result.tasks);
    } catch (error) {
      console.error('작업 추출 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductivityAnalysis = async () => {
    setLoading(true);
    try {
      const result = await enhancedAPI.getProductivityAnalysis();
      setProductivity(result);
    } catch (error) {
      console.error('생산성 분석 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSmartSuggestions = async () => {
    setLoading(true);
    try {
      const result = await enhancedAPI.getSmartSuggestions();
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('스마트 제안 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI 기능
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="summarize" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summarize">
                <FileText className="h-4 w-4 mr-2" />
                요약
              </TabsTrigger>
              <TabsTrigger value="extract">
                <CheckCircle className="h-4 w-4 mr-2" />
                작업 추출
              </TabsTrigger>
              <TabsTrigger value="productivity">
                <TrendingUp className="h-4 w-4 mr-2" />
                생산성 분석
              </TabsTrigger>
              <TabsTrigger value="suggestions">
                <Lightbulb className="h-4 w-4 mr-2" />
                스마트 제안
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summarize" className="space-y-4">
              <div>
                <Textarea
                  placeholder="요약할 텍스트를 입력하세요..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSummarize} 
                  disabled={loading || !inputText.trim()}
                  className="mt-2"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {loading ? '요약 중...' : 'AI 요약'}
                </Button>
              </div>
              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">요약 결과</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{summary}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="extract" className="space-y-4">
              <div>
                <Textarea
                  placeholder="작업을 추출할 텍스트를 입력하세요..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleExtractTasks} 
                  disabled={loading || !inputText.trim()}
                  className="mt-2"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {loading ? '추출 중...' : '작업 추출'}
                </Button>
              </div>
              {extractedTasks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">추출된 작업</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {extractedTasks.map((task, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{task.title || task.name}</span>
                          {task.priority && (
                            <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'}>
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="productivity" className="space-y-4">
              <Button 
                onClick={handleProductivityAnalysis} 
                disabled={loading}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {loading ? '분석 중...' : '생산성 분석'}
              </Button>
              
              {productivity && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">생산성 점수</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Progress value={productivity.score} className="flex-1" />
                        <span className="text-lg font-bold">{productivity.score}%</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {productivity.recommendations?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">추천사항</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {productivity.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              <Button 
                onClick={handleSmartSuggestions} 
                disabled={loading}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                {loading ? '생성 중...' : '스마트 제안 받기'}
              </Button>
              
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">스마트 제안</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-sm">
                              {suggestion.type || '제안'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {suggestion.content || suggestion.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
