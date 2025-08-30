// src/components/CommandPalette/CommandPalette.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, Search, FileText, Calendar, CheckSquare, Hash, User, Settings, LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface CommandItem {
  icon: LucideIcon
  label: string
  action: () => void
  shortcut: string
  category?: 'navigation' | 'creation' | 'utility'
  description?: string
}

interface CommandPaletteProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  customCommands?: CommandItem[]
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen: controlledIsOpen,
  onOpenChange,
  customCommands = []
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const navigate = useNavigate()

  // Use controlled or internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = useCallback((open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalIsOpen(open)
    }
  }, [onOpenChange])

  const defaultCommands: CommandItem[] = [
    { 
      icon: FileText, 
      label: 'New Note', 
      action: () => navigate('/notes/new'), 
      shortcut: 'N',
      category: 'creation',
      description: 'Create a new note'
    },
    { 
      icon: CheckSquare, 
      label: 'New Task', 
      action: () => navigate('/tasks/new'), 
      shortcut: 'T',
      category: 'creation',
      description: 'Create a new task'
    },
    { 
      icon: Calendar, 
      label: 'New Event', 
      action: () => navigate('/calendar/new'), 
      shortcut: 'E',
      category: 'creation',
      description: 'Create a new calendar event'
    },
    { 
      icon: Search, 
      label: 'Search Everything', 
      action: () => {
        // TODO: Implement global search
        console.log('Global search not implemented yet')
      }, 
      shortcut: 'S',
      category: 'utility',
      description: 'Search across all your content'
    },
    { 
      icon: Hash, 
      label: 'Browse Tags', 
      action: () => navigate('/tags'), 
      shortcut: '#',
      category: 'navigation',
      description: 'Browse and manage tags'
    },
    { 
      icon: User, 
      label: 'Profile', 
      action: () => navigate('/profile'), 
      shortcut: 'P',
      category: 'navigation',
      description: 'View your profile'
    },
    { 
      icon: Settings, 
      label: 'Settings', 
      action: () => navigate('/settings'), 
      shortcut: ',',
      category: 'utility',
      description: 'Open application settings'
    },
  ]

  const allCommands = [...defaultCommands, ...customCommands]

  const filteredCommands = allCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description?.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category?.toLowerCase().includes(search.toLowerCase())
  )

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  // Keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open/close command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(!isOpen)
        setSearch('') // Reset search when opening
        return
      }
      
      if (isOpen) {
        switch (e.key) {
          case 'Escape':
            e.preventDefault()
            setIsOpen(false)
            break
            
          case 'ArrowDown':
            e.preventDefault()
            setSelectedIndex((prev) => 
              prev < filteredCommands.length - 1 ? prev + 1 : 0
            )
            break
            
          case 'ArrowUp':
            e.preventDefault()
            setSelectedIndex((prev) => 
              prev > 0 ? prev - 1 : filteredCommands.length - 1
            )
            break
            
          case 'Enter':
            e.preventDefault()
            if (filteredCommands[selectedIndex]) {
              filteredCommands[selectedIndex].action()
              setIsOpen(false)
              setSearch('')
            }
            break
            
          case 'Tab':
            e.preventDefault()
            setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, setIsOpen])

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, cmd) => {
    const category = cmd.category || 'other'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(cmd)
    return groups
  }, {} as Record<string, CommandItem[]>)

  const categoryLabels: Record<string, string> = {
    creation: 'Create',
    navigation: 'Navigate',
    utility: 'Utilities',
    other: 'Other'
  }

  const handleCommandSelect = useCallback((command: CommandItem) => {
    command.action()
    setIsOpen(false)
    setSearch('')
  }, [setIsOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        />

        {/* Command Palette */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: "spring", duration: 0.2 }}
          className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 bg-card border rounded-xl shadow-2xl z-50 overflow-hidden"
        >
          {/* Header with Search Input */}
          <div className="flex items-center gap-3 p-4 border-b bg-card">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Command className="h-4 w-4" />
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded border">
                ⌘K
              </kbd>
              <kbd className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded border">
                ESC
              </kbd>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No commands found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {categoryLabels[category] || category}
                    </div>
                    <div className="space-y-1">
                      {commands.map((cmd, categoryIndex) => {
                        const globalIndex = filteredCommands.indexOf(cmd)
                        const Icon = cmd.icon
                        const isSelected = selectedIndex === globalIndex
                        
                        return (
                          <motion.button
                            key={`${category}-${cmd.label}`}
                            onClick={() => handleCommandSelect(cmd)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150",
                              "hover:bg-accent/50",
                              isSelected && "bg-accent text-accent-foreground shadow-sm"
                            )}
                          >
                            <Icon className={cn(
                              "h-4 w-4 shrink-0",
                              isSelected ? "text-accent-foreground" : "text-muted-foreground"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{cmd.label}</div>
                              {cmd.description && (
                                <div className={cn(
                                  "text-xs truncate mt-0.5",
                                  isSelected ? "text-accent-foreground/70" : "text-muted-foreground"
                                )}>
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            <kbd className={cn(
                              "px-2 py-1 text-xs rounded border shrink-0",
                              isSelected 
                                ? "bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20"
                                : "bg-muted text-muted-foreground border-border"
                            )}>
                              {cmd.shortcut.includes('cmd') ? cmd.shortcut : `⌘${cmd.shortcut}`}
                            </kbd>
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t bg-muted/5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background rounded">↵</kbd>
                  Select
                </span>
              </div>
              <span>{filteredCommands.length} commands</span>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  )
}

// Hook for using command palette programmatically
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen
  }
}
