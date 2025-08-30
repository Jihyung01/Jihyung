import { useState } from 'react'
import { Sparkle, Brain, MagicWand } from '@phosphor-icons/react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

interface MagicCaptureProps {
  onCapture: (content: string, type: string) => void
}

export function MagicCapture({ onCapture }: MagicCaptureProps) {
  const [content, setContent] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [captureType, setCaptureType] = useState('auto')
  const [preview, setPreview] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])

  const handleAnalyzeContent = async () => {
    if (!content.trim()) return

    setIsProcessing(true)
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const analysis = analyzeContent(content)
      setPreview(analysis)
      setSuggestions(analysis.suggestions || [])
    } catch (error) {
      console.error('Content analysis failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const analyzeContent = (text: string) => {
    let suggestions: any[] = []
    let type = 'note'

    // Detect content type and extract relevant data
    if (text.includes('할일') || text.includes('TODO') || text.match(/\d+\./)) {
      type = 'task'
      suggestions = extractTasks(text)
    } else if (text.includes('일정') || text.includes('미팅') || text.match(/\d{1,2}:\d{2}/)) {
      type = 'event'
      suggestions = extractEvents(text)
    } else {
      suggestions = extractNoteStructure(text)
    }

    return {
      type,
      suggestions,
      tags: extractTags(text),
      priority: detectPriority(text)
    }
  }

  const extractTasks = (text: string) => {
    const tasks: any[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    lines.forEach(line => {
      if (line.match(/^\d+\./) || line.match(/^[\-\*]/) || line.includes('할일')) {
        tasks.push({
          title: line.replace(/^\d+\.|\-|\*/, '').trim(),
          priority: line.includes('중요') || line.includes('urgent') ? 'high' : 'medium'
        })
      }
    })
    
    return tasks
  }

  const extractEvents = (text: string) => {
    const events: any[] = []
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/)
    const dateMatch = text.match(/(오늘|내일|월요일|화요일|수요일|목요일|금요일|토요일|일요일)/)
    
    if (timeMatch || dateMatch) {
      events.push({
        title: text.split('\n')[0] || '새 일정',
        time: timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '09:00',
        date: dateMatch ? dateMatch[0] : '오늘'
      })
    }
    
    return events
  }

  const extractNoteStructure = (text: string) => {
    const structure = {
      title: text.split('\n')[0] || '새 노트',
      content: text,
      keyPoints: [] as string[]
    }
    
    const lines = text.split('\n')
    lines.forEach(line => {
      if (line.match(/^[\-\*\•]/) || line.match(/^\d+\./)) {
        structure.keyPoints.push(line.replace(/^[\-\*\•\d\.]\s*/, ''))
      }
    })
    
    return [structure]
  }

  const extractTags = (text: string) => {
    const tags: string[] = []
    const hashTags = text.match(/#(\w+)/g)
    
    if (hashTags) {
      hashTags.forEach(tag => {
        tags.push(tag.substring(1))
      })
    }
    
    // Auto-detect common tags
    if (text.includes('회의') || text.includes('미팅')) tags.push('meeting')
    if (text.includes('프로젝트')) tags.push('project')
    if (text.includes('아이디어')) tags.push('idea')
    if (text.includes('할일') || text.includes('task')) tags.push('todo')
    
    return tags
  }

  const detectPriority = (text: string) => {
    if (text.includes('긴급') || text.includes('urgent') || text.includes('중요')) return 'high'
    if (text.includes('나중에') || text.includes('later')) return 'low'
    return 'medium'
  }

  const handleCapture = () => {
    if (!content.trim()) return
    
    onCapture(content, preview?.type || 'note')
    setContent('')
    setPreview(null)
    setSuggestions([])
  }

  return (
    <Card className="border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MagicWand className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-lg font-semibold">Magic Capture</CardTitle>
          </div>
          <Badge variant="outline">AUTO</Badge>
        </div>
        
        <Select value={captureType} onValueChange={setCaptureType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Start typing your thoughts, tasks, or ideas..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleAnalyzeContent}
            className="min-h-24 resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {content.length}/500 characters
            </div>
            <Button
              onClick={handleCapture}
              disabled={!content.trim() || isProcessing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? 'Processing...' : 'Capture'}
            </Button>
          </div>
        </div>

        {preview && (
          <div className="p-3 bg-white rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">AI Analysis</span>
              <Badge variant="secondary" className="text-xs">
                {preview.type.toUpperCase()}
              </Badge>
            </div>
            
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600">Suggestions:</div>
                {suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                  <div key={index} className="text-xs p-2 bg-blue-50 rounded">
                    {suggestion.title || suggestion.task || JSON.stringify(suggestion)}
                  </div>
                ))}
              </div>
            )}
            
            {preview.tags && preview.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {preview.tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
