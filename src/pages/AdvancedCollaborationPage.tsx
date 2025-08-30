import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Users, 
  MessageCircle, 
  Send, 
  FileText,
  Share2,
  Download,
  Settings,
  RefreshCw,
  Eye,
  Edit3,
  User,
  Clock,
  Wifi,
  WifiOff,
  Zap,
  Star,
  Plus,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import enhancedAPI from '@/lib/enhanced-api';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
  isTyping?: boolean;
  lastSeen?: Date;
  color: string;
}

interface Message {
  id: string;
  content: string;
  author: User;
  timestamp: Date;
  type: 'text' | 'system' | 'file';
  replyTo?: string;
}

interface Comment {
  id: string;
  content: string;
  author: User;
  timestamp: Date;
  position: { start: number; end: number };
  resolved: boolean;
  replies: Comment[];
}

interface CollaborationSession {
  id: string;
  documentId: string;
  users: User[];
  messages: Message[];
  comments: Comment[];
  content: string;
  lastSaved: Date;
  version: number;
}

export const AdvancedCollaborationPage: React.FC = () => {
  const [session, setSession] = useState<CollaborationSession | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [documentContent, setDocumentContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [documentId, setDocumentId] = useState('advanced-doc-1');
  const [serverUrl, setServerUrl] = useState('ws://localhost:8002/ws');
  const [showSettings, setShowSettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 사용자 색상 팔레트
  const userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#A55EEA', '#26DE81', '#FD79A8', '#FDCB6E', '#6C5CE7'
  ];

  useEffect(() => {
    // 현재 사용자 초기화
    const user: User = {
      id: crypto.randomUUID(),
      name: `사용자 ${Math.floor(Math.random() * 1000)}`,
      color: userColors[Math.floor(Math.random() * userColors.length)],
      lastSeen: new Date()
    };
    setCurrentUser(user);

    // 초기 문서 내용 설정
    setDocumentContent(`# 고급 실시간 협업 문서

이 문서는 실시간으로 여러 사용자가 함께 편집할 수 있습니다.

## 기능 소개

### ✨ 실시간 편집
- 여러 사용자가 동시에 텍스트 편집
- 실시간 커서 추적 및 선택 영역 표시
- 타이핑 상태 및 사용자 프레즌스 표시

### 💬 채팅 시스템
- 실시간 메시지 교환
- 파일 공유 및 이모지 반응
- 메시지 답글 및 쓰레드

### 📝 댓글 시스템
- 텍스트 선택 후 댓글 추가
- 댓글 쓰레드 및 해결 상태
- 버전별 댓글 추적

### 🔄 버전 관리
- 자동 저장 및 버전 히스토리
- 변경 사항 추적 및 되돌리기
- 충돌 해결 및 병합

### 🎨 고급 기능
- 실시간 알림 및 피드백
- 사용자별 권한 관리
- 문서 공유 및 내보내기

---

## 협업 가이드

1. **편집 시작**: 텍스트 영역을 클릭하여 편집을 시작하세요
2. **댓글 추가**: 텍스트를 선택하고 "댓글 추가" 버튼을 클릭하세요
3. **채팅 참여**: 우측 채팅창에서 팀원들과 소통하세요
4. **공유하기**: 상단의 "공유" 버튼으로 링크를 공유하세요

### 단축키
- \`Ctrl + S\`: 수동 저장
- \`Ctrl + Z\`: 되돌리기
- \`Ctrl + Y\`: 다시 실행
- \`Ctrl + /\`: 댓글 추가

즐거운 협업 되세요! 🚀`);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // WebSocket 연결
  const connectWebSocket = () => {
    try {
      wsRef.current = new WebSocket(`${serverUrl}/collaboration/${documentId}`);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        if (currentUser) {
          sendMessage({
            type: 'user_join',
            user: currentUser,
            documentId
          });
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setTimeout(connectWebSocket, 5000); // 재연결 시도
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'session_update':
        setSession(data.session);
        break;
      case 'content_change':
        setDocumentContent(data.content);
        break;
      case 'user_cursor':
        // 사용자 커서 위치 업데이트
        if (session) {
          const updatedUsers = session.users.map(user => 
            user.id === data.userId 
              ? { ...user, cursor: data.cursor, selection: data.selection }
              : user
          );
          setSession({ ...session, users: updatedUsers });
        }
        break;
      case 'new_message':
        if (session) {
          setSession({
            ...session,
            messages: [...session.messages, data.message]
          });
        }
        break;
      case 'new_comment':
        if (session) {
          setSession({
            ...session,
            comments: [...session.comments, data.comment]
          });
        }
        break;
    }
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const handleContentChange = (newContent: string) => {
    setDocumentContent(newContent);
    
    // 실시간으로 변경 사항 전송
    sendMessage({
      type: 'content_change',
      content: newContent,
      documentId,
      userId: currentUser?.id
    });

    // 자동 저장
    if (autoSave) {
      saveDocument();
    }
  };

  const handleTextSelection = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      
      if (start !== end) {
        const selectedText = documentContent.slice(start, end);
        setSelectedText({ start, end, text: selectedText });
        
        // 선택 영역을 다른 사용자에게 전송
        sendMessage({
          type: 'user_selection',
          userId: currentUser?.id,
          selection: { start, end },
          documentId
        });
      } else {
        setSelectedText(null);
      }
    }
  };

  const addComment = () => {
    if (!selectedText || !newComment.trim() || !currentUser) return;

    const comment: Comment = {
      id: crypto.randomUUID(),
      content: newComment,
      author: currentUser,
      timestamp: new Date(),
      position: { start: selectedText.start, end: selectedText.end },
      resolved: false,
      replies: []
    };

    sendMessage({
      type: 'new_comment',
      comment,
      documentId
    });

    setNewComment('');
    setShowCommentDialog(false);
    setSelectedText(null);
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    const message: Message = {
      id: crypto.randomUUID(),
      content: newMessage,
      author: currentUser,
      timestamp: new Date(),
      type: 'text'
    };

    sendMessage({
      type: 'new_message',
      message,
      documentId
    });

    setNewMessage('');
  };

  const saveDocument = async () => {
    try {
      // Enhanced API를 통해 문서 저장
      await enhancedAPI.createNote({
        title: `협업 문서 - ${documentId}`,
        content: documentContent,
        tags: ['협업', '실시간']
      });
    } catch (error) {
      console.error('Failed to save document:', error);
    }
  };

  const shareDocument = () => {
    const shareUrl = `${window.location.origin}/collaboration?doc=${documentId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('공유 링크가 클립보드에 복사되었습니다!');
    }).catch(() => {
      alert('클립보드 복사에 실패했습니다.');
    });
  };

  const downloadDocument = () => {
    const blob = new Blob([documentContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collaboration-${documentId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateNewDocumentId = () => {
    const newId = `advanced-doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setDocumentId(newId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 상단 헤더 */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">고급 실시간 협업</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
                  {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isConnected ? '연결됨' : '연결 끊김'}
                </Badge>
                {session && (
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    {session.users.length}명 접속 중
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={shareDocument}
                className="gap-2"
              >
                <Share2 className="w-4 h-4" />
                공유
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={downloadDocument}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                다운로드
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={saveDocument}
                className="gap-2"
              >
                <Star className="w-4 h-4" />
                저장
              </Button>
              
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    설정
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>협업 설정</DialogTitle>
                    <DialogDescription>
                      협업 세션의 설정을 변경할 수 있습니다
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">문서 ID</label>
                      <div className="flex gap-2">
                        <Input
                          value={documentId}
                          onChange={(e) => setDocumentId(e.target.value)}
                          placeholder="문서 ID"
                        />
                        <Button variant="outline" onClick={generateNewDocumentId}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">서버 URL</label>
                      <Input
                        value={serverUrl}
                        onChange={(e) => setServerUrl(e.target.value)}
                        placeholder="ws://localhost:8002/ws"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoSave"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="autoSave" className="text-sm">자동 저장 활성화</label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={connectWebSocket} disabled={isConnected}>
                        {isConnected ? '연결됨' : '연결하기'}
                      </Button>
                      <Button variant="outline" onClick={() => setShowSettings(false)}>
                        닫기
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 에디터 영역 */}
          <div className="lg:col-span-3 space-y-4">
            {/* 툴바 */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        마지막 저장: {format(new Date(), 'HH:mm:ss')}
                      </span>
                    </div>
                    {selectedText && (
                      <Button 
                        size="sm" 
                        onClick={() => setShowCommentDialog(true)}
                        className="gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        댓글 추가
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {documentContent.length.toLocaleString()} 글자 | {documentContent.split('\n').length} 줄
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 에디터 */}
            <Card>
              <CardContent className="p-0">
                <Textarea
                  ref={textareaRef}
                  value={documentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onSelect={handleTextSelection}
                  placeholder="여기에 내용을 작성하세요..."
                  className="min-h-[600px] border-0 resize-none focus:ring-0 focus:border-0 font-mono text-sm leading-relaxed"
                />
              </CardContent>
            </Card>

            {/* 사용자 프레즌스 */}
            {session && session.users.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    접속 중인 사용자 ({session.users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {session.users.map((user) => (
                      <div key={user.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: user.color }}
                        />
                        <span className="text-sm font-medium">{user.name}</span>
                        {user.isTyping && (
                          <Badge variant="outline" size="sm">
                            <Edit3 className="w-3 h-3 mr-1" />
                            입력 중
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-4">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  채팅
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <FileText className="w-4 h-4" />
                  댓글
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">팀 채팅</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
                      {session?.messages.map((message) => (
                        <div key={message.id} className="flex gap-2">
                          <div 
                            className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium text-white"
                            style={{ backgroundColor: message.author.color }}
                          >
                            {message.author.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{message.author.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(message.timestamp, 'HH:mm')}
                              </span>
                            </div>
                            <div className="text-sm break-words">{message.content}</div>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">아직 메시지가 없습니다</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지 입력..."
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                      />
                      <Button size="sm" onClick={sendChatMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="comments" className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">문서 댓글</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {session?.comments.map((comment) => (
                        <div key={comment.id} className={`p-3 border rounded-lg ${comment.resolved ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: comment.author.color }}
                              >
                                {comment.author.name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{comment.author.name}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() => {
                                // 댓글 해결 토글
                                const updatedComment = { ...comment, resolved: !comment.resolved };
                                sendMessage({
                                  type: 'update_comment',
                                  comment: updatedComment,
                                  documentId
                                });
                              }}
                            >
                              {comment.resolved ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                          <div className="text-sm mb-2">{comment.content}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(comment.timestamp, 'M월 d일 HH:mm', { locale: ko })}
                          </div>
                          {comment.resolved && (
                            <Badge variant="outline" size="sm" className="mt-2">
                              해결됨
                            </Badge>
                          )}
                        </div>
                      )) || (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">아직 댓글이 없습니다</p>
                          <p className="text-xs mt-1">텍스트를 선택하고 댓글을 추가해보세요</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* 댓글 추가 다이얼로그 */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 추가</DialogTitle>
            <DialogDescription>
              선택된 텍스트: "{selectedText?.text.slice(0, 50)}..."
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글 내용을 입력하세요..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button onClick={addComment} disabled={!newComment.trim()}>
                댓글 추가
              </Button>
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
