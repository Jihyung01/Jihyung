import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  MoreVertical,
  Smile,
  PaperclipIcon,
  X,
  Users,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Avatar, AvatarFallback } from '../ui/avatar'
import type { ChatMessage, User } from '../../hooks/useCollaborationSocket'

interface ChatPanelProps {
  messages: ChatMessage[]
  participants: User[]
  currentUser: User | null
  onSendMessage: (message: string) => void
  className?: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  participants,
  currentUser,
  onSendMessage,
  className = ''
}) => {
  const [inputMessage, setInputMessage] = useState('')
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 메시지가 추가될 때마다 스크롤 하단으로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 메시지 전송
  const handleSendMessage = () => {
    const trimmedMessage = inputMessage.trim()
    if (trimmedMessage && currentUser) {
      onSendMessage(trimmedMessage)
      setInputMessage('')
    }
  }

  // 엔터 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 이모지 추가
  const addEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji)
    setIsEmojiOpen(false)
    inputRef.current?.focus()
  }

  // 시간 포맷팅
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 날짜 포맷팅
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    })
  }

  // 메시지 그룹화 (같은 사용자의 연속 메시지)
  const groupedMessages = messages.reduce((groups, message, index) => {
    const prevMessage = messages[index - 1]
    const isSameUser = prevMessage && prevMessage.user_id === message.user_id
    const timeDiff = prevMessage ?
      new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() : 0
    const isWithinGroup = isSameUser && timeDiff < 300000 // 5분 이내

    if (isWithinGroup) {
      groups[groups.length - 1].messages.push(message)
    } else {
      groups.push({
        user: participants.find(p => p.id === message.user_id) || {
          id: message.user_id,
          name: message.user_name,
          email: '',
          socket_id: '',
          is_video_enabled: false,
          is_audio_enabled: false,
          joined_at: '',
          role: 'participant' as const
        },
        messages: [message]
      })
    }

    return groups
  }, [] as Array<{ user: User; messages: ChatMessage[] }>)

  // 일반 이모지 목록
  const emojis = ['😀', '😂', '😍', '🤔', '👍', '👏', '🎉', '❤️', '✨', '🔥']

  return (
    <Card className={`flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">채팅</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {participants.length}명 참여 중
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="rounded-full">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* 참가자 목록 (간단한 버전) */}
      <div className="px-4 py-2 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Users className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <div className="flex gap-1">
            {participants.slice(0, 8).map((participant) => (
              <div
                key={participant.id}
                className="relative"
                title={`${participant.name} (${participant.role === 'host' ? '호스트' : '참가자'})`}
              >
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                    {participant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {participant.role === 'host' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px]">👑</span>
                  </div>
                )}
                <div className={`absolute -bottom-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-gray-800 ${
                  participant.is_video_enabled ? 'bg-green-500' :
                  participant.is_audio_enabled ? 'bg-yellow-500' : 'bg-gray-500'
                }`} />
              </div>
            ))}
            {participants.length > 8 && (
              <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">
                  +{participants.length - 8}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {groupedMessages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                아직 메시지가 없습니다.
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">
                첫 번째 메시지를 보내보세요!
              </p>
            </div>
          ) : (
            groupedMessages.map((group, groupIndex) => {
              const isCurrentUser = group.user.id === currentUser?.id
              const firstMessage = group.messages[0]

              return (
                <motion.div
                  key={`${group.user.id}-${groupIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* 프로필 이미지 */}
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-sm">
                        {group.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex-1 min-w-0 ${isCurrentUser ? 'flex flex-col items-end' : ''}`}>
                    {/* 사용자 이름과 시간 */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {group.user.name}
                        </span>
                        {group.user.role === 'host' && (
                          <Badge variant="secondary" className="px-1 py-0 text-xs">
                            호스트
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTime(firstMessage.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* 메시지들 */}
                    <div className={`space-y-1 ${isCurrentUser ? 'items-end' : ''}`}>
                      {group.messages.map((message, messageIndex) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: messageIndex * 0.05 }}
                          className={`relative group ${isCurrentUser ? 'flex justify-end' : ''}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl ${
                              message.type === 'system'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-center text-sm'
                                : isCurrentUser
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.message}
                            </p>

                            {/* 메시지 시간 (현재 사용자) */}
                            {isCurrentUser && message.type !== 'system' && (
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-xs text-blue-200">
                                  {formatTime(message.timestamp)}
                                </span>
                                <CheckCircle2 className="h-3 w-3 text-blue-200" />
                              </div>
                            )}
                          </div>

                          {/* 호버 시 시간 표시 (다른 사용자) */}
                          {!isCurrentUser && message.type !== 'system' && (
                            <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {formatTime(message.timestamp)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* 현재 사용자의 프로필 이미지 */}
                  {isCurrentUser && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-green-400 to-blue-500 text-white text-sm">
                        {group.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </motion.div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50">
        {/* 이모지 패널 */}
        <AnimatePresence>
          {isEmojiOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  이모지
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEmojiOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {emojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => addEmoji(emoji)}
                    className="h-8 w-8 p-0 text-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 입력 폼 */}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="pr-20 resize-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              disabled={!currentUser}
            />

            {/* 입력 영역 내 버튼들 */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                disabled={!currentUser}
              >
                <Smile className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                disabled={!currentUser}
              >
                <PaperclipIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !currentUser}
            className="rounded-xl bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {!currentUser && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            방에 참여하면 채팅을 사용할 수 있습니다
          </p>
        )}
      </div>
    </Card>
  )
}