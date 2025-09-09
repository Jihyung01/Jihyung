import { useState, useCallback } from 'react'

export interface AIResponse {
  id: string
  text: string
  timestamp: Date
  confidence: number
  type: 'response' | 'suggestion' | 'error'
  metadata?: {
    processingTime?: number
    model?: string
    tokens?: number
  }
}

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: {
    type: 'image' | 'file' | 'url'
    url: string
    name: string
  }[]
}

export interface SmartSuggestion {
  type: 'urgent' | 'schedule' | 'productivity'
  title: string
  description: string
  action: string
}

export const useRealAI = () => {
  const [conversations, setConversations] = useState<ConversationMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 실제 AI 응답 생성 (OpenAI API 시뮬레이션)
  const generateAIResponse = useCallback(async (prompt: string, context?: string): Promise<AIResponse> => {
    setIsProcessing(true)
    setError(null)

    const startTime = Date.now()

    try {
      // 실제 환경에서는 OpenAI API를 호출
      // 여기서는 지능적인 응답 시뮬레이션을 구현
      
      const response = await simulateAIResponse(prompt, context)
      const processingTime = Date.now() - startTime

      const aiResponse: AIResponse = {
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: response.text,
        timestamp: new Date(),
        confidence: response.confidence,
        type: 'response',
        metadata: {
          processingTime,
          model: 'gpt-4-mini-simulation',
          tokens: response.text.length
        }
      }

      return aiResponse
    } catch (error) {
      throw new Error(`AI processing failed: ${error}`)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // AI 응답 시뮬레이션
  const simulateAIResponse = async (prompt: string, context?: string) => {
    // 실제 지능적인 응답을 위한 키워드 분석
    const lowerPrompt = prompt.toLowerCase()
    
    // 딜레이 시뮬레이션 (실제 API 호출처럼)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    let response = ''
    let confidence = 0.8

    // 태스크 관련 질문
    if (lowerPrompt.includes('task') || lowerPrompt.includes('할 일') || lowerPrompt.includes('업무')) {
      const taskResponses = [
        "태스크 관리에 도움을 드리겠습니다. 새로운 할 일을 추가하거나 기존 태스크의 우선순위를 조정해드릴 수 있습니다.",
        "효율적인 태스크 관리를 위해 우선순위 설정과 시간 추적을 추천합니다. 어떤 태스크에 집중하고 싶으신가요?",
        "오늘의 할 일 목록을 검토해보겠습니다. 가장 중요한 태스크부터 처리하는 것을 권장합니다.",
        "태스크를 카테고리별로 분류하고 예상 소요 시간을 설정하면 더 효율적으로 관리할 수 있습니다."
      ]
      response = taskResponses[Math.floor(Math.random() * taskResponses.length)]
      confidence = 0.9
    }
    // 캘린더 관련 질문
    else if (lowerPrompt.includes('calendar') || lowerPrompt.includes('캘린더') || lowerPrompt.includes('일정')) {
      const calendarResponses = [
        "캘린더를 확인하여 일정을 조정해드리겠습니다. 새로운 이벤트를 추가하거나 기존 일정을 수정할 수 있습니다.",
        "이번 주 일정을 검토해보니 몇 가지 최적화 제안이 있습니다. 회의 시간을 조정하거나 여유 시간을 확보하는 것은 어떨까요?",
        "반복 일정 설정으로 정기적인 업무나 미팅을 자동화할 수 있습니다. 어떤 일정을 반복 설정하고 싶으신가요?",
        "일정 충돌을 방지하기 위해 버퍼 타임을 설정하는 것을 권장합니다."
      ]
      response = calendarResponses[Math.floor(Math.random() * calendarResponses.length)]
      confidence = 0.85
    }
    // 시간 관리 관련
    else if (lowerPrompt.includes('time') || lowerPrompt.includes('시간') || lowerPrompt.includes('관리')) {
      const timeResponses = [
        "시간 관리 개선을 위해 포모도로 기법을 사용해보세요. 25분 집중 + 5분 휴식의 사이클로 생산성을 높일 수 있습니다.",
        "시간 추적 기능을 활용하여 각 태스크에 소요되는 실제 시간을 파악하고 예상 시간의 정확도를 높여보세요.",
        "가장 중요한 일을 아침에 처리하고, 에너지가 낮은 시간대에는 단순한 업무를 배치하는 것을 권장합니다.",
        "일정 간 이동 시간과 준비 시간을 고려하여 여유 있는 스케줄을 만드는 것이 좋습니다."
      ]
      response = timeResponses[Math.floor(Math.random() * timeResponses.length)]
      confidence = 0.88
    }
    // 생산성 관련
    else if (lowerPrompt.includes('productivity') || lowerPrompt.includes('생산성') || lowerPrompt.includes('효율')) {
      const productivityResponses = [
        "생산성 향상을 위해 현재 진행 중인 태스크를 분석하고 불필요한 업무를 제거하는 것을 추천합니다.",
        "집중력 향상을 위해 알림을 끄고 집중 모드를 활성화해보세요. 정해진 시간 동안 한 가지 작업에만 집중하세요.",
        "배치 처리 방식으로 유사한 업무들을 묶어서 처리하면 컨텍스트 스위칭 비용을 줄일 수 있습니다.",
        "정기적인 리뷰를 통해 완료한 작업을 점검하고 개선점을 찾아보세요."
      ]
      response = productivityResponses[Math.floor(Math.random() * productivityResponses.length)]
      confidence = 0.87
    }
    // 일반적인 도움 요청
    else if (lowerPrompt.includes('help') || lowerPrompt.includes('도움') || lowerPrompt.includes('어떻게')) {
      const helpResponses = [
        "무엇을 도와드릴까요? 태스크 관리, 캘린더 일정 조정, 시간 관리 팁 등 다양한 기능을 제공합니다.",
        "이 앱의 주요 기능들을 소개해드리겠습니다: 스마트 태스크 관리, 실시간 캘린더 동기화, AI 기반 추천 시스템이 있습니다.",
        "구체적으로 어떤 부분에 대해 도움이 필요하신지 말씀해주시면 더 정확한 안내를 드릴 수 있습니다.",
        "단축키나 팁을 알고 싶으시면 언제든 물어보세요. 효율적인 사용법을 알려드리겠습니다."
      ]
      response = helpResponses[Math.floor(Math.random() * helpResponses.length)]
      confidence = 0.75
    }
    // 기본 응답
    else {
      const generalResponses = [
        "죄송합니다. 정확히 이해하지 못했습니다. 태스크 관리, 캘린더 일정, 또는 시간 관리에 대해 구체적으로 질문해주세요.",
        "더 구체적인 질문을 해주시면 더 정확한 도움을 드릴 수 있습니다. 어떤 기능을 사용하고 싶으신가요?",
        "현재 태스크 관리와 캘린더 기능에 특화되어 있습니다. 관련된 질문을 해주시면 최선을 다해 도와드리겠습니다.",
        "이해할 수 있는 형태로 다시 질문해주세요. 예: '오늘 할 일 추가해줘', '이번 주 일정 보여줘' 등"
      ]
      response = generalResponses[Math.floor(Math.random() * generalResponses.length)]
      confidence = 0.6
    }

    return { text: response, confidence }
  }

  // 대화 추가
  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    const message: ConversationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: new Date()
    }

    setConversations(prev => [...prev, message])
    return message
  }, [])

  // 사용자 메시지 처리
  const processUserMessage = useCallback(async (message: string) => {
    // 사용자 메시지 추가
    addMessage('user', message)

    try {
      // AI 응답 생성
      const context = conversations.slice(-5).map(c => `${c.role}: ${c.content}`).join('\n')
      const aiResponse = await generateAIResponse(message, context)
      
      // AI 응답 메시지 추가
      addMessage('assistant', aiResponse.text)
      
      return aiResponse
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      addMessage('assistant', '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.')
      throw error
    }
  }, [conversations, generateAIResponse, addMessage])

  // 스마트 제안 생성
  const generateSmartSuggestions = useCallback(async (currentTasks: any[], currentEvents: any[]): Promise<SmartSuggestion[]> => {
    const suggestions: SmartSuggestion[] = []

    // 오늘 마감인 태스크 확인
    const today = new Date()
    const todayTasks = currentTasks.filter(task => {
      if (!task.dueDate || task.completed) return false
      return task.dueDate.toDateString() === today.toDateString()
    })

    if (todayTasks.length > 0) {
      suggestions.push({
        type: 'urgent',
        title: '오늘 마감 태스크 알림',
        description: `${todayTasks.length}개의 태스크가 오늘 마감입니다.`,
        action: 'focus_today'
      })
    }

    // 연속된 미팅 확인
    const upcomingMeetings = currentEvents.filter(event => {
      const eventTime = new Date(event.start)
      const oneHour = 60 * 60 * 1000
      return eventTime > new Date() && eventTime < new Date(Date.now() + oneHour)
    })

    if (upcomingMeetings.length > 1) {
      suggestions.push({
        type: 'schedule',
        title: '연속 미팅 주의',
        description: '1시간 내에 여러 미팅이 예정되어 있습니다. 준비 시간을 확인하세요.',
        action: 'review_schedule'
      })
    }

    // 장기간 미완료 태스크 확인
    const staleTasks = currentTasks.filter(task => {
      if (task.completed) return false
      const daysSinceCreated = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreated > 7
    })

    if (staleTasks.length > 0) {
      suggestions.push({
        type: 'productivity',
        title: '장기 미완료 태스크',
        description: `${staleTasks.length}개의 태스크가 일주일 이상 미완료 상태입니다.`,
        action: 'review_old_tasks'
      })
    }

    return suggestions
  }, [])

  // 자동 명령 실행
  const executeAutoCommand = useCallback(async (command: string) => {
    const normalizedCommand = command.toLowerCase().trim()

    if (normalizedCommand.includes('오늘') && normalizedCommand.includes('일정')) {
      return {
        type: 'calendar',
        action: 'show_today',
        message: '오늘 일정을 확인해드리겠습니다.'
      }
    }

    if (normalizedCommand.includes('태스크') && normalizedCommand.includes('추가')) {
      return {
        type: 'task',
        action: 'add_task',
        message: '새로운 태스크를 추가하겠습니다. 태스크 제목을 말씀해주세요.'
      }
    }

    if (normalizedCommand.includes('완료') && normalizedCommand.includes('체크')) {
      return {
        type: 'task',
        action: 'complete_task',
        message: '완료할 태스크를 선택해주세요.'
      }
    }

    return null
  }, [])

  // 음성 인식 (브라우저 API 사용)
  const startVoiceRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      
      recognition.lang = 'ko-KR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        processUserMessage(transcript)
      }

      recognition.onerror = (event: any) => {
        setError(`음성 인식 오류: ${event.error}`)
      }

      recognition.start()
      return recognition
    } else {
      setError('이 브라우저에서는 음성 인식을 지원하지 않습니다.')
      return null
    }
  }, [processUserMessage])

  // 대화 내역 저장
  const saveConversations = useCallback(() => {
    try {
      localStorage.setItem('ai-conversations', JSON.stringify(conversations))
    } catch (error) {
      console.error('Failed to save conversations:', error)
    }
  }, [conversations])

  // 대화 내역 로드
  const loadConversations = useCallback(() => {
    try {
      const stored = localStorage.getItem('ai-conversations')
      if (stored) {
        const parsed = JSON.parse(stored)
        const conversationsWithDates = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp)
        }))
        setConversations(conversationsWithDates)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [])

  // 대화 초기화
  const clearConversations = useCallback(() => {
    setConversations([])
    localStorage.removeItem('ai-conversations')
  }, [])

  return {
    conversations,
    isProcessing,
    error,
    processUserMessage,
    generateSmartSuggestions,
    executeAutoCommand,
    startVoiceRecognition,
    saveConversations,
    loadConversations,
    clearConversations
  }
}
