import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  AlertCircle,
  Sparkles,
  Brain,
  Globe,
  Shield,
  Video,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  ScreenShare,
  Phone,
  PhoneOff
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { toast } from 'sonner'
import { useRealTimeCollaboration } from '@/hooks/useRealTimeCollaboration'

interface CollaborationUser {
  id: string
  name: string
  email?: string
  avatar?: string
  cursor?: { x: number; y: number }
  selection?: { start: number; end: number }
  isTyping?: boolean
  lastSeen?: Date
  color: string
  status: 'online' | 'away' | 'busy' | 'offline'
  role: 'owner' | 'editor' | 'viewer'
}

interface CollaborationMessage {
  id: string
  content: string
  author: CollaborationUser
  timestamp: Date
  type: 'text' | 'system' | 'file' | 'announcement'
  replyTo?: string
  reactions?: { emoji: string; users: string[] }[]
  edited?: boolean
}

interface CollaborationComment {
  id: string
  content: string
  author: CollaborationUser
  timestamp: Date
  position: { start: number; end: number }
  resolved: boolean
  replies: CollaborationComment[]
  threadId: string
}

interface CollaborationDocument {
  id: string
  title: string
  content: string
  type: 'note' | 'task' | 'project'
  version: number
  lastSaved: Date
  collaborators: CollaborationUser[]
  permissions: {
    canEdit: boolean
    canComment: boolean
    canShare: boolean
    canDownload: boolean
  }
}

interface CollaborationSession {
  id: string
  document: CollaborationDocument
  users: CollaborationUser[]
  messages: CollaborationMessage[]
  comments: CollaborationComment[]
  isRecording: boolean
  meetingActive: boolean
  screenShareActive: boolean
}

