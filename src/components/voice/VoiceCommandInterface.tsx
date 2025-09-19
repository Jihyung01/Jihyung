import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  Zap,
  Brain,
  Waves,
  Circle
} from 'lucide-react'
import { voiceCommandService, VoiceRecognitionResult, VoiceCommand, VoiceSettings } from '../../services/VoiceCommandService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Switch } from '../ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'

interface VoiceCommandInterfaceProps {
  className?: string
  onCommand?: (result: VoiceRecognitionResult) => void
}

export function VoiceCommandInterface({ className, onCommand }: VoiceCommandInterfaceProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [settings, setSettings] = useState<VoiceSettings | null>(null)
  const [lastResult, setLastResult] = useState<VoiceRecognitionResult | null>(null)
  const [commands, setCommands] = useState<VoiceCommand[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)

  useEffect(() => {
    // Initialize voice service
    setIsSupported(voiceCommandService.isSupported())
    setSettings(voiceCommandService.getSettings())
    setCommands(voiceCommandService.getCommands())

    // Set up event handlers
    voiceCommandService.onRecognitionStart(() => {
      setIsListening(true)
    })

    voiceCommandService.onRecognitionEnd(() => {
      setIsListening(false)
    })

    voiceCommandService.onRecognitionResult((result) => {
      setLastResult(result)
      setTranscript(result.transcript)
      setConfidence(result.confidence)

      if (result.success) {
        toast.success(`명령 실행: ${result.command?.description}`, {
          description: result.transcript
        })
      } else if (result.error) {
        toast.error('음성 명령 오류', {
          description: result.error
        })
      }

      onCommand?.(result)
    })

    voiceCommandService.onRecognitionError((error) => {
      toast.error('음성 인식 오류', {
        description: error
      })
    })

    // Auto-start if enabled
    if (voiceCommandService.getSettings().enabled) {
      voiceCommandService.startListening()
    }

    return () => {
      voiceCommandService.stopListening()
    }
  }, [onCommand])

  const toggleListening = useCallback(() => {
    if (isListening) {
      voiceCommandService.stopListening()
    } else {
      const started = voiceCommandService.startListening()
      if (!started) {
        toast.error('음성 인식을 시작할 수 없습니다', {
          description: '마이크 권한을 확인해주세요.'
        })
      }
    }
  }, [isListening])

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    voiceCommandService.updateSettings(newSettings)
    setSettings(voiceCommandService.getSettings())
  }, [])

  if (!isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <MicOff className="w-5 h-5" />
            음성 명령 지원 안됨
          </CardTitle>
          <CardDescription>
            이 브라우저는 음성 인식을 지원하지 않습니다.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            음성 AI 어시스턴트
            {settings?.hotword && (
              <Badge variant="outline" className="text-xs">
                "{settings.hotword}" 깨우기
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            음성으로 앱을 제어하세요. 핸즈프리 생산성 도구입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Main Toggle Button */}
              <motion.button
                className={`relative w-16 h-16 rounded-full flex items-center justify-center ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } transition-colors shadow-lg`}
                onClick={toggleListening}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isListening ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )}

                {/* Pulse Animation */}
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-red-300"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      exit={{ scale: 1, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Status */}
              <div>
                <div className="flex items-center gap-2">
                  <Circle
                    className={`w-3 h-3 ${
                      isListening ? 'text-red-500 fill-current' : 'text-gray-400'
                    }`}
                  />
                  <span className="font-medium">
                    {isListening ? '듣고 있음...' : '대기 중'}
                  </span>
                </div>
                {transcript && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    "{transcript}"
                    {confidence > 0 && (
                      <span className="ml-2 text-xs">
                        ({(confidence * 100).toFixed(0)}% 확신)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateSettings({ voiceFeedback: !settings?.voiceFeedback })}
              >
                {settings?.voiceFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>음성 명령 설정</DialogTitle>
                    <DialogDescription>
                      음성 인식 및 명령 설정을 사용자 정의하세요.
                    </DialogDescription>
                  </DialogHeader>
                  <VoiceSettings
                    settings={settings!}
                    onUpdate={updateSettings}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={showHelp} onOpenChange={setShowHelp}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>음성 명령 도움말</DialogTitle>
                    <DialogDescription>
                      사용 가능한 음성 명령어들을 확인하세요.
                    </DialogDescription>
                  </DialogHeader>
                  <VoiceHelp commands={commands} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Status */}
      {settings?.enabled && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">음성 모니터링 활성</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>언어: {settings.language}</span>
                <span>명령어: {commands.length}개</span>
                {settings.hotword && (
                  <Badge variant="secondary" className="text-xs">
                    핫워드: {settings.hotword}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Command Result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border-2 ${
              lastResult.success
                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                lastResult.success ? 'bg-green-100 dark:bg-green-800' : 'bg-red-100 dark:bg-red-800'
              }`}>
                {lastResult.success ? (
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <MicOff className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {lastResult.command?.description || '명령 실행 실패'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  "{lastResult.transcript}"
                </div>
                {lastResult.error && (
                  <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                    오류: {lastResult.error}
                  </div>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                {(lastResult.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Voice Settings Component
function VoiceSettings({
  settings,
  onUpdate
}: {
  settings: VoiceSettings
  onUpdate: (updates: Partial<VoiceSettings>) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">음성 인식 활성화</label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              지속적인 음성 모니터링을 켜거나 끕니다.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(enabled) => onUpdate({ enabled })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">음성 피드백</label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              명령 실행 시 음성으로 응답합니다.
            </p>
          </div>
          <Switch
            checked={settings.voiceFeedback}
            onCheckedChange={(voiceFeedback) => onUpdate({ voiceFeedback })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">연속 인식</label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              음성 인식을 지속적으로 유지합니다.
            </p>
          </div>
          <Switch
            checked={settings.continuous}
            onCheckedChange={(continuous) => onUpdate({ continuous })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium">중간 결과 표시</label>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              말하는 동안 실시간으로 텍스트를 표시합니다.
            </p>
          </div>
          <Switch
            checked={settings.interimResults}
            onCheckedChange={(interimResults) => onUpdate({ interimResults })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">언어 설정</label>
          <select
            value={settings.language}
            onChange={(e) => onUpdate({ language: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="ko-KR">한국어</option>
            <option value="en-US">English (US)</option>
            <option value="ja-JP">日本語</option>
            <option value="zh-CN">中文</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">깨우기 단어</label>
          <input
            type="text"
            value={settings.hotword}
            onChange={(e) => onUpdate({ hotword: e.target.value })}
            placeholder="예: 지형아, 안녕"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            이 단어로 음성 어시스턴트를 활성화할 수 있습니다.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium">타임아웃 (초)</label>
          <input
            type="number"
            value={settings.timeout / 1000}
            onChange={(e) => onUpdate({ timeout: Number(e.target.value) * 1000 })}
            min="1"
            max="30"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>

        <div>
          <label className="text-sm font-medium">최대 대안 수</label>
          <input
            type="number"
            value={settings.maxAlternatives}
            onChange={(e) => onUpdate({ maxAlternatives: Number(e.target.value) })}
            min="1"
            max="10"
            className="w-full mt-1 px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
          />
        </div>
      </div>
    </div>
  )
}

// Voice Help Component
function VoiceHelp({ commands }: { commands: VoiceCommand[] }) {
  const groupedCommands = commands.reduce((groups, command) => {
    if (!groups[command.category]) {
      groups[command.category] = []
    }
    groups[command.category].push(command)
    return groups
  }, {} as Record<string, VoiceCommand[]>)

  const categoryLabels = {
    navigation: '🧭 네비게이션',
    creation: '➕ 생성',
    search: '🔍 검색',
    action: '⚡ 액션',
    system: '⚙️ 시스템'
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {Object.entries(groupedCommands).map(([category, cmds]) => (
        <div key={category}>
          <h4 className="font-medium mb-3 text-sm text-gray-900 dark:text-gray-100">
            {categoryLabels[category as keyof typeof categoryLabels] || category}
          </h4>
          <div className="space-y-3">
            {cmds.map((command) => (
              <div key={command.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="font-medium text-sm">{command.description}</div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {command.examples.map((example, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      "{example}"
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 사용 팁
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• 명확하고 천천히 말해주세요</li>
          <li>• 깨우기 단어 후 잠시 기다린 후 명령하세요</li>
          <li>• 소음이 적은 환경에서 사용하세요</li>
          <li>• 마이크 권한을 허용해주세요</li>
        </ul>
      </div>
    </div>
  )
}

export default VoiceCommandInterface