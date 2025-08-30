import { useState, useRef, useEffect } from 'react'
import { X, Microphone, Link, FileText, Upload, PaperPlaneRight, Brain, Sparkle } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { toast } from 'sonner'
import { createNote, summarize, extractTasks, summarizeYoutube, transcribeAudio } from '../api/client'

interface CaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onNoteCreated: (note: any) => void
  onTasksCreated: (tasks: any[]) => void
  loading?: boolean
}

type CaptureMode = 'text' | 'url' | 'audio' | 'file'

export function CaptureModal({ isOpen, onClose, onNoteCreated, onTasksCreated, loading = false }: CaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>('text')
  const [content, setContent] = useState('')
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [summary, setSummary] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setContent('')
      setUrl('')
      setAudioBlob(null)
      setMode('text')
      setIsRecording(false)
      setSummary('')
    }
  }, [isOpen])

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && mode === 'text') {
      const textarea = document.querySelector('textarea')
      if (textarea) {
        setTimeout(() => textarea.focus(), 100)
      }
    }
  }, [isOpen, mode])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('녹음이 시작되었습니다')
    } catch (error) {
      console.error('Recording failed:', error)
      toast.error('마이크 접근에 실패했습니다')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      toast.success('녹음이 완료되었습니다')
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioBlob(file)
        setMode('audio')
        toast.success('오디오 파일이 선택되었습니다')
      } else {
        toast.error('오디오 파일만 지원됩니다')
      }
    }
  }

  const handleSummarize = async () => {
    if (!content.trim()) {
      toast.error('요약할 내용을 입력해주세요')
      return
    }

    setIsProcessing(true)
    try {
      const result = await summarize(content.trim())
      setSummary(result.summary || '')
      toast.success('요약이 완료되었습니다')
    } catch (error) {
      console.error('Summarization failed:', error)
      toast.error('요약 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtractTasks = async () => {
    const textToProcess = content.trim() || summary
    if (!textToProcess) {
      toast.error('태스크를 추출할 내용을 입력해주세요')
      return
    }

    setIsProcessing(true)
    try {
      const result = await extractTasks(textToProcess)
      if (result.tasks && result.tasks.length > 0) {
        onTasksCreated(result.tasks)
        toast.success(`${result.tasks.length}개의 태스크가 추출되었습니다`)
      } else {
        toast.info('추출된 태스크가 없습니다')
      }
    } catch (error) {
      console.error('Task extraction failed:', error)
      toast.error('태스크 추출 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }

  const processCapture = async () => {
    if (!content.trim() && !url.trim() && !audioBlob) {
      toast.error('내용을 입력해주세요')
      return
    }

    setIsProcessing(true)

    try {
      if (mode === 'text' && content.trim()) {
        // Create note from text
        const noteData = {
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          content: content.trim(),
          summary: summary || undefined,
          tags: [],
          source_type: 'text'
        }
        
        const note = await createNote(noteData)
        onNoteCreated(note)
        toast.success('노트가 생성되었습니다')
      }
      
      else if (mode === 'url' && url.trim()) {
        // Process URL (YouTube or web page)
        const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
        
        if (isYouTube) {
          try {
            const result = await summarizeYoutube(url)
            const noteData = {
              title: 'YouTube 영상 요약',
              content: result.transcript_text || '전사 텍스트를 가져올 수 없습니다',
              summary: result.analysis?.summary || null,
              tags: ['youtube'],
              source_type: 'youtube',
              source_meta: {
                video_id: result.video_id,
                url: url,
                analysis: result.analysis
              }
            }
            
            const note = await createNote(noteData)
            onNoteCreated(note)
            toast.success('YouTube 영상이 분석되어 노트가 생성되었습니다')
          } catch (error) {
            console.error('YouTube processing failed:', error)
            toast.error('YouTube 영상 처리 중 오류가 발생했습니다')
          }
        } else {
          const noteData = {
            title: '웹페이지 링크',
            content: `URL: ${url}`,
            tags: ['web'],
            source_type: 'url',
            source_meta: { url: url }
          }
          
          const note = await createNote(noteData)
          onNoteCreated(note)
          toast.success('웹페이지 링크가 저장되었습니다')
        }
      }
      
      else if (mode === 'audio' && audioBlob) {
        // Process audio
        try {
          const transcriptionResult = await transcribeAudio(audioBlob)
          const transcriptText = transcriptionResult.text || ''

          const noteData = {
            title: '음성 노트',
            content: transcriptText,
            tags: ['audio'],
            source_type: 'audio'
          }
          
          const note = await createNote(noteData)
          onNoteCreated(note)

          // Try to extract tasks from transcription
          if (transcriptText) {
            try {
              const taskResult = await extractTasks(transcriptText)
              if (taskResult.tasks && taskResult.tasks.length > 0) {
                onTasksCreated(taskResult.tasks)
                toast.success(`음성 노트가 생성되고 ${taskResult.tasks.length}개의 태스크가 추출되었습니다`)
              } else {
                toast.success('음성 노트가 생성되었습니다')
              }
            } catch (taskError) {
              toast.success('음성 노트가 생성되었습니다 (태스크 추출 실패)')
            }
          } else {
            toast.success('음성 노트가 생성되었습니다')
          }
        } catch (error) {
          console.error('Audio processing failed:', error)
          toast.error('음성 처리 중 오류가 발생했습니다')
        }
      }

      onClose()
    } catch (error) {
      console.error('Capture processing failed:', error)
      toast.error('처리 중 오류가 발생했습니다')
    } finally {
      setIsProcessing(false)
    }
  }



  const getModeIcon = (modeType: CaptureMode) => {
    switch (modeType) {
      case 'text': return <FileText className="h-4 w-4" />
      case 'url': return <Link className="h-4 w-4" />
      case 'audio': return <Microphone className="h-4 w-4" />
      case 'file': return <Upload className="h-4 w-4" />
    }
  }

  const getModeLabel = (modeType: CaptureMode) => {
    switch (modeType) {
      case 'text': return '텍스트'
      case 'url': return 'URL'
      case 'audio': return '음성'
      case 'file': return '파일'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            빠른 캡처
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mode Selection */}
          <div className="flex gap-2">
            {(['text', 'url', 'audio', 'file'] as CaptureMode[]).map((modeType) => (
              <Button
                key={modeType}
                variant={mode === modeType ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={() => setMode(modeType)}
              >
                {getModeIcon(modeType)}
                {getModeLabel(modeType)}
              </Button>
            ))}
          </div>

          {/* Content Input based on mode */}
          {mode === 'text' && (
            <div className="space-y-3">
              <Textarea
                placeholder="아이디어, 노트, 할 일 등을 자유롭게 입력하세요..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    processCapture()
                  }
                }}
              />
              
              {/* AI Actions */}
              {content.trim() && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSummarize}
                    disabled={isProcessing}
                    className="gap-2"
                    data-testid="summarize"
                  >
                    <Sparkle className="h-4 w-4" />
                    요약
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExtractTasks}
                    disabled={isProcessing}
                    className="gap-2"
                    data-testid="extract-tasks"
                  >
                    <Brain className="h-4 w-4" />
                    태스크 추출
                  </Button>
                </div>
              )}

              {/* Summary Display */}
              {summary && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">AI 요약</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{summary}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Ctrl/Cmd + Enter로 빠른 저장</span>
                <span>{content.length} 글자</span>
              </div>
            </div>
          )}

          {mode === 'url' && (
            <div className="space-y-3">
              <Input
                placeholder="YouTube 링크나 웹페이지 URL을 입력하세요"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="url"
              />
              <div className="text-sm text-muted-foreground">
                YouTube 영상은 자동으로 자막을 추출하여 요약합니다
              </div>
            </div>
          )}

          {mode === 'audio' && (
            <div className="space-y-3">
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                {!audioBlob ? (
                  <div className="space-y-3">
                    <Microphone className="h-12 w-12 text-muted-foreground mx-auto" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        음성을 녹음하거나 파일을 업로드하세요
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm"
                          onClick={isRecording ? stopRecording : startRecording}
                          className="gap-2"
                        >
                          <Microphone className="h-4 w-4" />
                          {isRecording ? '녹음 중지' : '녹음 시작'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="h-4 w-4" />
                          파일 선택
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="secondary">오디오 준비됨</Badge>
                    <p className="text-sm text-muted-foreground">
                      처리하면 자동으로 텍스트 변환 및 구조화됩니다
                    </p>
                  </div>
                )}
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {mode === 'file' && (
            <div className="space-y-3">
              <div className="border border-dashed border-border rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">
                  파일을 드래그하거나 클릭하여 업로드
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  파일 선택
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="quick-capture-cancel"
            >
              취소
            </Button>
            <Button
              onClick={processCapture}
              disabled={isProcessing || (!content.trim() && !url.trim() && !audioBlob) || loading}
              className="flex-1 gap-2"
              data-testid="quick-capture-save"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  처리중...
                </>
              ) : (
                <>
                  <PaperPlaneRight className="h-4 w-4" />
                  캡처하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}