import { useState, useEffect } from 'react'
import { 
  Tray, 
  CheckCircle, 
  Circle,
  Archive,
  Trash,
  Star,
  Clock,
  Funnel,
  MagnifyingGlass
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { toast } from 'sonner'

interface InboxItem {
  id: string
  type: 'note' | 'task' | 'idea' | 'link' | 'file'
  title: string
  content?: string
  source: string
  timestamp: Date
  processed: boolean
  starred: boolean
  priority?: 'high' | 'medium' | 'low'
  tags?: string[]
}

export function InboxScreen() {
  const [items, setItems] = useState<InboxItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')

  useEffect(() => {
    // Mock inbox data
    const mockItems: InboxItem[] = [
      {
        id: '1',
        type: 'note',
        title: 'AI 연구 논문 요약',
        content: 'Transformer 아키텍처의 새로운 개선사항에 대한 논문 발견...',
        source: '브라우저 캡처',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
        processed: false,
        starred: true,
        priority: 'high',
        tags: ['AI', '논문', '연구']
      },
      {
        id: '2',
        type: 'idea',
        title: '자동화된 코드 리뷰 시스템',
        content: 'AI를 활용한 코드 리뷰 자동화 아이디어...',
        source: '음성 메모',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
        processed: false,
        starred: false,
        priority: 'medium'
      },
      {
        id: '3',
        type: 'task',
        title: '프로젝트 미팅 준비',
        content: '내일 프로젝트 미팅을 위한 자료 준비',
        source: '이메일',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4시간 전
        processed: true,
        starred: false,
        priority: 'high'
      },
      {
        id: '4',
        type: 'link',
        title: 'React 19 새로운 기능',
        content: 'https://react.dev/blog/2024/04/25/react-19',
        source: '웹 클리핑',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6시간 전
        processed: false,
        starred: false,
        priority: 'low'
      },
      {
        id: '5',
        type: 'file',
        title: '디자인 시안 v2.0',
        content: 'design_v2.figma',
        source: '파일 업로드',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1일 전
        processed: false,
        starred: true,
        priority: 'medium'
      }
    ]
    setItems(mockItems)
  }, [])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unprocessed' && !item.processed) ||
                         (filterType === 'starred' && item.starred) ||
                         item.type === filterType
    return matchesSearch && matchesFilter
  })

  const toggleProcessed = (id: string) => {
    setItems(items =>
      items.map(item =>
        item.id === id ? { ...item, processed: !item.processed } : item
      )
    )
    toast.success('항목이 처리되었습니다!')
  }

  const toggleStar = (id: string) => {
    setItems(items =>
      items.map(item =>
        item.id === id ? { ...item, starred: !item.starred } : item
      )
    )
  }

  const archiveItem = (id: string) => {
    setItems(items => items.filter(item => item.id !== id))
    toast.success('항목이 아카이브되었습니다!')
  }

  const deleteItem = (id: string) => {
    setItems(items => items.filter(item => item.id !== id))
    toast.success('항목이 삭제되었습니다!')
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'task': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'idea': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'link': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'file': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return '📝'
      case 'task': return '✅'
      case 'idea': return '💡'
      case 'link': return '🔗'
      case 'file': return '📁'
      default: return '📄'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) {
      return `${minutes}분 전`
    } else if (hours < 24) {
      return `${hours}시간 전`
    } else {
      return `${days}일 전`
    }
  }

  const unprocessedCount = items.filter(item => !item.processed).length

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Tray className="w-8 h-8" />
            받은함
          </h1>
          <p className="text-muted-foreground mt-1">
            처리되지 않은 항목 {unprocessedCount}개가 있습니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            전체 처리
          </Button>
          <Button size="sm">
            새 항목 추가
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="받은함에서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Funnel className="w-4 h-4" />
              필터
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              전체 항목
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('unprocessed')}>
              미처리 항목
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('starred')}>
              즐겨찾기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('note')}>
              노트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('task')}>
              태스크
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('idea')}>
              아이디어
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Tray className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">받은함이 비어있습니다</h3>
              <p className="text-muted-foreground">
                새로운 아이디어나 태스크를 캡처해보세요!
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className={`transition-all hover:shadow-md ${item.processed ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleProcessed(item.id)}
                      className="text-primary hover:text-primary/80 mt-1"
                    >
                      {item.processed ? (
                        <CheckCircle className="w-5 h-5" weight="fill" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getTypeIcon(item.type)}</span>
                        <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                          {item.type}
                        </Badge>
                        {item.priority && (
                          <Badge
                            variant={
                              item.priority === 'high' ? 'destructive' :
                              item.priority === 'medium' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {item.priority === 'high' ? '높음' :
                             item.priority === 'medium' ? '보통' : '낮음'}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className={`font-semibold text-lg mb-2 ${item.processed ? 'line-through' : ''}`}>
                        {item.title}
                      </h3>
                      
                      {item.content && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {item.content}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(item.timestamp)}
                        </span>
                        <span>출처: {item.source}</span>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(item.id)}
                      className={item.starred ? 'text-yellow-500' : 'text-muted-foreground'}
                    >
                      <Star className="w-4 h-4" weight={item.starred ? 'fill' : 'regular'} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveItem(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      {filteredItems.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              총 {filteredItems.length}개 항목 | 
              처리된 항목 {filteredItems.filter(item => item.processed).length}개 | 
              즐겨찾기 {filteredItems.filter(item => item.starred).length}개
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}