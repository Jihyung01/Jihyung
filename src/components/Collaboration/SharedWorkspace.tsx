import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  FileText, 
  Edit3, 
  Save, 
  Share2, 
  Eye, 
  EyeOff,
  User,
  MousePointer2,
  MessageSquare,
  Settings,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
  Activity,
  Brain
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: string;
  cursor?: {
    x: number;
    y: number;
    selection?: {
      start: number;
      end: number;
    };
  };
  permissions: 'read' | 'write' | 'admin';
}

interface DocumentChange {
  id: string;
  type: 'insert' | 'delete' | 'format';
  position: number;
  content?: string;
  length?: number;
  timestamp: string;
  authorId: string;
  authorName: string;
}

interface SharedDocument {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'task' | 'document';
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
  changes: DocumentChange[];
  version: number;
  isLocked: boolean;
  lockedBy?: string;
}

interface SharedWorkspaceProps {
  documentId?: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  onDocumentChange?: (document: SharedDocument) => void;
}

export const SharedWorkspace: React.FC<SharedWorkspaceProps> = ({ 
  documentId, 
  currentUser, 
  onDocumentChange 
}) => {
  const [document, setDocument] = useState<SharedDocument | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showChanges, setShowChanges] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [activeCollaborators, setActiveCollaborators] = useState<Collaborator[]>([]);
  const [cursorPositions, setCursorPositions] = useState<{ [userId: string]: { x: number; y: number } }>({});
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock collaborator colors
  const collaboratorColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  // Mock document for development
  const mockDocument: SharedDocument = {
    id: documentId || 'shared-doc-1',
    title: '공유 문서 - 프로젝트 기획',
    content: `# 프로젝트 기획안

## 1. 개요
이 프로젝트는 AI 기반 생산성 향상 플랫폼을 개발하는 것입니다.

## 2. 주요 기능
- 노트 관리 시스템
- 작업 추적 및 관리
- 캘린더 통합
- AI 어시스턴트
- 실시간 협업

## 3. 기술 스택
- Frontend: React, TypeScript, Tailwind CSS
- Backend: FastAPI, Python
- Database: PostgreSQL
- AI: OpenAI API

## 4. 일정
- 1주차: 기본 구조 설계
- 2주차: 핵심 기능 개발
- 3주차: AI 통합
- 4주차: 테스트 및 배포

---
*이 문서는 실시간으로 편집 가능합니다.*`,
    type: 'document',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    collaborators: [
      {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        color: collaboratorColors[0],
        isActive: true,
        lastSeen: new Date().toISOString(),
        permissions: 'admin'
      },
      {
        id: 'user-2',
        name: '김협업',
        email: 'collab@example.com',
        color: collaboratorColors[1],
        isActive: true,
        lastSeen: new Date().toISOString(),
        permissions: 'write'
      },
      {
        id: 'user-3',
        name: '박팀원',
        email: 'team@example.com',
        color: collaboratorColors[2],
        isActive: false,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        permissions: 'write'
      }
    ],
    changes: [],
    version: 1,
    isLocked: false
  };

  // Initialize document and WebSocket connection
  useEffect(() => {
    setDocument(mockDocument);
    setActiveCollaborators(mockDocument.collaborators.filter(c => c.isActive));
    
    // Simulate connection
    setTimeout(() => {
      setConnectionStatus('connected');
      toast.success('공유 워크스페이스에 연결되었습니다');
    }, 1000);

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      if (cursorTimeoutRef.current) {
        clearTimeout(cursorTimeoutRef.current);
      }
    };
  }, [documentId]);

  // Handle content changes
  const handleContentChange = useCallback((newContent: string) => {
    if (!document) return;

    setDocument(prev => prev ? { ...prev, content: newContent, version: prev.version + 1 } : null);
    setUnsavedChanges(true);

    // Debounce save
    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }
    
    changeTimeoutRef.current = setTimeout(() => {
      handleSaveDocument();
    }, 2000);
  }, [document]);

  // Handle cursor position changes
  const handleCursorMove = useCallback((event: React.MouseEvent) => {
    const rect = editorRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      // Simulate sending cursor position to other users
      setCursorPositions(prev => ({
        ...prev,
        [currentUser.id]: { x, y }
      }));
    }
  }, [currentUser.id]);

  // Save document
  const handleSaveDocument = useCallback(async () => {
    if (!document || !unsavedChanges) return;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUnsavedChanges(false);
      setDocument(prev => prev ? { ...prev, updatedAt: new Date().toISOString() } : null);
      onDocumentChange?.(document);
      
      toast.success('문서가 저장되었습니다');
    } catch (error) {
      console.error('Failed to save document:', error);
      toast.error('문서 저장에 실패했습니다');
    }
  }, [document, unsavedChanges, onDocumentChange]);

  // Add collaborator
  const handleAddCollaborator = useCallback(async (email: string, permission: 'read' | 'write') => {
    try {
      // Simulate API call
      const newCollaborator: Collaborator = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email,
        color: collaboratorColors[Math.floor(Math.random() * collaboratorColors.length)],
        isActive: false,
        lastSeen: new Date().toISOString(),
        permissions: permission
      };

      setDocument(prev => prev ? {
        ...prev,
        collaborators: [...prev.collaborators, newCollaborator]
      } : null);

      toast.success(`${email}을 협업자로 추가했습니다`);
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      toast.error('협업자 추가에 실패했습니다');
    }
  }, []);

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto">
          <CardContent className="text-center">
            <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin text-blue-500" />
            <h3 className="text-lg font-semibold mb-2">문서 로딩 중...</h3>
            <p className="text-gray-600 dark:text-gray-400">공유 워크스페이스를 준비하고 있습니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/30 shadow-xl"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl text-white shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Users className="h-6 w-6" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {document.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      연결됨
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      연결 중...
                    </>
                  )}
                </Badge>
                {unsavedChanges && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    저장되지 않음
                  </Badge>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  v{document.version} • {activeCollaborators.length}명 활성
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCollaborators(!showCollaborators)}
            >
              <Users className="h-4 w-4 mr-1" />
              협업자 ({document.collaborators.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChanges(!showChanges)}
            >
              <Activity className="h-4 w-4 mr-1" />
              변경 기록
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={!unsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-1" />
              저장
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    문서 편집기
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {/* Active collaborator cursors */}
                    {activeCollaborators.slice(0, 3).map((collaborator, index) => (
                      <motion.div
                        key={collaborator.id}
                        className="flex items-center gap-1 text-xs"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: collaborator.color }}
                        />
                        <span className="text-gray-600 dark:text-gray-300">
                          {collaborator.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-full">
                <div className="relative h-full">
                  <Textarea
                    ref={editorRef}
                    value={document.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    onMouseMove={handleCursorMove}
                    className="w-full h-full border-0 resize-none focus:ring-0 text-sm leading-relaxed p-6"
                    placeholder="여기에 내용을 입력하세요..."
                    style={{ fontFamily: 'ui-monospace, monospace' }}
                  />
                  
                  {/* Collaborative cursors */}
                  {Object.entries(cursorPositions).map(([userId, position]) => 
                    userId !== currentUser.id && (
                      <motion.div
                        key={userId}
                        className="absolute pointer-events-none z-10"
                        style={{ 
                          left: position.x, 
                          top: position.y,
                          transform: 'translate(-50%, -100%)'
                        }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <div className="flex items-center gap-1">
                          <MousePointer2 className="h-4 w-4 text-blue-500" />
                          <span className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded">
                            {activeCollaborators.find(c => c.id === userId)?.name}
                          </span>
                        </div>
                      </motion.div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Collaborators Panel */}
            {showCollaborators && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    협업자
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {document.collaborators.map((collaborator) => (
                    <motion.div
                      key={collaborator.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${collaborator.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ backgroundColor: collaborator.isActive ? undefined : collaborator.color }}
                        />
                        <div>
                          <p className="text-sm font-medium">{collaborator.name}</p>
                          <p className="text-xs text-gray-500">{collaborator.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {collaborator.permissions}
                      </Badge>
                    </motion.div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">새 협업자 추가</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="이메일 주소"
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddCollaborator('new@example.com', 'write')}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Changes Panel */}
            {showChanges && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    변경 기록
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {document.changes.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        아직 변경 사항이 없습니다.
                      </p>
                    ) : (
                      document.changes.map((change) => (
                        <div
                          key={change.id}
                          className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{change.authorName}</span>
                            <span className="text-gray-500">
                              {new Date(change.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400">
                            {change.type} at position {change.position}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  빠른 작업
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  PDF로 내보내기
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  링크 공유
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Brain className="h-4 w-4 mr-2" />
                  AI 요약 생성
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SharedWorkspace;