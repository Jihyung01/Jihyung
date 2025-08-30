import { useState, useEffect, useRef } from 'react'
import { MagnifyingGlass, FileText, Hash, Plus, SortAscending, Funnel, X } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { listNotes, createNote, updateNote, deleteNote, searchNotes } from '../../lib/api'
import { toast } from 'sonner'

interface NotesPageProps {
  className?: string
}

interface Note {
  id: number
  title: string
  content: string
  summary?: string
  tags: string[]
  source_type?: string
  source_meta?: any
  created_at: string
  updated_at: string
}

export function NotesPage({ className }: NotesPageProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'updated_at' | 'created_at' | 'title'>('updated_at')
  const [showFilters, setShowFilters] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  
  // New note form state
  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newNoteTags, setNewNoteTags] = useState('')
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    loadNotes()
  }, [])

  useEffect(() => {
    // Debounced search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim() || selectedTags.length > 0) {
        performSearch()
      } else {
        loadNotes()
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, selectedTags])

  const loadNotes = async () => {
    setLoading(true)
    try {
      const data = await listNotes()
      setNotes(data || [])
    } catch (error) {
      console.error('Failed to load notes:', error)
      toast.error('노트 로딩에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const performSearch = async () => {
    setLoading(true)
    try {
      const data = await searchNotes(searchQuery, selectedTags)
      setNotes(data || [])
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('검색에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      toast.error('제목과 내용을 입력해주세요')
      return
    }

    try {
      const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      const noteData = {
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        tags,
        source_type: 'manual'
      }

      const createdNote = await createNote(noteData)
      setNotes(currentNotes => [createdNote, ...currentNotes])
      
      // Reset form
      setNewNoteTitle('')
      setNewNoteContent('')
      setNewNoteTags('')
      setIsCreating(false)
      
      toast.success('노트가 생성되었습니다')
    } catch (error) {
      console.error('Failed to create note:', error)
      toast.error('노트 생성에 실패했습니다')
    }
  }

  const handleUpdateNote = async (note: Note) => {
    try {
      const updatedNote = await updateNote(note.id, {
        title: note.title,
        content: note.content,
        tags: note.tags
      })
      
      setNotes(currentNotes => 
        currentNotes.map(n => n.id === note.id ? updatedNote : n)
      )
      
      setEditingNote(null)
      toast.success('노트가 업데이트되었습니다')
    } catch (error) {
      console.error('Failed to update note:', error)
      toast.error('노트 업데이트에 실패했습니다')
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm('정말로 이 노트를 삭제하시겠습니까?')) {
      return
    }

    try {
      await deleteNote(noteId)
      setNotes(currentNotes => currentNotes.filter(n => n.id !== noteId))
      toast.success('노트가 삭제되었습니다')
    } catch (error) {
      console.error('Failed to delete note:', error)
      toast.error('노트 삭제에 실패했습니다')
    }
  }

  const getUniqueTagsFromNotes = () => {
    const allTags = notes.flatMap(note => note.tags || [])
    return Array.from(new Set(allTags)).sort()
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(current => 
      current.includes(tag) 
        ? current.filter(t => t !== tag)
        : [...current, tag]
    )
  }

  const getSortedNotes = () => {
    return [...notes].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })
  }

  const getSourceTypeIcon = (sourceType?: string) => {
    switch (sourceType) {
      case 'youtube':
        return '🎥'
      case 'audio':
        return '🎙️'
      case 'url':
        return '🔗'
      default:
        return '📝'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                노트 관리
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                총 {notes.length}개의 노트
              </p>
            </div>
            
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  새 노트
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>새 노트 작성</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="노트 제목"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="노트 내용을 작성하세요..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[200px] resize-none"
                  />
                  <Input
                    placeholder="태그 (쉼표로 구분)"
                    value={newNoteTags}
                    onChange={(e) => setNewNoteTags(e.target.value)}
                  />
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1">
                      취소
                    </Button>
                    <Button onClick={handleCreateNote} className="flex-1">
                      생성
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="노트 제목, 내용, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Funnel className="h-4 w-4" />
                필터
              </Button>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">최근 수정순</SelectItem>
                  <SelectItem value="created_at">최근 생성순</SelectItem>
                  <SelectItem value="title">제목순</SelectItem>
                </SelectContent>
              </Select>

              {selectedTags.length > 0 && (
                <div className="flex items-center gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Hash className="h-3 w-3" />
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => toggleTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Tags Filter */}
            {showFilters && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">태그로 필터링</h4>
                <div className="flex flex-wrap gap-2">
                  {getUniqueTagsFromNotes().map(tag => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTag(tag)}
                      className="gap-1"
                    >
                      <Hash className="h-3 w-3" />
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            </CardContent>
          </Card>
        ) : getSortedNotes().length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || selectedTags.length > 0 ? '검색 결과가 없습니다' : '노트가 없습니다'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedTags.length > 0 
                  ? '다른 검색어나 필터를 시도해보세요' 
                  : '첫 번째 노트를 작성해보세요'
                }
              </p>
              <Button onClick={() => setIsCreating(true)}>
                새 노트 작성
              </Button>
            </CardContent>
          </Card>
        ) : (
          getSortedNotes().map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Note Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-xl" title={note.source_type}>
                        {getSourceTypeIcon(note.source_type)}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{note.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>생성: {formatDate(note.created_at)}</span>
                          {note.updated_at !== note.created_at && (
                            <span>수정: {formatDate(note.updated_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                      >
                        편집
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>

                  {/* Note Content */}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground leading-relaxed">
                      {truncateContent(note.content)}
                    </p>
                  </div>

                  {/* Summary */}
                  {note.summary && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">AI 요약</h4>
                      <p className="text-sm text-muted-foreground">{note.summary}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {note.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="gap-1 cursor-pointer"
                          onClick={() => !selectedTags.includes(tag) && toggleTag(tag)}
                        >
                          <Hash className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Note Dialog */}
      {editingNote && (
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>노트 편집</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="노트 제목"
                value={editingNote.title}
                onChange={(e) => setEditingNote({...editingNote, title: e.target.value})}
              />
              <Textarea
                placeholder="노트 내용"
                value={editingNote.content}
                onChange={(e) => setEditingNote({...editingNote, content: e.target.value})}
                className="min-h-[200px] resize-none"
              />
              <Input
                placeholder="태그 (쉼표로 구분)"
                value={editingNote.tags?.join(', ') || ''}
                onChange={(e) => setEditingNote({
                  ...editingNote, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                })}
              />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setEditingNote(null)} className="flex-1">
                  취소
                </Button>
                <Button onClick={() => handleUpdateNote(editingNote)} className="flex-1">
                  저장
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}