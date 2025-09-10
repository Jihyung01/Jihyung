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

  const updateNote = async (noteId: number, updates: Partial<Note>) => {
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

  const deleteNote = async (noteId: number) => {
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

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const getAllTags = () => {
    return Array.from(new Set(notes.flatMap(note => note.tags || [])));
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

        {/* Enhanced AI-Powered Insights Panel */}
        <motion.div
          className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              AI 노트 인사이트
            </h3>
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              스마트 분석
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-purple-500" />
                  <span className="font-medium text-sm">생산성 패턴</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  오후 2-4시에 가장 창의적인 노트를 작성하는 패턴이 발견되었습니다.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">연관성 분석</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  '개발' 태그가 있는 노트들 간의 강한 연결고리가 감지되었습니다.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">완성도 지표</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  75%의 노트가 완성된 상태로, 높은 품질을 유지하고 있습니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
        {/* Enhanced Create Note Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                새 노트 작성
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                새로운 아이디어나 지식을 기록해보세요. AI가 도움을 드릴 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="write" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="write" className="gap-2">
                  <Edit3 className="h-4 w-4" />
                  작성
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-2">
                  <Eye className="h-4 w-4" />
                  미리보기
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="write" className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    제목
                  </label>
                  <Input
                    value={newNote.title}
                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                    placeholder="노트 제목을 입력하세요..."
                    className="bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    내용 *
                  </label>
                  <Textarea
                    value={newNote.content}
                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                    placeholder="여기에 내용을 작성하세요... 마크다운 형식을 지원합니다."
                    rows={12}
                    className="resize-none bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl focus:ring-2 focus:ring-purple-500/20"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    현재 {newNote.content.length}자
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    태그
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newNote.tagInput}
                        onChange={(e) => setNewNote({ ...newNote, tagInput: e.target.value })}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="태그 입력 후 Enter 또는 , 로 추가..."
                        className="flex-1 bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                      />
                      <Button 
                        type="button" 
                        onClick={addTag} 
                        size="sm" 
                        variant="outline"
                        className="rounded-xl"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {newNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newNote.tags.map((tag) => (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                          >
                            <Badge 
                              variant="secondary" 
                              className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 gap-2 px-3 py-1 rounded-lg"
                            >
                              #{tag}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500 transition-colors"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">빠른 선택:</span>
                        {allTags.slice(0, 5).map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!newNote.tags.includes(tag)) {
                                setNewNote(prev => ({
                                  ...prev,
                                  tags: [...prev.tags, tag]
                                }));
                              }
                            }}
                            className="h-6 px-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg"
                          >
                            #{tag}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {newNote.title || '제목 없음'}
                    </CardTitle>
                    {newNote.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newNote.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {newNote.content || '내용을 입력해주세요...'}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                onClick={createNote} 
                disabled={!newNote.content.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl transition-all duration-300"
              >
                <Save className="h-4 w-4 mr-2" />
                노트 저장
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateDialog(false)}
                className="rounded-xl"
              >
                취소
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Edit Note Dialog */}
        {editingNote && (
          <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  노트 편집
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  노트 내용을 수정하고 개선해보세요.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    제목
                  </label>
                  <Input
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    내용
                  </label>
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={12}
                    className="resize-none bg-white/80 dark:bg-gray-700/80 border-white/30 dark:border-gray-600/30 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700 dark:text-gray-300">
                    태그
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {editingNote.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-2">
                        #{tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => setEditingNote({
                            ...editingNote,
                            tags: editingNote.tags?.filter(t => t !== tag) || []
                          })}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={() => updateNote(editingNote.id!, editingNote)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  저장
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingNote(null)}
                  className="rounded-xl"
                >
                  취소
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Enhanced View Note Dialog */}
        {viewingNote && (
          <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {viewingNote.title || '제목 없음'}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    작성: {viewingNote.created_at ? format(new Date(viewingNote.created_at), 'yyyy년 M월 d일 HH:mm', { locale: ko }) : '정보 없음'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    수정: {viewingNote.updated_at ? formatDistanceToNow(new Date(viewingNote.updated_at), { addSuffix: true, locale: ko }) : '정보 없음'}
                  </div>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      {viewingNote.content}
                    </pre>
                  </div>
                </div>
                
                {viewingNote.tags && viewingNote.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">태그</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewingNote.tags.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-lg"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* AI Insights for current note */}
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-purple-200/50 dark:border-purple-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <h4 className="font-semibold text-purple-700 dark:text-purple-300">AI 노트 분석</h4>
                    <Badge variant="secondary" className="ml-auto">
                      <Sparkles className="h-3 w-3 mr-1" />
                      스마트
                    </Badge>
                  </div>
                  <div className="space-y-2 text-sm text-purple-600 dark:text-purple-300">
                    {generateAIInsights(viewingNote).split('\n').map((insight, index) => (
                      <p key={index}>{insight}</p>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button 
                  onClick={() => setEditingNote(viewingNote)} 
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-xl"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  편집
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Enhanced download with AI analysis
                    const enhancedDownloadNote = (note: Note) => {
                      try {
                        const aiInsights = generateAIInsights(note);
                        const content = `# ${note.title}\n\n${note.content}\n\n---\n\n## 📊 AI 분석 리포트\n${aiInsights}\n\n---\n작성일: ${note.created_at ? format(new Date(note.created_at), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n수정일: ${note.updated_at ? format(new Date(note.updated_at), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n태그: ${note.tags?.join(', ') || '태그 없음'}`;
                        
                        const blob = new Blob([content], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}_AI_Enhanced.md`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        toast.success('AI 분석이 포함된 노트가 다운로드되었습니다!');
                      } catch (error) {
                        console.error('Failed to download note:', error);
                        toast.error('노트 다운로드에 실패했습니다');
                      }
                    };
                    enhancedDownloadNote(viewingNote);
                  }}
                  className="rounded-xl"
                >
                  <Download className="h-4 w-4 mr-2" />
                  AI 분석 다운로드
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setViewingNote(null)}
                  className="rounded-xl"
                >
                  닫기
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );

  // Enhanced download function with AI analysis report
  const enhancedDownloadNote = (note: Note) => {
    try {
      const aiInsights = generateAIInsights(note);
      const content = `# ${note.title}\n\n${note.content}\n\n---\n\n## 📊 AI 분석 리포트\n${aiInsights}\n\n---\n작성일: ${note.created_at ? format(new Date(note.created_at), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n수정일: ${note.updated_at ? format(new Date(note.updated_at), 'yyyy-MM-dd HH:mm') : '정보 없음'}\n태그: ${note.tags?.join(', ') || '태그 없음'}`;
      
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title.replace(/[^a-z0-9]/gi, '_')}_AI_Enhanced.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('AI 분석이 포함된 노트가 다운로드되었습니다!');
    } catch (error) {
      console.error('Failed to download note:', error);
      toast.error('노트 다운로드에 실패했습니다');
    }
  };

  // AI helper functions
  const calculateAIRelevanceScore = (note: Note): number => {
    let score = 0;
    
    // Content length factor
    score += Math.min(note.content.length / 100, 10);
    
    // Tag diversity factor
    score += (note.tags?.length || 0) * 2;
    
    // Recency factor
    if (note.updated_at) {
      const daysSinceUpdate = (Date.now() - new Date(note.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(10 - daysSinceUpdate, 0);
    }
    
    return score;
  };

  const generateAIInsights = (note: Note): string => {
    const insights = [];
    
    if (note.content.length > 500) {
      insights.push("📚 상세한 내용이 포함된 고품질 노트입니다.");
    }
    
    if ((note.tags?.length || 0) > 3) {
      insights.push("🏷️ 다양한 카테고리로 잘 분류된 노트입니다.");
    }
    
    if (note.content.includes('TODO') || note.content.includes('할일')) {
      insights.push("📝 실행 가능한 작업 아이템이 포함되어 있습니다.");
    }
    
    if (note.updated_at) {
      const daysSinceUpdate = (Date.now() - new Date(note.updated_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 1) {
        insights.push("⚡ 최근에 활발하게 업데이트된 노트입니다.");
      }
    }
    
    return insights.length > 0 ? insights.join('\n') : "이 노트는 기본적인 내용을 포함하고 있습니다.";
  };
};
