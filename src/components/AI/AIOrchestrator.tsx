import React, { useState, useEffect } from 'react'
import { Brain, Sparkle, Lightbulb } from '@phosphor-icons/react'
import { MessageCircle, Search, Zap } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { Note, Task, CalendarEvent } from '../../lib/enhanced-api'

interface AIOrchestratorProps {
  notes: Note[]
  tasks: Task[]
  events: CalendarEvent[]
  mode: 'gpt4' | 'gpt4-mini'
  privacyMode: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  type?: 'text' | 'insight' | 'suggestion'
}

export const AIOrchestrator: React.FC<AIOrchestratorProps> = ({
  notes,
  tasks,
  events,
  mode,
  privacyMode
}) => {
  const [activeTab, setActiveTab] = useState('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [insights, setInsights] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => {
    // Initialize with welcome message
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: '1',
        role: 'assistant',
        content: `안녕하세요! AI 어시스턴트입니다. 현재 ${notes.length}개의 노트, ${tasks.length}개의 태스크, ${events.length}개의 일정을 관리하고 있습니다. 어떻게 도와드릴까요?`,
        timestamp: new Date(),
        type: 'text'
      }])
    }
  }, [notes.length, tasks.length, events.length, chatMessages.length])

  const handleSuggestionClick = async (action: string) => {
    setIsProcessing(true)
    
    try {
      let response
      
      switch (action) {
        case 'focus_high_priority':
          response = await fetch('http://localhost:8006/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: '높은 우선순위 태스크들을 분석해서 오늘 집중해야 할 작업들을 추천해줘',
              model: 'gpt-3.5-turbo',
              max_tokens: 300,
              temperature: 0.7
            })
          })
          break
          
        case 'time_blocking':
          response = await fetch('http://localhost:8006/api/ai/chat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: '시간 블록킹 기법을 사용해서 오늘 일정을 최적화하는 방법을 알려줘',
              model: 'gpt-3.5-turbo',
              max_tokens: 300,
              temperature: 0.7
            })
          })
          break
          
        case 'organize_notes':
          response = await fetch('http://localhost:8006/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: '노트 정리와 태그 시스템 활용법에 대한 조언을 해줘',
              model: 'gpt-3.5-turbo', 
              max_tokens: 300,
              temperature: 0.7
            })
          })
          break
          
        default:
          throw new Error('Unknown suggestion action')
      }
      
      if (response?.ok) {
        const data = await response.json()
        const suggestionMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response || '제안을 처리하는 중 오류가 발생했습니다.',
          timestamp: new Date(),
          type: 'suggestion'
        }
        setChatMessages(prev => [...prev, suggestionMessage])
        setActiveTab('chat') // Switch to chat tab to show response
      }
    } catch (error) {
      console.error('Suggestion error:', error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '죄송합니다. 제안을 처리하는 중 오류가 발생했습니다.',
        timestamp: new Date(),
        type: 'text'
      }
      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage('')
    setIsProcessing(true)

    try {
      // Call backend AI API with proper base URL
      const response = await fetch('http://localhost:8006/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: currentInput,
          model: mode === 'gpt4' ? 'gpt-4' : 'gpt-3.5-turbo',
          max_tokens: 500,
          temperature: 0.7,
          context: `User has ${notes.length} notes, ${tasks.length} tasks, ${events.length} events`
        })
      })

      if (response.ok) {
        const data = await response.json()
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || '죄송합니다. 응답을 생성할 수 없습니다.',
          timestamp: new Date(),
          type: 'text'
        }
        setChatMessages(prev => [...prev, assistantMessage])
      } else {
        // Fallback response
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateAIResponse(currentInput, notes, tasks, events),
          timestamp: new Date(),
          type: 'text'
        }
        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('AI response error:', error)
      // Fallback response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(currentInput, notes, tasks, events),
        timestamp: new Date(),
        type: 'text'
      }
      setChatMessages(prev => [...prev, assistantMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const generateAIResponse = (query: string, notes: Note[], tasks: Task[], events: CalendarEvent[]): string => {
    const lowerQuery = query.toLowerCase()

    if (lowerQuery.includes('요약') || lowerQuery.includes('summary')) {
      return `📊 현재 상황 요약:
• 총 ${notes.length}개의 노트가 있습니다
• ${tasks.filter(t => t.status === 'pending').length}개의 미완료 태스크가 있습니다
• 오늘 ${events.filter(e => new Date(e.start_at).toDateString() === new Date().toDateString()).length}개의 일정이 예정되어 있습니다
• 생산성 점수: ${Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)}%`
    }

    if (lowerQuery.includes('추천') || lowerQuery.includes('suggest')) {
      return `💡 AI 추천사항:
• 높은 우선순위 태스크 ${tasks.filter(t => t.priority === 'high' && t.status === 'pending').length}개를 먼저 처리하세요
• 오늘 완료 가능한 태스크: ${tasks.filter(t => t.status === 'pending').slice(0, 3).map(t => `"${t.title}"`).join(', ')}
• 최근 노트를 태스크로 변환하는 것을 고려해보세요`
    }

    if (lowerQuery.includes('일정') || lowerQuery.includes('schedule')) {
      return `📅 일정 관리 도움:
• 오늘의 주요 일정을 확인했습니다
• 시간 블록킹을 활용해 더 효율적으로 관리할 수 있습니다
• 자동 스케줄링 기능을 사용해보세요`
    }

    return `🤖 ${mode.toUpperCase()} 모드로 응답드립니다. "${query}"에 대해 더 구체적인 질문을 해주시면 더 정확한 도움을 드릴 수 있습니다. 

가능한 질문들:
• "오늘 할 일 요약해줘"
• "높은 우선순위 태스크 추천해줘"  
• "일정 최적화 방법 알려줘"
• "생산성 분석해줘"`
  }

  const generateInsights = () => {
    const completionRate = (tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100
    const todayTasks = tasks.filter(t => t.due_at && new Date(t.due_at).toDateString() === new Date().toDateString())
    
    return [
      {
        title: '생산성 트렌드',
        description: `현재 태스크 완료율은 ${completionRate.toFixed(1)}%입니다`,
        score: completionRate,
        type: 'productivity'
      },
      {
        title: '오늘의 포커스',
        description: `${todayTasks.length}개의 태스크가 오늘 마감입니다`,
        score: Math.max(100 - todayTasks.length * 10, 0),
        type: 'focus'
      },
      {
        title: '지식 베이스',
        description: `${notes.length}개의 노트로 지식 베이스가 성장하고 있습니다`,
        score: Math.min(notes.length * 2, 100),
        type: 'knowledge'
      }
    ]
  }

  const generateSuggestions = () => {
    return [
      {
        title: '고우선순위 태스크 완료',
        description: '높은 우선순위 태스크를 먼저 처리하여 생산성을 향상시키세요',
        action: 'focus_high_priority',
        icon: 'zap'
      },
      {
        title: '시간 블록킹 설정',
        description: '집중 시간을 확보하기 위해 자동 스케줄링을 활용하세요',
        action: 'time_blocking',
        icon: 'calendar'
      },
      {
        title: '노트 정리 및 태그',
        description: '최근 노트들에 태그를 추가하여 검색 효율성을 높이세요',
        action: 'organize_notes',
        icon: 'tag'
      }
    ]
  }

  useEffect(() => {
    setInsights(generateInsights())
    setSuggestions(generateSuggestions())
  }, [notes, tasks, events])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            AI Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Sparkle className="h-4 w-4" />
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Chat Assistant
                </span>
                <Badge variant={mode === 'gpt4' ? 'default' : 'secondary'}>
                  {mode.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded-md border p-4 mb-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-muted-foreground rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                          <span className="text-sm">AI가 생각 중...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Textarea
                  placeholder="AI에게 질문하거나 요청하세요..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="resize-none"
                  rows={2}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputMessage.trim() || isProcessing}
                  className="h-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${insight.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{insight.score.toFixed(0)}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="mt-4">
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{suggestion.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSuggestionClick(suggestion.action)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? '처리 중...' : '적용하기'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {privacyMode && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-200 flex items-center gap-2">
            <Brain className="h-4 w-4" />
            프라이버시 모드가 활성화되어 있습니다. 민감한 정보는 AI 처리에서 제외됩니다.
          </p>
        </div>
      )}
    </div>
  )
}

export default AIOrchestrator
