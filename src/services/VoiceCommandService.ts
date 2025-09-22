export interface VoiceCommand {
  id: string
  pattern: RegExp
  action: string
  parameters?: string[]
  description: string
  category: 'navigation' | 'creation' | 'search' | 'action' | 'system'
  examples: string[]
}

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  command?: VoiceCommand
  parameters?: { [key: string]: any }
  success: boolean
  error?: string
}

export interface VoiceSettings {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  timeout: number
  enabled: boolean
  voiceFeedback: boolean
  hotword: string
}

class VoiceCommandService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private settings: VoiceSettings
  private commands: VoiceCommand[] = []
  private onResult: ((result: VoiceRecognitionResult) => void) | null = null
  private onError: ((error: string) => void) | null = null
  private onStart: (() => void) | null = null
  private onEnd: (() => void) | null = null
  private synthesis: SpeechSynthesis | null = null
  private isHotwordActive: boolean = false

  constructor() {
    this.settings = {
      language: 'ko-KR',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      timeout: 5000,
      enabled: false,
      voiceFeedback: true,
      hotword: '지형아'
    }

    this.synthesis = window.speechSynthesis || null
    this.initializeCommands()
    this.loadSettings()
    this.initializeRecognition()
  }

  private initializeRecognition(): void {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('음성 인식이 지원되지 않는 브라우저입니다.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    this.recognition.continuous = this.settings.continuous
    this.recognition.interimResults = this.settings.interimResults
    this.recognition.lang = this.settings.language
    this.recognition.maxAlternatives = this.settings.maxAlternatives

    this.recognition.onstart = () => {
      this.isListening = true
      this.onStart?.()
    }

    this.recognition.onend = () => {
      this.isListening = false
      this.onEnd?.()

      // Auto-restart if continuous mode is enabled and service is active
      if (this.settings.continuous && this.settings.enabled) {
        setTimeout(() => this.startListening(), 100)
      }
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          const transcript = result[0].transcript.trim()
          const confidence = result[0].confidence

          this.processVoiceInput(transcript, confidence)
        }
      }
    }

    this.recognition.onerror = (event: any) => {
      console.error('음성 인식 오류:', event.error)
      this.onError?.(event.error)

      // Auto-restart on certain errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setTimeout(() => {
          if (this.settings.enabled) this.startListening()
        }, 1000)
      }
    }
  }

  private initializeCommands(): void {
    this.commands = [
      // Navigation Commands
      {
        id: 'nav-dashboard',
        pattern: /(?:대시보드|홈|메인)(?:\s*(?:으로|로))?\s*(?:가|이동|가자)/i,
        action: 'navigate',
        parameters: ['dashboard'],
        description: '대시보드로 이동',
        category: 'navigation',
        examples: ['대시보드로 가', '홈으로 이동', '메인으로 가자']
      },
      {
        id: 'nav-notes',
        pattern: /(?:노트|메모)(?:\s*(?:으로|로))?\s*(?:가|이동|가자)/i,
        action: 'navigate',
        parameters: ['notes'],
        description: '노트 페이지로 이동',
        category: 'navigation',
        examples: ['노트로 가', '메모로 이동']
      },
      {
        id: 'nav-tasks',
        pattern: /(?:태스크|할일|작업)(?:\s*(?:으로|로))?\s*(?:가|이동|가자)/i,
        action: 'navigate',
        parameters: ['tasks'],
        description: '태스크 페이지로 이동',
        category: 'navigation',
        examples: ['태스크로 가', '할일로 이동', '작업으로 가자']
      },
      {
        id: 'nav-calendar',
        pattern: /(?:캘린더|일정|달력)(?:\s*(?:으로|로))?\s*(?:가|이동|가자)/i,
        action: 'navigate',
        parameters: ['calendar'],
        description: '캘린더로 이동',
        category: 'navigation',
        examples: ['캘린더로 가', '일정으로 이동', '달력으로 가자']
      },

      // Creation Commands
      {
        id: 'create-note',
        pattern: /(?:새\s*)?(?:노트|메모)\s*(?:만들기|생성|추가|쓰기)/i,
        action: 'create-note',
        description: '새 노트 만들기',
        category: 'creation',
        examples: ['새 노트 만들기', '메모 추가', '노트 쓰기']
      },
      {
        id: 'create-task',
        pattern: /(?:새\s*)?(?:태스크|할일|작업)\s*(?:만들기|생성|추가)/i,
        action: 'create-task',
        description: '새 태스크 만들기',
        category: 'creation',
        examples: ['새 태스크 만들기', '할일 추가', '작업 생성']
      },
      {
        id: 'create-event',
        pattern: /(?:새\s*)?(?:일정|이벤트|약속)\s*(?:만들기|생성|추가)/i,
        action: 'create-event',
        description: '새 일정 만들기',
        category: 'creation',
        examples: ['새 일정 만들기', '이벤트 추가', '약속 생성']
      },

      // Search Commands
      {
        id: 'search-notes',
        pattern: /(?:노트|메모)\s*(?:검색|찾기|찾아)/i,
        action: 'search',
        parameters: ['notes'],
        description: '노트 검색',
        category: 'search',
        examples: ['노트 검색', '메모 찾기']
      },
      {
        id: 'search-global',
        pattern: /(?:전체\s*)?(?:검색|찾기|찾아)\s*(.+)/i,
        action: 'search',
        parameters: ['global'],
        description: '전체 검색',
        category: 'search',
        examples: ['검색 프로젝트', '찾기 회의', '전체 검색 보고서']
      },

      // Action Commands
      {
        id: 'toggle-theme',
        pattern: /(?:테마|모드)\s*(?:변경|바꾸기|전환)/i,
        action: 'toggle-theme',
        description: '테마 변경',
        category: 'action',
        examples: ['테마 변경', '모드 바꾸기', '다크 모드 전환']
      },
      {
        id: 'save-current',
        pattern: /(?:저장|세이브)/i,
        action: 'save',
        description: '현재 작업 저장',
        category: 'action',
        examples: ['저장', '세이브']
      },
      {
        id: 'voice-help',
        pattern: /(?:도움말|도움|헬프|명령어)/i,
        action: 'show-help',
        description: '음성 명령 도움말',
        category: 'system',
        examples: ['도움말', '헬프', '명령어']
      },

      // Time and Date Commands
      {
        id: 'current-time',
        pattern: /(?:지금|현재)\s*(?:시간|몇시)/i,
        action: 'show-time',
        description: '현재 시간 알림',
        category: 'system',
        examples: ['지금 몇시', '현재 시간']
      },
      {
        id: 'today-schedule',
        pattern: /(?:오늘|today)\s*(?:일정|스케줄)/i,
        action: 'show-schedule',
        parameters: ['today'],
        description: '오늘 일정 보기',
        category: 'action',
        examples: ['오늘 일정', 'today 스케줄']
      },

      // Smart Actions
      {
        id: 'quick-note',
        pattern: /(?:빠른|간단한|퀵)\s*(?:노트|메모)\s*(.+)/i,
        action: 'quick-note',
        description: '빠른 노트 작성',
        category: 'creation',
        examples: ['빠른 노트 회의 준비', '간단한 메모 장보기']
      },
      {
        id: 'reminder-create',
        pattern: /(?:리마인더|알림)\s*(.+)/i,
        action: 'create-reminder',
        description: '리마인더 생성',
        category: 'creation',
        examples: ['리마인더 내일 회의', '알림 점심 약속']
      }
    ]
  }

  private processVoiceInput(transcript: string, confidence: number): void {
    console.log('음성 입력:', transcript, '신뢰도:', confidence)

    // Check for hotword activation
    if (!this.isHotwordActive && this.settings.hotword) {
      if (transcript.toLowerCase().includes(this.settings.hotword.toLowerCase())) {
        this.activateHotword()
        this.speak('네, 말씀하세요.')
        return
      }
    }

    // If hotword is required but not active, ignore
    if (this.settings.hotword && !this.isHotwordActive) {
      return
    }

    // Find matching command
    let matchedCommand: VoiceCommand | null = null
    const parameters: { [key: string]: any } = {}

    for (const command of this.commands) {
      const match = transcript.match(command.pattern)
      if (match) {
        matchedCommand = command

        // Extract parameters from regex groups
        if (match.length > 1) {
          parameters.content = match[1]?.trim()
        }

        // Add predefined parameters
        if (command.parameters) {
          command.parameters.forEach((param, index) => {
            parameters[`param${index}`] = param
          })
        }
        break
      }
    }

    const result: VoiceRecognitionResult = {
      transcript,
      confidence,
      command: matchedCommand || undefined,
      parameters: matchedCommand ? parameters : undefined,
      success: !!matchedCommand,
      error: matchedCommand ? undefined : '인식된 명령어가 없습니다.'
    }

    // Reset hotword activation after command
    if (this.isHotwordActive) {
      this.isHotwordActive = false
    }

    // Provide voice feedback
    if (matchedCommand && this.settings.voiceFeedback) {
      this.provideFeedback(matchedCommand, parameters)
    } else if (!matchedCommand && this.settings.voiceFeedback) {
      this.speak('죄송해요, 명령어를 이해하지 못했습니다.')
    }

    this.onResult?.(result)
  }

  private activateHotword(): void {
    this.isHotwordActive = true
    // Deactivate after 10 seconds
    setTimeout(() => {
      this.isHotwordActive = false
    }, 10000)
  }

  private provideFeedback(command: VoiceCommand, parameters: any): void {
    let feedback = ''

    switch (command.action) {
      case 'navigate':
        feedback = `${parameters.param0} 페이지로 이동합니다.`
        break
      case 'create-note':
        feedback = '새 노트를 만들겠습니다.'
        break
      case 'create-task':
        feedback = '새 태스크를 만들겠습니다.'
        break
      case 'create-event':
        feedback = '새 일정을 만들겠습니다.'
        break
      case 'search':
        feedback = `${parameters.content || '전체'} 검색을 시작합니다.`
        break
      case 'toggle-theme':
        feedback = '테마를 변경합니다.'
        break
      case 'save':
        feedback = '저장했습니다.'
        break
      case 'show-help':
        feedback = '음성 명령 도움말을 표시합니다.'
        break
      case 'quick-note':
        feedback = `"${parameters.content}" 내용으로 빠른 노트를 만들겠습니다.`
        break
      case 'create-reminder':
        feedback = `"${parameters.content}" 리마인더를 만들겠습니다.`
        break
      default:
        feedback = '명령을 실행합니다.'
    }

    this.speak(feedback)
  }

  private speak(text: string): void {
    if (!this.synthesis || !this.settings.voiceFeedback) return

    // Cancel any ongoing speech
    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.volume = 0.8

    this.synthesis.speak(utterance)
  }

  // Public Methods
  startListening(): boolean {
    if (!this.recognition || this.isListening) return false

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error('음성 인식 시작 실패:', error)
      return false
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  isSupported(): boolean {
    return !!(window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  }

  getSettings(): VoiceSettings {
    return { ...this.settings }
  }

  updateSettings(newSettings: Partial<VoiceSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    this.saveSettings()

    // Update recognition settings
    if (this.recognition) {
      this.recognition.continuous = this.settings.continuous
      this.recognition.interimResults = this.settings.interimResults
      this.recognition.lang = this.settings.language
      this.recognition.maxAlternatives = this.settings.maxAlternatives
    }

    // Restart if enabled
    if (this.settings.enabled && !this.isListening) {
      this.startListening()
    } else if (!this.settings.enabled && this.isListening) {
      this.stopListening()
    }
  }

  getCommands(): VoiceCommand[] {
    return [...this.commands]
  }

  addCustomCommand(command: Omit<VoiceCommand, 'id'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newCommand: VoiceCommand = { ...command, id }
    this.commands.push(newCommand)
    this.saveSettings()
    return id
  }

  removeCustomCommand(commandId: string): boolean {
    const index = this.commands.findIndex(cmd => cmd.id === commandId && cmd.id.startsWith('custom-'))
    if (index >= 0) {
      this.commands.splice(index, 1)
      this.saveSettings()
      return true
    }
    return false
  }

  // Event Handlers
  onRecognitionResult(callback: (result: VoiceRecognitionResult) => void): void {
    this.onResult = callback
  }

  onRecognitionError(callback: (error: string) => void): void {
    this.onError = callback
  }

  onRecognitionStart(callback: () => void): void {
    this.onStart = callback
  }

  onRecognitionEnd(callback: () => void): void {
    this.onEnd = callback
  }

  // Status
  getStatus() {
    return {
      isSupported: this.isSupported(),
      isListening: this.isListening,
      isEnabled: this.settings.enabled,
      isHotwordActive: this.isHotwordActive,
      commandCount: this.commands.length,
      settings: this.getSettings()
    }
  }

  // Data Persistence
  private saveSettings(): void {
    try {
      const data = {
        settings: this.settings,
        customCommands: this.commands.filter(cmd => cmd.id.startsWith('custom-'))
      }
      localStorage.setItem('jihyung-voice-settings', JSON.stringify(data))
    } catch (error) {
      console.error('음성 설정 저장 실패:', error)
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('jihyung-voice-settings')
      if (!saved) return

      const data = JSON.parse(saved)

      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings }
      }

      if (data.customCommands && Array.isArray(data.customCommands)) {
        this.commands.push(...data.customCommands)
      }
    } catch (error) {
      console.error('음성 설정 로드 실패:', error)
    }
  }

  // Accessibility
  getAccessibilityInfo() {
    return {
      shortcuts: [
        { key: 'Ctrl + ;', action: '음성 인식 시작/중지' },
        { key: 'Ctrl + Shift + ;', action: '음성 명령 도움말' }
      ],
      supportedLanguages: ['ko-KR', 'en-US', 'ja-JP', 'zh-CN'],
      features: [
        '연속 음성 인식',
        '핫워드 활성화',
        '음성 피드백',
        '사용자 정의 명령어',
        '다국어 지원'
      ]
    }
  }
}

// Export singleton instance
export const voiceCommandService = new VoiceCommandService()

export default voiceCommandService