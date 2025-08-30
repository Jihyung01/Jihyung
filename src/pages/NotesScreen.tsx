import { useState, useEffect } from 'react'
import { 
  Note, 
  Plus,
  MagnifyingGlass,
  Funnel,
  Tag,
  Folder,
  BookOpen,
  Star,
  PushPin,
  DotsThree,
  Clock,
  FileText,
  Lightbulb,
  Presentation,
  User,
  Archive,
  Trash
} from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import { useApp } from '../contexts/AppContext'
import type { Note as NoteType } from '../contexts/AppContext'

export function NotesScreen() {
  const { state, actions } = useApp()
  const { notes } = state
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteType | null>(null)
  
  // Form state for creating/editing notes
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'note' as 'note' | 'idea' | 'project' | 'meeting' | 'personal',
    tags: [] as string[],
    folder: '',
    color: '#3b82f6',
    starred: false,
    pinned: false
  })

  // Reset form when dialog closes
  useEffect(() => {
    if (!isCreateDialogOpen && !editingNote) {
      setFormData({
        title: '',
        content: '',
        type: 'note',
        tags: [],
        folder: '',
        color: '#3b82f6',
        starred: false,
        pinned: false
      })
    }
  }, [isCreateDialogOpen, editingNote])

  // Load editing note data
  useEffect(() => {
    if (editingNote) {
      setFormData({
        title: editingNote.title,
        content: editingNote.content,
        type: editingNote.type,
        tags: editingNote.tags,
        folder: editingNote.folder || '',
        color: editingNote.color || '#3b82f6',
        starred: editingNote.starred,
        pinned: editingNote.pinned
      })
    }
  }, [editingNote])

  const folders = ['all', ...Array.from(new Set(notes.map(note => note.folder).filter((folder): folder is string => Boolean(folder))))]
  
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'starred' && note.starred) ||
                       (filterType === 'pinned' && note.pinned) ||
                       note.type === filterType
    
    const matchesFolder = selectedFolder === 'all' || note.folder === selectedFolder
    
    return matchesSearch && matchesType && matchesFolder
  })

  const toggleStar = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      actions.updateNote({ ...note, starred: !note.starred })
      toast.success(note.starred ? '즐겨찾기에서 제거했습니다' : '즐겨찾기에 추가했습니다')
    }
  }

  const togglePin = (id: string) => {
    const note = notes.find(n => n.id === id)
    if (note) {
      actions.updateNote({ ...note, pinned: !note.pinned })
      toast.success(note.pinned ? '고정이 해제되었습니다' : '노트가 고정되었습니다')
    }
  }

  const deleteNote = (id: string) => {
    actions.deleteNote(id)
    toast.success('노트가 삭제되었습니다!')
  }

  const handleSaveNote = () => {
    if (!formData.title.trim()) {
      toast.error('제목을 입력해주세요')
      return
    }

    if (!formData.content.trim()) {
      toast.error('내용을 입력해주세요')
      return
    }

    if (editingNote) {
      // Update existing note
      actions.updateNote({
        ...editingNote,
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        folder: formData.folder.trim() || undefined
      })
      toast.success('노트가 수정되었습니다!')
      setEditingNote(null)
    } else {
      // Create new note
      actions.addNote({
        ...formData,
        tags: formData.tags.filter(tag => tag.trim() !== ''),
        folder: formData.folder.trim() || undefined,
        wordCount: formData.content.length
      })
      toast.success('노트가 생성되었습니다!')
      setIsCreateDialogOpen(false)
    }
  }

  const handleEditNote = (note: NoteType) => {
    setEditingNote(note)
  }

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const input = e.currentTarget
      const value = input.value.trim()
      if (value && !formData.tags.includes(value)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, value]
        }))
        input.value = ''
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="w-4 h-4" />
      case 'idea': return <Lightbulb className="w-4 h-4" />
      case 'project': return <Folder className="w-4 h-4" />
      case 'meeting': return <Presentation className="w-4 h-4" />
      case 'personal': return <User className="w-4 h-4" />
      default: return <Note className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'note': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'idea': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'project': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'meeting': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'personal': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    // 고정된 노트를 먼저 표시
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    // 그 다음 즐겨찾기
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    // 마지막으로 업데이트 시간순
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Note className="w-8 h-8" />
            노트
          </h1>
          <p className="text-muted-foreground mt-1">
            {filteredNotes.length}개의 노트가 있습니다
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? '목록' : '그리드'}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 노트
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>새 노트 작성</DialogTitle>
                <DialogDescription>
                  새로운 노트를 작성해보세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">제목</Label>
                    <Input 
                      id="title"
                      placeholder="노트 제목을 입력하세요..." 
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">타입</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">일반 노트</SelectItem>
                        <SelectItem value="idea">아이디어</SelectItem>
                        <SelectItem value="project">프로젝트</SelectItem>
                        <SelectItem value="meeting">회의록</SelectItem>
                        <SelectItem value="personal">개인</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="folder">폴더</Label>
                    <Input 
                      id="folder"
                      placeholder="폴더명 (선택사항)"
                      value={formData.folder}
                      onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">색상</Label>
                    <Input 
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">태그</Label>
                  <div className="space-y-2">
                    <Input 
                      placeholder="태그를 입력하고 Enter 또는 쉼표를 누르세요..."
                      onKeyDown={handleTagInput}
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">내용</Label>
                  <Textarea 
                    id="content"
                    className="min-h-96 resize-none"
                    placeholder="내용을 입력하세요..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.starred}
                      onChange={(e) => setFormData(prev => ({ ...prev, starred: e.target.checked }))}
                      className="rounded"
                    />
                    <Star className="w-4 h-4" />
                    즐겨찾기
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                      className="rounded"
                    />
                    <PushPin className="w-4 h-4" />
                    고정
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    취소
                  </Button>
                  <Button onClick={handleSaveNote}>
                    저장
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={!!editingNote} onOpenChange={(open) => !open && setEditingNote(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>노트 편집</DialogTitle>
                <DialogDescription>
                  노트를 수정해보세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">제목</Label>
                    <Input 
                      id="edit-title"
                      placeholder="노트 제목을 입력하세요..." 
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-type">타입</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">일반 노트</SelectItem>
                        <SelectItem value="idea">아이디어</SelectItem>
                        <SelectItem value="project">프로젝트</SelectItem>
                        <SelectItem value="meeting">회의록</SelectItem>
                        <SelectItem value="personal">개인</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-folder">폴더</Label>
                    <Input 
                      id="edit-folder"
                      placeholder="폴더명 (선택사항)"
                      value={formData.folder}
                      onChange={(e) => setFormData(prev => ({ ...prev, folder: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-color">색상</Label>
                    <Input 
                      id="edit-color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-tags">태그</Label>
                  <div className="space-y-2">
                    <Input 
                      placeholder="태그를 입력하고 Enter 또는 쉼표를 누르세요..."
                      onKeyDown={handleTagInput}
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="w-3 h-3 mr-1" />
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-content">내용</Label>
                  <Textarea 
                    id="edit-content"
                    className="min-h-96 resize-none"
                    placeholder="내용을 입력하세요..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.starred}
                      onChange={(e) => setFormData(prev => ({ ...prev, starred: e.target.checked }))}
                      className="rounded"
                    />
                    <Star className="w-4 h-4" />
                    즐겨찾기
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.pinned}
                      onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
                      className="rounded"
                    />
                    <PushPin className="w-4 h-4" />
                    고정
                  </label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditingNote(null)}>
                    취소
                  </Button>
                  <Button onClick={handleSaveNote}>
                    저장
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="노트에서 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Folder Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Folder className="w-4 h-4" />
              {selectedFolder === 'all' ? '전체 폴더' : selectedFolder}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {folders.map(folder => (
              <DropdownMenuItem
                key={folder}
                onClick={() => setSelectedFolder(folder)}
              >
                {folder === 'all' ? '전체 폴더' : folder}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Type Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Funnel className="w-4 h-4" />
              필터
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              전체
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('starred')}>
              즐겨찾기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('pinned')}>
              고정된 노트
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterType('note')}>
              일반 노트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('idea')}>
              아이디어
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('project')}>
              프로젝트
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('meeting')}>
              회의록
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('personal')}>
              개인
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notes Grid/List */}
      <div className={`gap-4 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4'}`}>
        {sortedNotes.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">노트가 없습니다</h3>
              <p className="text-muted-foreground mb-4">
                첫 번째 노트를 작성해보세요!
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                노트 작성하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-all cursor-pointer group relative">
              {note.color && (
                <div 
                  className="absolute top-0 left-0 w-full h-1 rounded-t-lg"
                  style={{ backgroundColor: note.color }}
                />
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    {note.pinned && (
                      <PushPin className="w-4 h-4 text-orange-500" weight="fill" />
                    )}
                    <Badge className={`text-xs ${getTypeColor(note.type)}`}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(note.type)}
                        {note.type}
                      </span>
                    </Badge>
                    {note.folder && (
                      <Badge variant="outline" className="text-xs">
                        {note.folder}
                      </Badge>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <DotsThree className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEditNote(note)}>
                        <FileText className="w-4 h-4 mr-2" />
                        편집
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleStar(note.id)}>
                        <Star className="w-4 h-4 mr-2" />
                        {note.starred ? '즐겨찾기 해제' : '즐겨찾기'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePin(note.id)}>
                        <PushPin className="w-4 h-4 mr-2" />
                        {note.pinned ? '고정 해제' : '고정'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="w-4 h-4 mr-2" />
                        아카이브
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <CardTitle 
                  className="text-lg leading-tight cursor-pointer"
                  onClick={() => handleEditNote(note)}
                >
                  {note.title}
                  {note.starred && (
                    <Star className="inline w-4 h-4 text-yellow-500 ml-2" weight="fill" />
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p 
                  className="text-sm text-muted-foreground line-clamp-3 mb-4 cursor-pointer"
                  onClick={() => handleEditNote(note)}
                >
                  {note.content.replace(/[#*`]/g, '').slice(0, 150)}...
                </p>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(note.updatedAt)}
                  </span>
                  <span>{note.wordCount}자</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {sortedNotes.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span>총 {filteredNotes.length}개 노트</span>
              <span>즐겨찾기 {filteredNotes.filter(note => note.starred).length}개</span>
              <span>고정됨 {filteredNotes.filter(note => note.pinned).length}개</span>
              <span>총 {filteredNotes.reduce((sum, note) => sum + note.wordCount, 0).toLocaleString()}자</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
