import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MagnifyingGlass,
  Command,
  ArrowUp,
  ArrowDown,
  CaretRight,
  X,
  Clock,
  Star,
  Hash,
  Calendar,
  Note,
  CheckSquare,
  Robot,
  Sparkle,
  Lightning,
  Plus
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

// Command interfaces
interface Command {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords: string[]
  shortcut?: string
  isRecent?: boolean
  isFavorite?: boolean
}

interface CommandGroup {
  category: string
  commands: Command[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  commands?: Command[]
  placeholder?: string
  className?: string
}

// Default commands - inspired by Linear/Raycast
const defaultCommands: Command[] = [
  // Quick Actions
  {
    id: 'quick-capture',
    title: 'Quick Capture',
    description: 'Capture a quick note or idea',
    icon: <Plus className="w-4 h-4" />,
    action: () => console.log('Quick capture'),
    category: 'Actions',
    keywords: ['capture', 'note', 'quick', 'add'],
    shortcut: '⌘+N',
    isRecent: true
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    description: 'Chat with your AI assistant',
    icon: <Robot className="w-4 h-4" />,
    action: () => console.log('AI assistant'),
    category: 'AI',
    keywords: ['ai', 'assistant', 'chat', 'help'],
    shortcut: '⌘+J',
    isRecent: true
  },
  {
    id: 'search-notes',
    title: 'Search Notes',
    description: 'Find notes across your knowledge base',
    icon: <MagnifyingGlass className="w-4 h-4" />,
    action: () => console.log('Search notes'),
    category: 'Search',
    keywords: ['search', 'find', 'notes'],
    shortcut: '⌘+F'
  },
  
  // Navigation
  {
    id: 'goto-calendar',
    title: 'Go to Calendar',
    description: 'View your calendar and events',
    icon: <Calendar className="w-4 h-4" />,
    action: () => console.log('Go to calendar'),
    category: 'Navigation',
    keywords: ['calendar', 'events', 'schedule', 'goto'],
    shortcut: '⌘+2'
  },
  {
    id: 'goto-notes',
    title: 'Go to Notes',
    description: 'View your notes collection',
    icon: <Note className="w-4 h-4" />,
    action: () => console.log('Go to notes'),
    category: 'Navigation',
    keywords: ['notes', 'documents', 'writing', 'goto'],
    shortcut: '⌘+1'
  },
  {
    id: 'goto-tasks',
    title: 'Go to Tasks',
    description: 'View your task list',
    icon: <CheckSquare className="w-4 h-4" />,
    action: () => console.log('Go to tasks'),
    category: 'Navigation',
    keywords: ['tasks', 'todo', 'checklist', 'goto'],
    shortcut: '⌘+3'
  },

  // AI Features
  {
    id: 'knowledge-graph',
    title: 'Knowledge Graph',
    description: 'Visualize connections in your knowledge',
    icon: <Lightning className="w-4 h-4" />,
    action: () => console.log('Knowledge graph'),
    category: 'AI',
    keywords: ['graph', 'connections', 'knowledge', 'visual'],
    shortcut: '⌘+G'
  },
  {
    id: 'auto-schedule',
    title: 'Auto Schedule',
    description: 'Let AI organize your calendar',
    icon: <Sparkle className="w-4 h-4" />,
    action: () => console.log('Auto schedule'),
    category: 'AI',
    keywords: ['schedule', 'auto', 'organize', 'calendar', 'ai'],
    shortcut: '⌘+S'
  },

  // Settings
  {
    id: 'toggle-theme',
    title: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    icon: <Star className="w-4 h-4" />,
    action: () => console.log('Toggle theme'),
    category: 'Settings',
    keywords: ['theme', 'dark', 'light', 'appearance'],
    shortcut: '⌘+⇧+T'
  }
]

// Fuzzy search function
function fuzzySearch(query: string, commands: Command[]): Command[] {
  if (!query.trim()) return commands

  const queryLower = query.toLowerCase()
  
  return commands
    .map(command => {
      const titleMatch = command.title.toLowerCase().includes(queryLower)
      const descMatch = command.description?.toLowerCase().includes(queryLower)
      const keywordMatch = command.keywords.some(k => k.toLowerCase().includes(queryLower))
      
      let score = 0
      if (titleMatch) score += 10
      if (descMatch) score += 5
      if (keywordMatch) score += 3
      if (command.isRecent) score += 2
      if (command.isFavorite) score += 1
      
      return { command, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ command }) => command)
}

// Group commands by category
function groupCommands(commands: Command[]): CommandGroup[] {
  const groups = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, Command[]>)

