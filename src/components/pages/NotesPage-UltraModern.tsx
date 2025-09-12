import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Lightbulb,
  Layers,
  Grid3X3,
  List,
  Heart,
  Clock,
  Zap
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [favoriteNotes, setFavoriteNotes] = useState<Set<string>>(new Set());

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
      toast.error('노트를 불러올 수 없습니다');
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
      toast.success('노트가 성공적으로 생성되었습니다! ✨');
    } catch (error) {
      console.error('Failed to create note:', error);
      toast.error('노트 생성에 실패했습니다: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const updateNote = async (noteId: string | number, updates: Partial<Note>) => {
    try {
      await enhancedAPI.updateNote(noteId, updates);
      await loadNotes();
      setEditingNote(null);
      toast.success('노트가 업데이트되었습니다! 📝');
    } catch (error) {
      console.error('Failed to update note:', error);
      toast.error('노트 업데이트에 실패했습니다');
    }
  };

  const deleteNote = async (noteId: string | number) => {
    try {
      await enhancedAPI.deleteNote(noteId);
      await loadNotes();
      setViewingNote(null);
      toast.success('노트가 삭제되었습니다 🗑️');
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('노트 삭제에 실패했습니다');
    }
  };

  const toggleFavorite = (noteId: string) => {
    const newFavorites = new Set(favoriteNotes);
    if (newFavorites.has(noteId)) {
      newFavorites.delete(noteId);
      toast.success('즐겨찾기에서 제거했습니다');
    } else {
      newFavorites.add(noteId);
      toast.success('즐겨찾기에 추가했습니다 ⭐');
    }
    setFavoriteNotes(newFavorites);
  };

  // Filter and sort notes
  useEffect(() => {
    let filtered = [...notes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Tag filter
    if (tagFilter !== 'all') {
      filtered = filtered.filter(note => note.tags?.includes(tagFilter));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'created_asc':
          return new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime();
        case 'created_desc':
          return new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime();
        case 'updated_asc':
          return new Date(a.updated_at!).getTime() - new Date(b.updated_at!).getTime();
        case 'updated_desc':
        default:
          return new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime();
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchQuery, tagFilter, sortBy]);

  useEffect(() => {
    loadNotes();
  }, []);

  const allTags = Array.from(new Set(notes.flatMap(note => note.tags || [])));

  const addTag = () => {
    if (newNote.tagInput.trim() && !newNote.tags.includes(newNote.tagInput.trim())) {
      setNewNote(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: ''
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewNote(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <motion.div 
              className="h-10 bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 rounded-lg w-48"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
            <motion.div 
              className="h-10 bg-gradient-to-r from-blue-200 to-indigo-200 dark:from-blue-800 dark:to-indigo-800 rounded-lg w-32"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <motion.div
                key={index}
                className="h-64 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-700/30"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5, delay: index * 0.1 }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-purple-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Enhanced Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <BookOpen className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                노트 컬렉션
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                총 {notes.length}개의 노트 • {filteredNotes.length}개 표시 중
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                새 노트 작성
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div 
          className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="노트 제목, 내용, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <Tag className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="태그 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 태그</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl">
                  <SortAsc className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_desc">최근 수정순</SelectItem>
                  <SelectItem value="updated_asc">오래된 수정순</SelectItem>
                  <SelectItem value="created_desc">최근 생성순</SelectItem>
                  <SelectItem value="created_asc">오래된 생성순</SelectItem>
                  <SelectItem value="title_asc">제목 오름차순</SelectItem>
                  <SelectItem value="title_desc">제목 내림차순</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex bg-white/80 dark:bg-gray-700/80 rounded-xl p-1 border border-white/30 dark:border-gray-600/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all duration-300 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Notes Grid/List */}
        <AnimatePresence mode="wait">
          {filteredNotes.length === 0 ? (
            <motion.div 
              className="text-center py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotateY: [0, 180, 360]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <BookOpen className="h-12 w-12 text-white" />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {searchQuery || tagFilter !== 'all' ? '검색 결과가 없습니다' : '아직 노트가 없습니다'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                {searchQuery || tagFilter !== 'all' 
                  ? '다른 검색어나 필터를 시도해보세요' 
                  : '첫 번째 노트를 작성해보세요! 지식과 아이디어를 기록하고 관리할 수 있습니다.'
                }
              </p>
              {!searchQuery && tagFilter === 'all' && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    첫 노트 작성하기
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
              }
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className="group"
                >
                  <Card className={`
                    bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 
                    shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden
                    ${viewMode === 'list' ? 'flex' : ''}
                  `}>
                    <CardHeader className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {note.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleFavorite(note.id!.toString())}
                            className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg"
                          >
                            <Heart 
                              className={`h-4 w-4 ${
                                favoriteNotes.has(note.id!.toString()) 
                                  ? 'fill-red-500 text-red-500' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
                              <DropdownMenuItem 
                                onClick={() => setViewingNote(note)}
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                상세 보기
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setEditingNote(note)}
                                className="hover:bg-green-50 dark:hover:bg-green-900/30"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                편집
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => deleteNote(note.id!)}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-3 text-sm leading-relaxed">
                          {note.content || '내용이 없습니다.'}
                        </p>
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {note.tags.slice(0, viewMode === 'list' ? 5 : 3).map((tag, tagIndex) => (
                              <motion.div
                                key={tag}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: tagIndex * 0.05 }}
                              >
                                <Badge 
                                  variant="secondary" 
                                  className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-0 text-xs px-2 py-1 rounded-lg"
                                >
                                  #{tag}
                                </Badge>
                              </motion.div>
                            ))}
                            {note.tags.length > (viewMode === 'list' ? 5 : 3) && (
                              <Badge variant="outline" className="text-xs">
                                +{note.tags.length - (viewMode === 'list' ? 5 : 3)}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(note.updated_at!), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </div>
                            {favoriteNotes.has(note.id!.toString()) && (
                              <div className="flex items-center gap-1 text-red-500">
                                <Heart className="h-3 w-3 fill-current" />
                                즐겨찾기
                              </div>
                            )}
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingNote(note)}
                            className="h-7 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg px-3"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            열기
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ultra-Modern Create Note Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                새로운 노트 작성 ✨
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                아이디어와 지식을 기록하고 체계적으로 관리하세요
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">제목</label>
                <Input
                  placeholder="노트 제목을 입력하세요..."
                  value={newNote.title}
                  onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">내용</label>
                <Textarea
                  placeholder="자유롭게 내용을 작성하세요..."
                  value={newNote.content}
                  onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                  className="min-h-[200px] bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">태그</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="태그를 입력하고 Enter를 누르세요..."
                    value={newNote.tagInput}
                    onChange={(e) => setNewNote(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  />
                  <Button 
                    onClick={addTag}
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 rounded-xl"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {newNote.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newNote.tags.map((tag, index) => (
                      <motion.div
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-0 px-3 py-1 rounded-lg"
                        >
                          #{tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 hover:text-red-500 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="px-6 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                취소
              </Button>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  onClick={createNote}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-2 rounded-xl shadow-lg transition-all duration-300"
                >
                  <Save className="h-4 w-4 mr-2" />
                  노트 생성
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Note Dialog */}
        <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            {viewingNote && (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                      {viewingNote.title}
                    </DialogTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleFavorite(viewingNote.id!.toString())}
                        className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg"
                      >
                        <Heart 
                          className={`h-4 w-4 ${
                            favoriteNotes.has(viewingNote.id!.toString()) 
                              ? 'fill-red-500 text-red-500' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingNote(viewingNote);
                          setViewingNote(null);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        편집
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteNote(viewingNote.id!)}
                        className="rounded-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        삭제
                      </Button>
                    </div>
                  </div>
                  <DialogDescription className="text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(new Date(viewingNote.updated_at!), { addSuffix: true, locale: ko })}에 수정됨
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 whitespace-pre-wrap">
                      {viewingNote.content || '내용이 없습니다.'}
                    </div>
                  </div>
                  
                  {viewingNote.tags && viewingNote.tags.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">태그</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingNote.tags.map((tag, index) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Badge 
                              variant="secondary" 
                              className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 border-0 px-3 py-1 rounded-lg"
                            >
                              #{tag}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default NotesPage;