export const CollaborationWorkspace: React.FC = () => {
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [currentUser, setCurrentUser] = useState<CollaborationUser>({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: 'You',
    color: '#3B82F6',
    status: 'online',
    role: 'owner'
  })
  const [documentContent, setDocumentContent] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [selectedText, setSelectedText] = useState<{ start: number; end: number; text: string } | null>(null)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('document')
  const [showSettings, setShowSettings] = useState(false)
  const [autoSave, setAutoSave] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [screenShareEnabled, setScreenShareEnabled] = useState(false)
  const [meetingActive, setMeetingActive] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const documentRef = useRef<HTMLDivElement>(null)

  // Initialize collaboration session
  useEffect(() => {
    initializeCollaboration()
    setIsConnected(true)
  }, [])

  const initializeCollaboration = useCallback(() => {
    const mockDocument: CollaborationDocument = {
      id: 'doc-' + Date.now(),
      title: '협업 문서',
      content: '# 협업 워크스페이스에 오신 것을 환영합니다!\n\n이곳에서 팀원들과 실시간으로 협업할 수 있습니다.\n\n## 주요 기능\n- 실시간 문서 편집\n- 음성/화상 통화\n- 인라인 댓글\n- 버전 관리\n- 화면 공유\n\n함께 더 나은 결과를 만들어 봅시다! 🚀',
      type: 'note',
      version: 1,
      lastSaved: new Date(),
      collaborators: [currentUser],
      permissions: {
        canEdit: true,
        canComment: true,
        canShare: true,
        canDownload: true
      }
    }

    const mockSession: CollaborationSession = {
      id: 'session-' + Date.now(),
      document: mockDocument,
      users: [currentUser],
      messages: [
        {
          id: 'msg-1',
          content: '협업 세션이 시작되었습니다! 🎉',
          author: { ...currentUser, name: 'System' },
          timestamp: new Date(),
          type: 'system'
        }
      ],
      comments: [],
      isRecording: false,
      meetingActive: false,
      screenShareActive: false
    }

    setSession(mockSession)
    setDocumentContent(mockDocument.content)
  }, [currentUser])

  const handleDocumentChange = useCallback((newContent: string) => {
    setDocumentContent(newContent)
    
    if (session && autoSave) {
      // Simulate auto-save
      setTimeout(() => {
        setSession(prev => prev ? {
          ...prev,
          document: {
            ...prev.document,
            content: newContent,
            lastSaved: new Date(),
            version: prev.document.version + 1
          }
        } : null)
        toast.success('자동 저장됨', { duration: 1000 })
      }, 1000)
    }
  }, [session, autoSave])

  const handleSendMessage = useCallback(() => {
    if (!newMessage.trim() || !session) return

    const message: CollaborationMessage = {
      id: 'msg-' + Date.now(),
      content: newMessage,
      author: currentUser,
      timestamp: new Date(),
      type: 'text'
    }

    setSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, message]
    } : null)

    setNewMessage('')
  }, [newMessage, session, currentUser])

  const handleAddComment = useCallback(() => {
    if (!newComment.trim() || !selectedText || !session) return

    const comment: CollaborationComment = {
      id: 'comment-' + Date.now(),
      content: newComment,
      author: currentUser,
      timestamp: new Date(),
      position: { start: selectedText.start, end: selectedText.end },
      resolved: false,
      replies: [],
      threadId: 'thread-' + Date.now()
    }

    setSession(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null)

    setNewComment('')
    setShowCommentDialog(false)
    setSelectedText(null)
    toast.success('댓글이 추가되었습니다')
  }, [newComment, selectedText, session, currentUser])

  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    
    if (start !== end) {
      const text = documentContent.substring(start, end)
      setSelectedText({ start, end, text })
    } else {
      setSelectedText(null)
    }
  }, [documentContent])

  const toggleMeeting = useCallback(() => {
    setMeetingActive(prev => !prev)
    if (!meetingActive) {
      toast.success('화상 미팅이 시작되었습니다')
    } else {
      toast.info('화상 미팅이 종료되었습니다')
      setVideoEnabled(false)
      setAudioEnabled(false)
      setScreenShareEnabled(false)
    }
  }, [meetingActive])

  const toggleScreenShare = useCallback(() => {
    setScreenShareEnabled(prev => !prev)
    toast.info(screenShareEnabled ? '화면 공유 중지' : '화면 공유 시작')
  }, [screenShareEnabled])

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setSession(prev => {
      if (!prev) return null
      
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || []
            const existingReaction = reactions.find(r => r.emoji === emoji)
            
            if (existingReaction) {
              if (existingReaction.users.includes(currentUser.id)) {
                existingReaction.users = existingReaction.users.filter(id => id !== currentUser.id)
              } else {
                existingReaction.users.push(currentUser.id)
              }
            } else {
              reactions.push({ emoji, users: [currentUser.id] })
            }
            
            return { ...msg, reactions: reactions.filter(r => r.users.length > 0) }
          }
          return msg
        })
      }
    })
  }, [currentUser])

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto"
          >
            <Users className="w-16 h-16 text-blue-500" />
          </motion.div>
          <h2 className="text-2xl font-bold">협업 세션 초기화 중...</h2>
          <p className="text-slate-600 dark:text-slate-400">곧 시작됩니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {session.document.title}
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {session.users.length}명이 협업 중 • 버전 {session.document.version}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    <Wifi className="w-3 h-3" />
                    연결됨
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <WifiOff className="w-3 h-3" />
                    연결 끊김
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Meeting Controls */}
              <div className="flex items-center gap-1 mr-4">
                <Button
                  variant={meetingActive ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMeeting}
                  className="gap-2"
                >
                  {meetingActive ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  {meetingActive ? '미팅 종료' : '미팅 시작'}
                </Button>
                
                {meetingActive && (
                  <>
                    <Button
                      variant={audioEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAudioEnabled(!audioEnabled)}
                    >
                      {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={videoEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setVideoEnabled(!videoEnabled)}
                    >
                      {videoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant={screenShareEnabled ? "default" : "outline"}
                      size="sm"
                      onClick={toggleScreenShare}
                    >
                      <ScreenShare className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>

              {/* User Avatars */}
              <div className="flex items-center -space-x-2">
                {session.users.slice(0, 5).map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Avatar className="w-8 h-8 border-2 border-white dark:border-slate-800">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback style={{ backgroundColor: user.color }}>
                        {user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
                {session.users.length > 5 && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium">
                    +{session.users.length - 5}
                  </div>
                )}
              </div>

              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>협업 설정</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-save">자동 저장</Label>
                      <Switch
                        id="auto-save"
                        checked={autoSave}
                        onCheckedChange={setAutoSave}
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Document Editor */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-6 py-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
              <TabsList className="bg-white/70 dark:bg-slate-700/70">
                <TabsTrigger value="document" className="gap-2">
                  <FileText className="w-4 h-4" />
                  문서
                </TabsTrigger>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  댓글 ({session.comments.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <Clock className="w-4 h-4" />
                  히스토리
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="document" className="flex-1 p-6">
              <Card className="h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-6 h-full">
                  <div className="relative h-full">
                    <Textarea
                      ref={textareaRef}
                      value={documentContent}
                      onChange={(e) => handleDocumentChange(e.target.value)}
                      onSelect={handleTextSelection}
                      className="h-full resize-none border-0 bg-transparent text-base leading-relaxed focus:ring-0 font-mono"
                      placeholder="여기에 내용을 입력하세요..."
                    />
                    
                    {selectedText && (
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute bottom-4 right-4"
                      >
                        <Button
                          onClick={() => setShowCommentDialog(true)}
                          size="sm"
                          className="gap-2 bg-blue-500 hover:bg-blue-600"
                        >
                          <MessageCircle className="w-4 h-4" />
                          댓글 추가
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="flex-1 p-6">
              <Card className="h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>댓글</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <ScrollArea className="h-full">
                    {session.comments.length === 0 ? (
                      <div className="text-center py-12 text-slate-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>아직 댓글이 없습니다</p>
                        <p className="text-sm">텍스트를 선택하고 댓글을 추가해보세요</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {session.comments.map((comment) => (
                          <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback style={{ backgroundColor: comment.author.color }}>
                                  {comment.author.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{comment.author.name}</span>
                                  <span className="text-xs text-slate-500">
                                    {comment.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm mb-2">{comment.content}</p>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className={comment.resolved ? "text-green-600" : ""}
                                  >
                                    <Check className="w-3 h-3 mr-1" />
                                    {comment.resolved ? '해결됨' : '해결하기'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="flex-1 p-6">
              <Card className="h-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-0 shadow-xl">
                <CardHeader>
                  <CardTitle>문서 히스토리</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">버전 {session.document.version}</p>
                        <p className="text-xs text-slate-500">
                          {session.document.lastSaved.toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary">현재</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Chat */}
        <div className="w-80 border-l border-white/20 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex flex-col">
          <div className="p-4 border-b border-white/20">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              팀 채팅
            </h3>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {session.messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group ${message.type === 'system' ? 'text-center' : 'flex gap-3'}`}
                >
                  {message.type === 'system' ? (
                    <div className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700/50 rounded-full px-3 py-1 inline-block">
                      {message.content}
                    </div>
                  ) : (
                    <>
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback style={{ backgroundColor: message.author.color }}>
                          {message.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.author.name}</span>
                          <span className="text-xs text-slate-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 break-words">
                          {message.content}
                        </p>
                        
                        {/* Reactions */}
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {message.reactions.map((reaction, index) => (
                              <button
                                key={index}
                                onClick={() => addReaction(message.id, reaction.emoji)}
                                className="text-xs bg-slate-100 dark:bg-slate-700 rounded-full px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                              >
                                {reaction.emoji} {reaction.users.length}
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Quick Reactions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1 mt-1">
                            {['👍', '❤️', '😊', '🎉'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(message.id, emoji)}
                                className="text-xs hover:bg-slate-100 dark:hover:bg-slate-700 rounded px-1 py-0.5 transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-white/20">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="메시지 입력..."
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedText && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">선택된 텍스트:</p>
                <p className="text-sm font-mono">&quot;{selectedText.text}&quot;</p>
              </div>
            )}
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                취소
              </Button>
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                댓글 추가
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CollaborationWorkspace
