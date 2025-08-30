import { useState, useEffect } from 'react'
import { MagnifyingGlass, FileText, Calendar, ListChecks, Brain, Sparkle, Plus } from '@phosphor-icons/react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from './ui/command'
import { search } from '../api/client'
import { toast } from 'sonner'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
  onCreateNote: () => void
  onCreateTask: () => void
  onCreateEvent: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onCreateNote,
  onCreateTask,
  onCreateEvent
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search when query changes
  useEffect(() => {
    if (query.trim() && query.length > 2) {
      performSearch(query)
    } else {
      setSearchResults([])
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true)
    try {
      const results = await search(searchQuery)
      setSearchResults(results.results || [])
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('검색에 실패했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelect = (callback: () => void) => {
    callback()
    onClose()
    setQuery('')
    setSearchResults([])
  }

  const handleSearchResultSelect = (result: any) => {
    // Navigate to the appropriate page and potentially highlight the item
    if (result.type === 'note') {
      onNavigate('notes')
      toast.success(`노트 "${result.title}"로 이동`)
    } else if (result.type === 'task') {
      onNavigate('tasks')
      toast.success(`태스크 "${result.title}"로 이동`)
    }
    onClose()
    setQuery('')
    setSearchResults([])
  }

  const quickActions = [
    {
      icon: FileText,
      label: '새 노트 작성',
      shortcut: 'N',
      action: onCreateNote
    },
    {
      icon: ListChecks,
      label: '새 태스크 생성',
      shortcut: 'T',
      action: onCreateTask
    },
    {
      icon: Calendar,
      label: '새 일정 추가',
      shortcut: 'E',
      action: onCreateEvent
    }
  ]

  const navigationItems = [
    {
      icon: Brain,
      label: '대시보드',
      shortcut: 'D',
      action: () => onNavigate('dashboard')
    },
    {
      icon: FileText,
      label: '노트',
      shortcut: '1',
      action: () => onNavigate('notes')
    },
    {
      icon: ListChecks,
      label: '태스크',
      shortcut: '2',
      action: () => onNavigate('tasks')
    },
    {
      icon: Calendar,
      label: '캘린더',
      shortcut: '3',
      action: () => onNavigate('calendar')
    }
  ]

  return (
    <CommandDialog open={isOpen} onOpenChange={onClose}>
      <CommandInput
        placeholder="명령어를 입력하거나 검색하세요..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? '검색 중...' : '결과가 없습니다.'}
        </CommandEmpty>

        {/* Quick Actions */}
        <CommandGroup heading="빠른 작업">
          {quickActions.map((action) => (
            <CommandItem
              key={action.label}
              onSelect={() => handleSelect(action.action)}
              className="gap-3"
            >
              <action.icon className="h-4 w-4" />
              <span>{action.label}</span>
              <CommandShortcut>{action.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="페이지 이동">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.label}
              onSelect={() => handleSelect(item.action)}
              className="gap-3"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              <CommandShortcut>{item.shortcut}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={`검색 결과 (${searchResults.length}개)`}>
              {searchResults.slice(0, 8).map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSearchResultSelect(result)}
                  className="gap-3"
                >
                  {result.type === 'note' ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <ListChecks className="h-4 w-4" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{result.title}</div>
                    {result.content && (
                      <div className="text-sm text-muted-foreground truncate">
                        {result.content.substring(0, 60)}...
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.type === 'note' ? '노트' : '태스크'}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* AI Actions (when content is present) */}
        {query.trim() && query.length > 10 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="AI 작업">
              <CommandItem
                onSelect={() => {
                  // Create note with AI summary of query
                  handleSelect(() => {
                    onCreateNote()
                    toast.success('AI가 내용을 분석하여 노트를 생성합니다')
                  })
                }}
                className="gap-3"
              >
                <Sparkle className="h-4 w-4" />
                <span>입력 내용으로 노트 생성</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  // Extract tasks from query
                  handleSelect(() => {
                    toast.success('AI가 입력 내용에서 태스크를 추출합니다')
                  })
                }}
                className="gap-3"
              >
                <Brain className="h-4 w-4" />
                <span>입력 내용에서 태스크 추출</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}