import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Tag, Edit, Trash2, FileText } from '@phosphor-icons/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'
import { Label } from '../../components/ui/label'
import { getNotes, createNote } from '../../lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Note {
  id: string
  title: string
  content: string
  summary?: string
  tags: string[]
  created_at: string
  updated_at: string
  user_id: string
  version: number
  is_archived: boolean
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  
  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')

  // Load notes
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      let data: Note[]
      
      if (searchQuery || selectedTags.length > 0) {
        data = await getNotes(searchQuery, selectedTags)
      } else {
        data = await getNotes()
      }
      
      setNotes(data)
    } catch (error) {
      console.error('Failed to load notes:', error)
      toast.error('노트 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedTags])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      loadNotes()
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery, selectedTags])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('search-input')?.focus()
      } else if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setIsCreateOpen(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleCreateNote = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요')
      return
    }

    try {
      const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      
      const newNote = await createNote({
        title: title.trim(),
        content: content.trim(),
        tags
      })
      
      setNotes(prevNotes => [newNote, ...prevNotes])
      setIsCreateOpen(false)
      setTitle('')
      setContent('')
      setTagInput('')
      toast.success('노트가 생성되었습니다')
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('노트 생성에 실패했습니다')
    }
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedTags([])
  }

  // Get all unique tags from notes
  const allTags = Array.from(new Set(notes.flatMap(note => note.tags)))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" weight="bold" />
              <h1 className="text-2xl font-bold text-foreground">노트</h1>
            </div>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 노트
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 노트 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">제목</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="노트 제목을 입력하세요"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="content">내용 (Markdown 지원)</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="# 제목

여기에 노트 내용을 마크다운으로 작성하세요...

- 목록 아이템 1
- 목록 아이템 2

**굵은 글씨** *기울임* `코드`"
                      className="mt-1 min-h-[300px] font-mono"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="개발, 아이디어, 회의"
                      className="mt-1"
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleCreateNote}>
                      저장
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                type="text"
                placeholder="노트 검색... (/ 또는 Ctrl+K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {(searchQuery || selectedTags.length > 0) && (
              <Button variant="outline" onClick={clearFilters}>
                필터 초기화
              </Button>
            )}
          </div>
          
          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="h-3 w-3" />
                태그:
              </span>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery || selectedTags.length > 0 ? '검색 결과가 없습니다' : '노트가 없습니다'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedTags.length > 0 
                ? '다른 검색어나 태그를 시도해보세요'
                : '첫 번째 노트를 작성해보세요'
              }
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              새 노트 작성
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map(note => (
              <Card key={note.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-2">
                    {note.title || '제목 없음'}
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(note.created_at), 'yyyy.MM.dd HH:mm')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {note.content.slice(0, 150)}...
                  </p>
                  
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      편집
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Keyboard shortcuts help */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>키보드 단축키: <strong>/</strong> 검색, <strong>n</strong> 새 노트, <strong>Ctrl+K</strong> 검색 포커스</p>
        </div>
      </main>
    </div>
  )
}