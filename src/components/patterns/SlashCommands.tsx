import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Hash,
  TextT,
  List,
  ListNumbers,
  CheckSquare,
  Code,
  Image,
  Calendar,
  Clock,
  Database,
  Quotes,
  Divide,
  Plus,
  Robot,
  Lightning,
  Graph,
  ArrowUp,
  ArrowDown,
  Enter
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'

// Slash command types
interface SlashCommand {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  category: string
  keywords: string[]
  action: (editor: any) => void
  isAI?: boolean
}

interface SlashCommandsProps {
  isOpen: boolean
  onClose: () => void
  onCommand: (command: SlashCommand) => void
  position?: { x: number; y: number }
  query?: string
  className?: string
}

// Default slash commands - Notion inspired
const slashCommands: SlashCommand[] = [
  // Text blocks
  {
    id: 'heading1',
    title: 'Heading 1',
    description: 'Big section heading',
    icon: <Hash className="w-4 h-4" />,
    category: 'Text',
    keywords: ['h1', 'heading', 'title', 'large'],
    action: (editor) => console.log('Insert H1')
  },
  {
    id: 'heading2',
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: <Hash className="w-4 h-4" />,
    category: 'Text',
    keywords: ['h2', 'heading', 'subtitle'],
    action: (editor) => console.log('Insert H2')
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    description: 'Small section heading',
    icon: <Hash className="w-4 h-4" />,
    category: 'Text',
    keywords: ['h3', 'heading'],
    action: (editor) => console.log('Insert H3')
  },
  {
    id: 'paragraph',
    title: 'Text',
    description: 'Just start writing with plain text',
    icon: <TextT className="w-4 h-4" />,
    category: 'Text',
    keywords: ['text', 'paragraph', 'plain'],
    action: (editor) => console.log('Insert text')
  },

  // Lists
  {
    id: 'bullet-list',
    title: 'Bullet List',
    description: 'Create a simple bullet list',
    icon: <List className="w-4 h-4" />,
    category: 'Lists',
    keywords: ['bullet', 'list', 'unordered'],
    action: (editor) => console.log('Insert bullet list')
  },
  {
    id: 'numbered-list',
    title: 'Numbered List',
    description: 'Create a list with numbering',
    icon: <ListNumbers className="w-4 h-4" />,
    category: 'Lists',
    keywords: ['numbered', 'list', 'ordered', 'numbers'],
    action: (editor) => console.log('Insert numbered list')
  },
  {
    id: 'todo-list',
    title: 'To-do List',
    description: 'Track tasks with a to-do list',
    icon: <CheckSquare className="w-4 h-4" />,
    category: 'Lists',
    keywords: ['todo', 'task', 'checkbox', 'checklist'],
    action: (editor) => console.log('Insert todo list')
  },

  // Media
  {
    id: 'image',
    title: 'Image',
    description: 'Upload or embed with a link',
    icon: <Image className="w-4 h-4" />,
    category: 'Media',
    keywords: ['image', 'picture', 'photo', 'upload'],
    action: (editor) => console.log('Insert image')
  },
  {
    id: 'code-block',
    title: 'Code',
    description: 'Capture a code snippet',
    icon: <Code className="w-4 h-4" />,
    category: 'Media',
    keywords: ['code', 'snippet', 'programming'],
    action: (editor) => console.log('Insert code block')
  },
  {
    id: 'quote',
    title: 'Quote',
    description: 'Capture a quote',
    icon: <Quotes className="w-4 h-4" />,
    category: 'Media',
    keywords: ['quote', 'blockquote', 'citation'],
    action: (editor) => console.log('Insert quote')
  },
  {
    id: 'divider',
    title: 'Divider',
    description: 'Visually divide blocks',
    icon: <Divide className="w-4 h-4" />,
    category: 'Media',
    keywords: ['divider', 'separator', 'line', 'hr'],
    action: (editor) => console.log('Insert divider')
  },

  // Advanced
  {
    id: 'calendar-event',
    title: 'Calendar Event',
    description: 'Add an event to your calendar',
    icon: <Calendar className="w-4 h-4" />,
    category: 'Advanced',
    keywords: ['calendar', 'event', 'schedule', 'meeting'],
    action: (editor) => console.log('Insert calendar event')
  },
  {
    id: 'reminder',
    title: 'Reminder',
    description: 'Set a reminder for later',
    icon: <Clock className="w-4 h-4" />,
    category: 'Advanced',
    keywords: ['reminder', 'alarm', 'notification', 'time'],
    action: (editor) => console.log('Insert reminder')
  },
  {
    id: 'database',
    title: 'Database',
    description: 'Create a structured data table',
    icon: <Database className="w-4 h-4" />,
    category: 'Advanced',
    keywords: ['database', 'table', 'data', 'structure'],
    action: (editor) => console.log('Insert database')
  },

  // AI Commands
  {
    id: 'ai-write',
    title: 'AI Write',
    description: 'Let AI continue writing for you',
    icon: <Robot className="w-4 h-4" />,
    category: 'AI',
    keywords: ['ai', 'write', 'continue', 'generate'],
    action: (editor) => console.log('AI write'),
    isAI: true
  },
  {
    id: 'ai-improve',
    title: 'AI Improve',
    description: 'Improve the selected text with AI',
    icon: <Lightning className="w-4 h-4" />,
    category: 'AI',
    keywords: ['ai', 'improve', 'enhance', 'rewrite'],
    action: (editor) => console.log('AI improve'),
    isAI: true
  },
  {
    id: 'ai-summarize',
    title: 'AI Summarize',
    description: 'Create a summary of your content',
    icon: <Lightning className="w-4 h-4" />,
    category: 'AI',
    keywords: ['ai', 'summarize', 'summary', 'tldr'],
    action: (editor) => console.log('AI summarize'),
    isAI: true
  },
  {
    id: 'knowledge-link',
    title: 'Knowledge Link',
    description: 'Connect to your knowledge graph',
    icon: <Graph className="w-4 h-4" />,
    category: 'AI',
    keywords: ['knowledge', 'graph', 'link', 'connect'],
    action: (editor) => console.log('Knowledge link'),
    isAI: true
  }
]

