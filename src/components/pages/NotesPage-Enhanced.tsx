import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Search, 
  BookOpen,
  Edit3,
  Trash2,
  Save,
  X,
  Tag,
  Calendar,
  Eye,
  FileText,
  Filter,
  SortAsc,
  MoreHorizontal,
  Star,
  Archive,
  Download,
  Share2,
  Brain,
  Sparkles,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import enhancedAPI, { type Note } from '@/lib/enhanced-api.ts';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface NotesPageProps {
  onNoteCreated?: (note: Note) => void;
}

export const NotesPage: React.FC<NotesPageProps> = ({ onNoteCreated }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_desc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  // 새 노트 폼 상태
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    tagInput: ''
  });

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await enhancedAPI.getNotes();
      setNotes(data);
      setFilteredNotes(data);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    try {
      console.log('Creating note with:', newNote);
      const noteData = {
        title: newNote.title || '제목 없음',
        content: newNote.content,
        tags: newNote.tags
      };
      console.log('Sending note data:', noteData);
      const result = await enhancedAPI.createNote(noteData);
      console.log('Note created successfully:', result);
      
      // Notify parent component
      onNoteCreated?.(result);
      
      setNewNote({
        title: '',
        content: '',
        tags: [],
        tagInput: ''
      });
      setShowCreateDialog(false);
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
      alert('노트 생성에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateNote = async (noteId: number, updates: Partial<Note>) => {
    try {
      await enhancedAPI.updateNote(noteId, updates);
      await loadNotes();
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const deleteNote = async (noteId: number) => {
    try {
      await enhancedAPI.deleteNote(noteId);
      await loadNotes();
      setViewingNote(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const addTag = (tagInput: string, isNew = true) => {
    const tag = tagInput.trim();
    if (tag && !newNote.tags.includes(tag)) {
      setNewNote({
        ...newNote,
        tags: [...newNote.tags, tag],
        tagInput: isNew ? '' : newNote.tagInput
      });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote({
      ...newNote,
      tags: newNote.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(newNote.tagInput);
    }
  };

  const getAllTags = () => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // 필터링 및 정렬 로직
  useEffect(() => {
    let filtered = [...notes];

    // 검색 필터
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 태그 필터
    if (tagFilter !== 'all') {
      filtered = filtered.filter(note => note.tags.includes(tagFilter));
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated_desc':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'updated_asc':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
        case 'created_desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'created_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchQuery, tagFilter, sortBy]);

  useEffect(() => {
    loadNotes();
  }, []);

  const downloadNote = (note: Note) => {
    try {
      const createdAt = note.created_at;
      const updatedAt = note.updated_at;
      
      const content = `# ${note.title}\n\n${note.content}\n\n---\n작성일: ${createdAt ? format(new Date(createdAt), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n수정일: ${updatedAt ? format(new Date(updatedAt), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n태그: ${note.tags?.join(', ') || '태그 없음'}`;
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download note:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">노트</h1>
          <p className="text-muted-foreground">
            아이디어와 지식을 체계적으로 정리하고 관리하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                새 노트
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 노트 작성</DialogTitle>
              <DialogDescription>
                새로운 아이디어나 정보를 기록해보세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">제목</label>
                <Input
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="노트 제목..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">내용 *</label>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="여기에 내용을 작성하세요..."
                  rows={10}
                  className="resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">태그</label>
                <div className="space-y-2">
                  <Input
                    value={newNote.tagInput}
                    onChange={(e) => setNewNote({ ...newNote, tagInput: e.target.value })}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder="태그 입력 후 Enter 또는 , 로 추가..."
                  />
                  {newNote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newNote.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <X
                            className="w-3 h-3 cursor-pointer"
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={createNote} disabled={!newNote.content.trim()}>
                  <Save className="w-4 h-4 mr-2" />
                  노트 저장
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  취소
                </Button>
              </div>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              전체 노트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              태그 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAllTags().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              이번 주 작성
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notes.filter(note => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return new Date(note.created_at) > weekAgo;
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              총 글자 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notes.reduce((total, note) => total + note.content.length, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="노트 검색 (제목, 내용, 태그)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="태그 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 태그</SelectItem>
                  {getAllTags().map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">최근 수정순</SelectItem>
                  <SelectItem value="updated_asc">오래된 수정순</SelectItem>
                  <SelectItem value="created_desc">최근 생성순</SelectItem>
                  <SelectItem value="created_asc">오래된 생성순</SelectItem>
                  <SelectItem value="title_asc">제목 A-Z</SelectItem>
                  <SelectItem value="title_desc">제목 Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 노트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">노트가 없습니다</h3>
                  <p className="mb-4">
                    {notes.length === 0 
                      ? "첫 번째 노트를 작성해보세요!" 
                      : "검색 조건에 맞는 노트가 없습니다."
                    }
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    새 노트 작성
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="h-fit hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base line-clamp-2" onClick={() => setViewingNote(note)}>
                    {note.title || '제목 없음'}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewingNote(note)}>
                        <Eye className="w-4 h-4 mr-2" />
                        보기
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingNote(note)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadNote(note)}>
                        <Download className="w-4 h-4 mr-2" />
                        다운로드
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-sm text-muted-foreground line-clamp-4 mb-3"
                  onClick={() => setViewingNote(note)}
                >
                  {note.content.slice(0, 200)}...
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {note.tags.length > 3 && (
                      <Badge variant="outline">
                        +{note.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {(() => {
                    try {
                      const updatedAt = note.updated_at;
                      return updatedAt ? formatDistanceToNow(new Date(updatedAt), { 
                        addSuffix: true
                      }) : '시간 정보 없음';
                    } catch (error) {
                      return '시간 정보 없음';
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 노트 보기 다이얼로그 */}
      {viewingNote && (
        <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{viewingNote.title || '제목 없음'}</DialogTitle>
              <DialogDescription>
                {(() => {
                  try {
                    const createdAt = viewingNote.created_at;
                    const updatedAt = viewingNote.updated_at;
                    const createdText = createdAt ? format(new Date(createdAt), 'yyyy년 M월 d일 HH:mm') : '정보 없음';
                    const updatedText = updatedAt ? format(new Date(updatedAt), 'yyyy년 M월 d일 HH:mm') : '정보 없음';
                    return `작성일: ${createdText} • 수정일: ${updatedText}`;
                  } catch (error) {
                    return '날짜 정보를 불러올 수 없습니다';
                  }
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {viewingNote.content}
                </pre>
              </div>
              
              {viewingNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingNote.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => setEditingNote(viewingNote)} className="gap-2">
                  <Edit3 className="w-4 h-4" />
                  수정
                </Button>
                <Button variant="outline" onClick={() => downloadNote(viewingNote)} className="gap-2">
                  <Download className="w-4 h-4" />
                  다운로드
                </Button>
                <Button variant="outline" onClick={() => setViewingNote(null)}>
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