  return Object.entries(groups).map(([category, commands]) => ({
    category,
    commands
  }))
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands = defaultCommands,
  placeholder = "Search commands...",
  className
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  // Filter and group commands
  const filteredCommands = useMemo(() => {
    const allCommands = commands.map(cmd => ({
      ...cmd,
      isRecent: recentCommands.includes(cmd.id)
    }))
    
    return fuzzySearch(query, allCommands)
  }, [query, commands, recentCommands])

  const commandGroups = useMemo(() => {
    return groupCommands(filteredCommands)
  }, [filteredCommands])

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          Math.min(prev + 1, filteredCommands.length - 1)
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      
      case 'Enter':
        e.preventDefault()
        const selectedCommand = filteredCommands[selectedIndex]
        if (selectedCommand) {
          selectedCommand.action()
          setRecentCommands(prev => [
            selectedCommand.id,
            ...prev.filter(id => id !== selectedCommand.id).slice(0, 4)
          ])
          onClose()
        }
        break
    }
  }, [isOpen, onClose, filteredCommands, selectedIndex])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle command execution
  const executeCommand = (command: Command) => {
    command.action()
    setRecentCommands(prev => [
      command.id,
      ...prev.filter(id => id !== command.id).slice(0, 4)
    ])
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
            className={cn(
              "fixed top-1/4 left-1/2 -translate-x-1/2 z-50",
              "w-full max-w-lg mx-4",
              "bg-card/95 backdrop-blur-xl",
              "border border-border/50 rounded-xl shadow-2xl",
              "overflow-hidden",
              className
            )}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 p-4 border-b border-border/50">
              <MagnifyingGlass className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm"
                autoFocus
              />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">ESC</kbd>
              </div>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {commandGroups.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No commands found
                </div>
              ) : (
                commandGroups.map((group, groupIndex) => (
                  <div key={group.category}>
                    {/* Category Header */}
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/30">
                      {group.category}
                    </div>
                    
                    {/* Commands */}
                    {group.commands.map((command, commandIndex) => {
                      const globalIndex = commandGroups
                        .slice(0, groupIndex)
                        .reduce((acc, g) => acc + g.commands.length, 0) + commandIndex
                      
                      const isSelected = globalIndex === selectedIndex
                      
                      return (
                        <motion.div
                          key={command.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 cursor-pointer",
                            "transition-colors duration-75",
                            isSelected 
                              ? "bg-primary/10 text-primary" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => executeCommand(command)}
                          whileHover={{ x: 2 }}
                          transition={{ duration: 0.1 }}
                        >
                          {/* Icon */}
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-md",
                            isSelected 
                              ? "bg-primary/20 text-primary" 
                              : "bg-muted/50 text-muted-foreground"
                          )}>
                            {command.icon}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {command.title}
                              </span>
                              {command.isRecent && (
                                <Clock className="w-3 h-3 text-muted-foreground" />
                              )}
                              {command.isFavorite && (
                                <Star className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            {command.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {command.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Shortcut */}
                          {command.shortcut && (
                            <kbd className="px-2 py-1 bg-muted/50 text-xs rounded">
                              {command.shortcut}
                            </kbd>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/50 bg-muted/20">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />
                  <ArrowDown className="w-3 h-3" />
                  <span>navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <CaretRight className="w-3 h-3" />
                  <span>select</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredCommands.length} {filteredCommands.length === 1 ? 'result' : 'results'}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev)
  }
}