// Filter commands based on query
function filterCommands(query: string, commands: SlashCommand[]): SlashCommand[] {
  if (!query.trim()) return commands

  const queryLower = query.toLowerCase()
  
  return commands.filter(command => {
    return (
      command.title.toLowerCase().includes(queryLower) ||
      command.description.toLowerCase().includes(queryLower) ||
      command.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
    )
  })
}

// Group commands by category
function groupCommands(commands: SlashCommand[]) {
  const groups = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = []
    }
    acc[command.category].push(command)
    return acc
  }, {} as Record<string, SlashCommand[]>)

  return Object.entries(groups).map(([category, commands]) => ({
    category,
    commands
  }))
}

export const SlashCommands: React.FC<SlashCommandsProps> = ({
  isOpen,
  onClose,
  onCommand,
  position = { x: 0, y: 0 },
  query = '',
  className
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter and group commands
  const filteredCommands = filterCommands(query, slashCommands)
  const commandGroups = groupCommands(filteredCommands)

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

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
          onCommand(selectedCommand)
          onClose()
        }
        break
    }
  }, [isOpen, onClose, filteredCommands, selectedIndex, onCommand])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Handle command selection
  const handleCommandSelect = (command: SlashCommand) => {
    onCommand(command)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 25 
        }}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y + 24,
          zIndex: 1000
        }}
        className={cn(
          "w-80 max-h-96 overflow-hidden",
          "bg-card/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-2xl",
          className
        )}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Plus className="w-4 h-4" />
            <span>Add a block</span>
            {query && (
              <span className="text-foreground font-medium">
                "{query}"
              </span>
            )}
          </div>
        </div>

        {/* Commands */}
        <div className="max-h-80 overflow-y-auto">
          {commandGroups.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No blocks found
            </div>
          ) : (
            commandGroups.map((group) => (
              <div key={group.category} className="py-2">
                {/* Category header */}
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </div>
                
                {/* Commands */}
                {group.commands.map((command, commandIndex) => {
                  const globalIndex = commandGroups
                    .slice(0, commandGroups.findIndex(g => g.category === group.category))
                    .reduce((acc, g) => acc + g.commands.length, 0) + commandIndex
                  
                  const isSelected = globalIndex === selectedIndex
                  
                  return (
                    <motion.div
                      key={command.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 cursor-pointer",
                        "transition-colors duration-75",
                        isSelected 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => handleCommandSelect(command)}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.1 }}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md",
                        command.isAI 
                          ? "bg-gradient-to-br from-primary/20 to-accent/20 text-primary"
                          : isSelected 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted/50 text-muted-foreground"
                      )}>
                        {command.icon}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {command.title}
                          </span>
                          {command.isAI && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="px-1.5 py-0.5 bg-gradient-to-r from-primary to-accent text-white text-xs rounded-full font-medium"
                            >
                              AI
                            </motion.span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {command.description}
                        </p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              <span>navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <Enter className="w-3 h-3" />
              <span>select</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {filteredCommands.length} blocks
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for slash commands
export function useSlashCommands() {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [query, setQuery] = useState('')

  const open = useCallback((pos: { x: number; y: number }) => {
    setPosition(pos)
    setIsOpen(true)
    setQuery('')
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
  }, [])

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
  }, [])

  return {
    isOpen,
    position,
    query,
    open,
    close,
    updateQuery
  }
}
