// src/components/CollaborativeEditor.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCollaboration, CollaborationUser, CollaborationComment } from '../hooks/useCollaboration';
import { Button } from './ui/Button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  MessageCircle, 
  Users, 
  Wifi, 
  WifiOff, 
  Send, 
  Check, 
  Clock,
  User
} from 'lucide-react';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  placeholder?: string;
  className?: string;
  serverUrl?: string;
  onContentChange?: (content: string) => void;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({
  documentId,
  initialContent = '',
  placeholder = '여기에 텍스트를 입력하세요...',
  className = '',
  serverUrl,
  onContentChange
}) => {
  const [content, setContent] = useState(initialContent);
  const [commentInput, setCommentInput] = useState('');
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lastCursorPosition = useRef({ start: 0, end: 0 });

  const {
    state,
    connect,
    disconnect,
    updateDocument,
    updateCursor,
    updateSelection,
    setTyping,
    addComment,
    resolveComment
  } = useCollaboration({
    documentId,
    serverUrl,
    autoConnect: true,
    onDocumentUpdate: (newContent) => {
      if (newContent.text !== undefined) {
        setContent(newContent.text);
        onContentChange?.(newContent.text);
      }
    },
    onUserJoined: (user) => {
      console.log(`${user.name} joined the document`);
    },
    onUserLeft: (userId) => {
      console.log(`User ${userId} left the document`);
    },
    onCommentAdded: (comment) => {
      console.log('New comment added:', comment);
    }
  });

  // Handle text content changes
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    updateDocument({ text: newContent });
    onContentChange?.(newContent);
    setTyping(true);
  }, [updateDocument, setTyping, onContentChange]);

  // Handle cursor position changes
  const handleCursorChange = useCallback(() => {
    if (!editorRef.current) return;
    
    const { selectionStart, selectionEnd } = editorRef.current;
    const position = { start: selectionStart, end: selectionEnd };
    
    // Only update if position actually changed
    if (position.start !== lastCursorPosition.current.start || 
        position.end !== lastCursorPosition.current.end) {
      lastCursorPosition.current = position;
      updateCursor(position);
      
      // Handle text selection
      if (selectionStart !== selectionEnd) {
        const selectedText = content.substring(selectionStart, selectionEnd);
        const selection = { start: selectionStart, end: selectionEnd, text: selectedText };
        setSelectedText(selection);
        updateSelection(selection);
      } else {
        setSelectedText(null);
      }
    }
  }, [content, updateCursor, updateSelection]);

  // Handle comment creation
  const handleAddComment = useCallback(() => {
    if (!commentInput.trim() || !selectedText) return;
    
    addComment(commentInput, { start: selectedText.start, end: selectedText.end });
    setCommentInput('');
    setShowCommentInput(false);
    setSelectedText(null);
  }, [commentInput, selectedText, addComment]);

  // Get typing users (excluding current user)
  const getTypingUsers = useCallback(() => {
    return Array.from(state.users.values()).filter(
      user => user.isTyping && user.id !== state.userId
    );
  }, [state.users, state.userId]);

  // Get active users count
  const getActiveUsersCount = useCallback(() => {
    return state.users.size + (state.userId ? 1 : 0);
  }, [state.users.size, state.userId]);

  // Format comment position for display
  const getCommentPreview = useCallback((comment: CollaborationComment) => {
    const { start, end } = comment.position;
    const preview = content.substring(start, Math.min(end, start + 50));
    return preview + (end > start + 50 ? '...' : '');
  }, [content]);

  return (
    <div className={`collaborative-editor ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  📝 협업 에디터
                  <Badge variant={state.isConnected ? "default" : "destructive"} className="ml-2">
                    {state.isConnected ? (
                      <><Wifi className="w-3 h-3 mr-1" /> 연결됨</>
                    ) : (
                      <><WifiOff className="w-3 h-3 mr-1" /> 연결 안됨</>
                    )}
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {getActiveUsersCount()}명 접속
                  </Badge>
                  
                  {!state.isConnected && (
                    <Button size="sm" onClick={connect}>
                      다시 연결
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Typing Indicators */}
              {getTypingUsers().length > 0 && (
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTypingUsers().map(user => user.name).join(', ')}님이 입력 중...
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onSelect={handleCursorChange}
                  onClick={handleCursorChange}
                  onKeyUp={handleCursorChange}
                  placeholder={placeholder}
                  className="w-full h-96 p-4 border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
                />
                
                {/* Selection Comment Button */}
                {selectedText && (
                  <div className="absolute top-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCommentInput(true)}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      댓글 추가
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Comment Input */}
              {showCommentInput && selectedText && (
                <div className="mt-4 p-4 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground mb-2">
                    선택된 텍스트: "{selectedText.text.substring(0, 50)}{selectedText.text.length > 50 ? '...' : ''}"
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="댓글을 입력하세요..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                      autoFocus
                    />
                    <Button onClick={handleAddComment} disabled={!commentInput.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setShowCommentInput(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Active Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                접속자 ({getActiveUsersCount()})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {/* Current User */}
                  {state.userId && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          나
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">나</span>
                      <Badge variant="outline" className="text-xs">현재 사용자</Badge>
                    </div>
                  )}
                  
                  {/* Other Users */}
                  {Array.from(state.users.values()).map((user) => (
                    <TooltipProvider key={user.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 p-2 hover:bg-muted rounded transition-colors">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback 
                                className="text-xs text-white"
                                style={{ backgroundColor: user.color }}
                              >
                                {user.name.charAt(user.name.length - 1).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{user.name}</div>
                              {user.isTyping && (
                                <div className="text-xs text-green-600">⌨️ 입력 중...</div>
                              )}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {user.isTyping ? '입력 중' : '온라인'}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  
                  {state.users.size === 0 && !state.userId && (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      아직 접속자가 없습니다
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                댓글 ({state.comments.size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {Array.from(state.comments.values())
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((comment) => (
                      <div 
                        key={comment.id} 
                        className={`p-3 rounded border-l-2 ${
                          comment.resolved 
                            ? 'bg-muted/50 border-l-green-500 opacity-60' 
                            : 'bg-background border-l-blue-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <User className="w-3 h-3" />
                            User-{comment.userId.substring(0, 8)}
                          </div>
                          {!comment.resolved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveComment(comment.id)}
                              className="h-auto p-1"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="text-sm mb-2">{comment.content}</div>
                        
                        <div className="text-xs text-muted-foreground bg-muted p-1 rounded">
                          "{getCommentPreview(comment)}"
                        </div>
                        
                        {comment.resolved && (
                          <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            해결됨
                          </div>
                        )}
                      </div>
                    ))}
                  
                  {state.comments.size === 0 && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      아직 댓글이 없습니다<br />
                      텍스트를 선택하여 댓글을 추가해보세요
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
