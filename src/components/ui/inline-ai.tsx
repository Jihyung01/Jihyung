import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from './button-advanced'

/* ===============================================
   Inline AI System - Seamless AI Integration
   =============================================== */

interface InlineAIProps {
  onSuggestion?: (suggestion: string) => void
  onComplete?: (completion: string) => void
  context?: string
  placeholder?: string
  className?: string
}

export const InlineAI = React.forwardRef<HTMLDivElement, InlineAIProps>(({
  onSuggestion,
  onComplete,
  context = '',
  placeholder = 'Ask AI for help...',
  className,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleAIRequest = async (prompt: string) => {
    setIsThinking(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockSuggestions = [
      `Optimize "${prompt}" for better performance`,
      `Add error handling to "${prompt}"`,
      `Refactor "${prompt}" using modern patterns`,
      `Generate tests for "${prompt}"`
    ]
    
    setSuggestions(mockSuggestions)
    setIsThinking(false)
  }

  const handleSuggestionSelect = (suggestion: string) => {
    onSuggestion?.(suggestion)
    setIsVisible(false)
    setInput('')
    setSuggestions([])
  }

  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isVisible])

  return (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {/* AI Trigger Button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          'flex items-center gap-2 px-3 py-2',
          'bg-primary/10 hover:bg-primary/20',
          'border border-primary/20 hover:border-primary/30',
          'rounded-lg text-primary text-sm font-medium',
          'transition-all duration-200 ease-out',
          'group'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span>AI Assistant</span>
        <motion.div
          animate={{ rotate: isVisible ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </motion.button>

      {/* AI Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={cn(
              'absolute top-full left-0 mt-2 z-[9998]',
              'w-80 bg-card border border-border',
              'rounded-xl shadow-xl',
              'glass-card backdrop-blur-md'
            )}
          >
            <div className="p-4 space-y-3">
              {/* Input */}
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && input.trim()) {
                      handleAIRequest(input.trim())
                    }
                  }}
                  placeholder={placeholder}
                  className={cn(
                    'w-full px-3 py-2 text-sm',
                    'bg-background border border-border',
                    'rounded-lg focus:ring-2 focus:ring-primary/20',
                    'focus:border-primary transition-colors',
                    'placeholder:text-foreground-muted'
                  )}
                />
                <Button
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 h-6"
                  onClick={() => input.trim() && handleAIRequest(input.trim())}
                  disabled={!input.trim() || isThinking}
                >
                  {isThinking ? '...' : '→'}
                </Button>
              </div>

              {/* Context Display */}
              {context && (
                <div className="px-3 py-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-foreground-muted">Context:</p>
                  <p className="text-sm text-foreground truncate">{context}</p>
                </div>
              )}

              {/* AI Thinking State */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg"
                >
                  <div className="w-4 h-4 relative">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-primary/30"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                      className="absolute inset-1 rounded-full border-t-2 border-primary"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <span className="text-sm text-primary font-medium">
                    AI is thinking...
                  </span>
                </motion.div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-foreground-muted font-medium">
                    AI Suggestions:
                  </p>
                  {suggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className={cn(
                        'w-full text-left p-3 text-sm',
                        'bg-background hover:bg-muted/50',
                        'border border-border hover:border-primary/30',
                        'rounded-lg transition-all duration-200',
                        'group'
                      )}
                    >
                      <span className="group-hover:text-primary transition-colors">
                        {suggestion}
                      </span>
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => handleAIRequest('optimize this code')}
                >
                  🚀 Optimize
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => handleAIRequest('explain this')}
                >
                  💡 Explain
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs"
                  onClick={() => handleAIRequest('find bugs')}
                >
                  🐛 Debug
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

InlineAI.displayName = 'InlineAI'

/* ===============================================
   AI Smart Suggestions
   =============================================== */

interface AISmartSuggestionsProps {
  trigger: string
  suggestions: string[]
  onSelect: (suggestion: string) => void
  className?: string
}

export const AISmartSuggestions = React.forwardRef<HTMLDivElement, AISmartSuggestionsProps>(({
  trigger,
  suggestions,
  onSelect,
  className,
  ...props
}, ref) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (trigger.length > 2) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [trigger])

  return (
    <AnimatePresence>
      {isVisible && suggestions.length > 0 && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'absolute z-[9998] w-full mt-1',
            'bg-card border border-border',
            'rounded-lg shadow-lg',
            'glass-card backdrop-blur-md',
            className
          )}
          {...props}
        >
          <div className="p-2 space-y-1">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onSelect(suggestion)
                  setIsVisible(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm',
                  'hover:bg-muted rounded-md',
                  'transition-colors duration-150',
                  'flex items-center gap-2'
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span>{suggestion}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

AISmartSuggestions.displayName = 'AISmartSuggestions'

/* ===============================================
   AI Floating Assistant
   =============================================== */

interface AIFloatingAssistantProps {
  onCommand?: (command: string) => void
  className?: string
}

export const AIFloatingAssistant = React.forwardRef<HTMLDivElement, AIFloatingAssistantProps>(({
  onCommand,
  className,
  ...props
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'ai'
    content: string
    timestamp: Date
  }>>([])

  const handleSendMessage = (message: string) => {
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        role: 'ai' as const,
        content: `I understand you want to "${message}". Let me help you with that.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)

    onCommand?.(message)
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        'fixed bottom-6 right-6 z-[9999]',
        className
      )}
      {...props}
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'mb-4 w-80 h-96',
              'bg-card border border-border',
              'rounded-xl shadow-xl',
              'glass-card backdrop-blur-md',
              'flex flex-col'
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-foreground-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center text-foreground-muted">
                  <p className="text-sm">How can I help you today?</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] p-2 rounded-lg text-sm',
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {message.content}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className={cn(
                    'flex-1 px-3 py-2 text-sm',
                    'bg-background border border-border',
                    'rounded-lg focus:ring-2 focus:ring-primary/20',
                    'focus:border-primary'
                  )}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget
                      if (input.value.trim()) {
                        handleSendMessage(input.value.trim())
                        input.value = ''
                      }
                    }
                  }}
                />
                <Button size="sm" variant="primary">
                  Send
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-14 h-14 rounded-full',
          'bg-primary text-white',
          'shadow-lg hover:shadow-xl',
          'flex items-center justify-center',
          'transition-all duration-200'
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 1.05 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? '✕' : '🤖'}
        </motion.div>
      </motion.button>
    </motion.div>
  )
})

AIFloatingAssistant.displayName = 'AIFloatingAssistant'
