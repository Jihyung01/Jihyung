import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Tag, Calendar, FileText, CheckSquare } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Card, CardContent } from '../ui/card'
import { Note, Task, CalendarEvent } from '../../lib/enhanced-api'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  tasks: Task[]
  events: CalendarEvent[]
  onSelectItem: (type: string, item: any) => void
}

interface SearchResult {
  id: string
  type: 'note' | 'task' | 'event'
  title: string
  content: string
  meta: string
  item: any
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  notes,
  tasks,
  events,
  onSelectItem
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filter, setFilter] = useState<'all' | 'notes' | 'tasks' | 'events'>('all')

  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    const searchResults: SearchResult[] = []
    const query = searchQuery.toLowerCase()

    // Search notes
    if (filter === 'all' || filter === 'notes') {
      notes.forEach(note => {
        const titleMatch = note.title.toLowerCase().includes(query)
        const contentMatch = note.content.toLowerCase().includes(query)
        const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(query))
        
        if (titleMatch || contentMatch || tagsMatch) {
          searchResults.push({
            id: `note-${note.id}`,
            type: 'note',
            title: note.title,
            content: note.content.slice(0, 100) + '...',
            meta: `${note.tags?.length || 0}개 태그 • ${format(new Date(note.created_at), 'MM/dd', { locale: ko })}`,
            item: note
          })
        }
      })
    }

    // Search tasks
    if (filter === 'all' || filter === 'tasks') {
      tasks.forEach(task => {
        const titleMatch = task.title.toLowerCase().includes(query)
        const descriptionMatch = task.description?.toLowerCase().includes(query)
        
        if (titleMatch || descriptionMatch) {
          searchResults.push({
            id: `task-${task.id}`,
            type: 'task',
            title: task.title,
            content: task.description || '',
            meta: `${task.priority} 우선순위 • ${task.status}`,
            item: task
          })
        }
      })
    }

    // Search events
    if (filter === 'all' || filter === 'events') {
      events.forEach(event => {
        const titleMatch = event.title.toLowerCase().includes(query)
        const descriptionMatch = event.description?.toLowerCase().includes(query)
        
        if (titleMatch || descriptionMatch) {
          searchResults.push({
            id: `event-${event.id}`,
            type: 'event',
            title: event.title,
            content: event.description || '',
            meta: event.start_at ? format(new Date(event.start_at), 'MM/dd HH:mm', { locale: ko }) : '',
            item: event
          })
        }
      })
    }

    // Sort by relevance (title matches first)
    searchResults.sort((a, b) => {
      const aTitle = a.title.toLowerCase().includes(query)
      const bTitle = b.title.toLowerCase().includes(query)
      
      if (aTitle && !bTitle) return -1
      if (!aTitle && bTitle) return 1
      
      return a.title.localeCompare(b.title)
    })

    setResults(searchResults.slice(0, 20)) // Limit to 20 results
    setSelectedIndex(0)
  }, [notes, tasks, events, filter])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setFilter('all')
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        const result = results[selectedIndex]
        onSelectItem(result.type, result.item)
        onClose()
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="w-4 h-4" />
      case 'task': return <CheckSquare className="w-4 h-4" />
      case 'event': return <Calendar className="w-4 h-4" />
      default: return <Search className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-800'
      case 'task': return 'bg-green-100 text-green-800'
      case 'event': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            전체 검색
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="노트, 태스크, 일정 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            {(['all', 'notes', 'tasks', 'events'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterType)}
                className="flex items-center gap-1"
              >
                {filterType === 'all' && <Filter className="w-3 h-3" />}
                {filterType === 'notes' && <FileText className="w-3 h-3" />}
                {filterType === 'tasks' && <CheckSquare className="w-3 h-3" />}
                {filterType === 'events' && <Calendar className="w-3 h-3" />}
                {filterType === 'all' ? '전체' : 
                 filterType === 'notes' ? '노트' : 
                 filterType === 'tasks' ? '태스크' : '일정'}
              </Button>
            ))}
          </div>

          {/* Results */}
          <ScrollArea className="max-h-96">
            {results.length === 0 && query && (
              <div className="text-center py-8 text-muted-foreground">
                검색 결과가 없습니다.
              </div>
            )}
            
            {results.length === 0 && !query && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>검색어를 입력하세요</p>
                <p className="text-sm mt-2">
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">↑↓</kbd> 이동 
                  <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Enter</kbd> 선택
                  <kbd className="px-2 py-1 bg-muted rounded text-xs ml-2">Esc</kbd> 닫기
                </p>
              </div>
            )}

            <div className="space-y-2">
              {results.map((result, index) => (
                <Card
                  key={result.id}
                  className={`cursor-pointer transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent border-accent-foreground/20' 
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => {
                    onSelectItem(result.type, result.item)
                    onClose()
                  }}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{result.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getTypeColor(result.type)}`}
                          >
                            {result.type === 'note' ? '노트' : 
                             result.type === 'task' ? '태스크' : '일정'}
                          </Badge>
                        </div>
                        {result.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {result.content}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {result.meta}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
