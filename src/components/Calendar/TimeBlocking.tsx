// src/components/Calendar/TimeBlocking.tsx
import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Plus, Calendar, Edit3, Trash2, Copy, Settings, Zap } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { toast } from 'sonner'

interface TimeBlock {
  id: number
  startHour: number
  duration: number
  title: string
  description?: string
  color: string
  category: 'work' | 'personal' | 'health' | 'learning' | 'social'
  priority: 'high' | 'medium' | 'low'
  isCompleted?: boolean
}

interface TimeBlockingProps {
  date?: Date
}

export const TimeBlocking: React.FC<TimeBlockingProps> = ({ date = new Date() }) => {
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    {
      id: 1,
      startHour: 9,
      duration: 2,
      title: '집중 작업 시간',
      description: '중요한 프로젝트 작업에 집중',
      color: 'bg-blue-500',
      category: 'work',
      priority: 'high'
    },
    {
      id: 2,
      startHour: 14,
      duration: 1,
      title: '점심 & 휴식',
      description: '에너지 충전 시간',
      color: 'bg-green-500',
      category: 'personal',
      priority: 'medium'
    },
    {
      id: 3,
      startHour: 18,
      duration: 1.5,
      title: '운동',
      description: '헬스장에서 운동',
      color: 'bg-red-500',
      category: 'health',
      priority: 'high'
    }
  ])
  
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<TimeBlock | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [draggedBlock, setDraggedBlock] = useState<number | null>(null)
  
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const categoryColors = {
    work: 'bg-blue-500',
    personal: 'bg-green-500',
    health: 'bg-red-500',
    learning: 'bg-purple-500',
    social: 'bg-yellow-500'
  }

  const priorityColors = {
    high: 'border-red-400',
    medium: 'border-yellow-400',
    low: 'border-gray-400'
  }
  
  const handleAddBlock = useCallback((hour: number) => {
    const newBlock: TimeBlock = {
      id: Date.now(),
      startHour: hour,
      duration: 1,
      title: 'New Block',
      description: '',
      color: categoryColors.work,
      category: 'work',
      priority: 'medium'
    }
    setEditingBlock(newBlock)
    setIsDialogOpen(true)
  }, [])

  const handleSaveBlock = useCallback((block: TimeBlock) => {
    if (blocks.find(b => b.id === block.id)) {
      setBlocks(blocks.map(b => b.id === block.id ? block : b))
      toast.success('시간 블록이 수정되었습니다.')
    } else {
      setBlocks([...blocks, block])
      toast.success('새 시간 블록이 추가되었습니다.')
    }
    setIsDialogOpen(false)
    setEditingBlock(null)
  }, [blocks])

  const handleDeleteBlock = useCallback((blockId: number) => {
    setBlocks(blocks.filter(b => b.id !== blockId))
    toast.success('시간 블록이 삭제되었습니다.')
  }, [blocks])

  const handleDuplicateBlock = useCallback((block: TimeBlock) => {
    const newBlock: TimeBlock = {
      ...block,
      id: Date.now(),
      title: `${block.title} (복사본)`,
      startHour: Math.min(23, block.startHour + block.duration)
    }
    setBlocks([...blocks, newBlock])
    toast.success('시간 블록이 복제되었습니다.')
  }, [blocks])

  const handleDragBlock = useCallback((blockId: number, newHour: number) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, startHour: Math.max(0, Math.min(23, newHour)) }
        : block
    ))
  }, [blocks])

  const handleToggleComplete = useCallback((blockId: number) => {
    setBlocks(blocks.map(block =>
      block.id === blockId
        ? { ...block, isCompleted: !block.isCompleted }
        : block
    ))
  }, [blocks])

  const autoSchedule = useCallback(() => {
    // 간단한 자동 스케줄링 알고리즘
    const workHours = [9, 10, 11, 14, 15, 16, 17]
    const newBlocks: TimeBlock[] = []
    
    const tasks = [
      { title: '이메일 확인', duration: 0.5, category: 'work' as const, priority: 'medium' as const },
      { title: '회의 준비', duration: 1, category: 'work' as const, priority: 'high' as const },
      { title: '프로젝트 작업', duration: 2, category: 'work' as const, priority: 'high' as const },
      { title: '학습 시간', duration: 1, category: 'learning' as const, priority: 'medium' as const },
      { title: '휴식 시간', duration: 0.5, category: 'personal' as const, priority: 'low' as const }
    ]

    let currentHour = 9
    tasks.forEach((task, index) => {
      if (currentHour + task.duration <= 18) {
        newBlocks.push({
          id: Date.now() + index,
          startHour: currentHour,
          duration: task.duration,
          title: task.title,
          color: categoryColors[task.category],
          category: task.category,
          priority: task.priority
        })
        currentHour += task.duration + 0.5 // 30분 간격
      }
    })

    setBlocks([...blocks, ...newBlocks])
    toast.success(`${newBlocks.length}개의 자동 스케줄이 추가되었습니다.`)
  }, [blocks])

  const formatTime = (hour: number): string => {
    return `${hour.toString().padStart(2, '0')}:00`
  }

  const formatDuration = (duration: number): string => {
    const hours = Math.floor(duration)
    const minutes = Math.round((duration - hours) * 60)
    if (minutes === 0) return `${hours}시간`
    return `${hours}시간 ${minutes}분`
  }

  const getTotalScheduledTime = (): number => {
    return blocks.reduce((total, block) => total + block.duration, 0)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Time Blocking
            <Badge variant="outline" className="ml-2">
              {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {formatDuration(getTotalScheduledTime())} 예정
            </Badge>
            <Button size="sm" variant="outline" onClick={autoSchedule}>
              <Zap className="h-4 w-4 mr-1" />
              자동 스케줄
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="relative max-h-96 overflow-y-auto">
          {/* Time Grid */}
          <div className="grid grid-cols-1 gap-px bg-border rounded-lg overflow-hidden">
            {hours.map(hour => (
              <div
                key={hour}
                className="relative h-12 bg-background hover:bg-accent/5 transition-colors cursor-pointer group"
                onClick={() => handleAddBlock(hour)}
              >
                {/* Time Label */}
                <div className="absolute left-2 top-1 text-xs text-muted-foreground font-mono">
                  {formatTime(hour)}
                </div>
                
                {/* Add Button (hidden by default, shown on hover) */}
                <div className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Time Blocks */}
                <AnimatePresence>
                  {blocks
                    .filter(block => block.startHour <= hour && hour < block.startHour + block.duration)
                    .map(block => {
                      const isFirstHour = hour === block.startHour
                      const blockHeight = block.duration * 48 // 48px per hour
                      
                      if (!isFirstHour) return null
                      
                      return (
                        <motion.div
                          key={block.id}
                          layoutId={`block-${block.id}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          drag="y"
                          dragConstraints={{ top: 0, bottom: 0 }}
                          dragElastic={0}
                          onDragStart={() => setDraggedBlock(block.id)}
                          onDragEnd={(e, info) => {
                            const newHour = Math.round((block.startHour * 48 + info.offset.y) / 48)
                            handleDragBlock(block.id, newHour)
                            setDraggedBlock(null)
                          }}
                          className={`absolute left-16 right-2 top-1 ${block.color} rounded-md shadow-sm cursor-move border-l-4 ${priorityColors[block.priority]} ${
                            block.isCompleted ? 'opacity-60' : 'hover:shadow-md'
                          }`}
                          style={{ height: `${blockHeight - 8}px` }}
                        >
                          <div className="p-2 h-full flex flex-col justify-between">
                            <div className="flex-1 min-h-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-medium truncate">
                                    {block.isCompleted && '✓ '}{block.title}
                                  </p>
                                  {block.description && (
                                    <p className="text-white/80 text-xs mt-1 line-clamp-2">
                                      {block.description}
                                    </p>
                                  )}
                                </div>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Settings className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => {
                                      setEditingBlock(block)
                                      setIsDialogOpen(true)
                                    }}>
                                      <Edit3 className="h-4 w-4 mr-2" />
                                      편집
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateBlock(block)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      복제
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleToggleComplete(block.id)}>
                                      <Clock className="h-4 w-4 mr-2" />
                                      {block.isCompleted ? '완료 취소' : '완료 표시'}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteBlock(block.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      삭제
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-white/80">
                              <span>{formatTime(block.startHour)} - {formatTime(block.startHour + block.duration)}</span>
                              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                {block.category}
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Block Editor Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingBlock?.id && blocks.find(b => b.id === editingBlock.id) ? '시간 블록 편집' : '새 시간 블록 추가'}
              </DialogTitle>
              <DialogDescription>
                시간 블록의 세부 정보를 설정하세요.
              </DialogDescription>
            </DialogHeader>
            
            {editingBlock && <TimeBlockForm block={editingBlock} onSave={handleSaveBlock} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Time Block Form Component
interface TimeBlockFormProps {
  block: TimeBlock
  onSave: (block: TimeBlock) => void
}

const TimeBlockForm: React.FC<TimeBlockFormProps> = ({ block, onSave }) => {
  const [formData, setFormData] = useState<TimeBlock>(block)

  const categoryColors = {
    work: 'bg-blue-500',
    personal: 'bg-green-500',
    health: 'bg-red-500',
    learning: 'bg-purple-500',
    social: 'bg-yellow-500'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.title.trim()) {
      onSave({
        ...formData,
        color: categoryColors[formData.category]
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="시간 블록 제목"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="추가 설명 (선택사항)"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startHour">시작 시간</Label>
          <Select
            value={formData.startHour.toString()}
            onValueChange={(value) => setFormData({ ...formData, startHour: parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, i) => (
                <SelectItem key={i} value={i.toString()}>
                  {i.toString().padStart(2, '0')}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">지속 시간</Label>
          <Select
            value={formData.duration.toString()}
            onValueChange={(value) => setFormData({ ...formData, duration: parseFloat(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">30분</SelectItem>
              <SelectItem value="1">1시간</SelectItem>
              <SelectItem value="1.5">1시간 30분</SelectItem>
              <SelectItem value="2">2시간</SelectItem>
              <SelectItem value="2.5">2시간 30분</SelectItem>
              <SelectItem value="3">3시간</SelectItem>
              <SelectItem value="4">4시간</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">카테고리</Label>
          <Select
            value={formData.category}
            onValueChange={(value: any) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="work">업무</SelectItem>
              <SelectItem value="personal">개인</SelectItem>
              <SelectItem value="health">건강</SelectItem>
              <SelectItem value="learning">학습</SelectItem>
              <SelectItem value="social">사회활동</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">우선순위</Label>
          <Select
            value={formData.priority}
            onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">높음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => {}}>
          취소
        </Button>
        <Button type="submit">
          저장
        </Button>
      </div>
    </form>
  )
}
