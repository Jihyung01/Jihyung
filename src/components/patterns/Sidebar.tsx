import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain,
  Calendar,
  Note,
  CheckSquare,
  Graph,
  Robot,
  Gear,
  MagnifyingGlass,
  Plus,
  Sidebar,
  Command,
  Lightning,
  Star,
  Archive,
  Trash,
  User,
  Team
} from '@phosphor-icons/react'
import { cn } from '../../lib/utils'
import { Button, IconButton } from '../ui/button-next'

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  badge?: number | string
  isActive?: boolean
  shortcut?: string
  children?: SidebarItem[]
}

interface SidebarSection {
  title?: string
  items: SidebarItem[]
}

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  sections?: SidebarSection[]
  className?: string
}

// Default sidebar configuration
const defaultSections: SidebarSection[] = [
  {
    items: [
      {
        id: 'search',
        label: 'Search',
        icon: <MagnifyingGlass className="w-4 h-4" />,
        shortcut: '⌘F',
        onClick: () => console.log('Search')
      },
      {
        id: 'command',
        label: 'Command Palette',
        icon: <Command className="w-4 h-4" />,
        shortcut: '⌘K',
        onClick: () => console.log('Command Palette')
      }
    ]
  },
  {
    title: 'Workspace',
    items: [
      {
        id: 'inbox',
        label: 'Inbox',
        icon: <Plus className="w-4 h-4" />,
        badge: 3,
        isActive: false,
        shortcut: 'I'
      },
      {
        id: 'notes',
        label: 'Notes',
        icon: <Note className="w-4 h-4" />,
        badge: 127,
        isActive: true,
        shortcut: 'N'
      },
      {
        id: 'tasks',
        label: 'Tasks',
        icon: <CheckSquare className="w-4 h-4" />,
        badge: 12,
        shortcut: 'T'
      },
      {
        id: 'calendar',
        label: 'Calendar',
        icon: <Calendar className="w-4 h-4" />,
        shortcut: 'C'
      }
    ]
  },
  {
    title: 'AI Features',
    items: [
      {
        id: 'ai-assistant',
        label: 'AI Assistant',
        icon: <Robot className="w-4 h-4" />,
        shortcut: 'A'
      },
      {
        id: 'knowledge-graph',
        label: 'Knowledge Graph',
        icon: <Graph className="w-4 h-4" />,
        shortcut: 'G'
      },
      {
        id: 'insights',
        label: 'Insights',
        icon: <Lightning className="w-4 h-4" />,
        badge: 'NEW'
      }
    ]
  },
  {
    title: 'Collections',
    items: [
      {
        id: 'favorites',
        label: 'Favorites',
        icon: <Star className="w-4 h-4" />,
        badge: 8
      },
      {
        id: 'archive',
        label: 'Archive',
        icon: <Archive className="w-4 h-4" />
      },
      {
        id: 'trash',
        label: 'Trash',
        icon: <Trash className="w-4 h-4" />
      }
    ]
  }
]

// Sidebar item component
interface SidebarItemProps {
  item: SidebarItem
  isCollapsed: boolean
  level?: number
}

const SidebarItemComponent: React.FC<SidebarItemProps> = ({ 
  item, 
  isCollapsed, 
  level = 0 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  
  const handleClick = useCallback(() => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    } else if (item.onClick) {
      item.onClick()
    }
  }, [hasChildren, isExpanded, item])

  return (
    <div>
      <motion.button
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
          "transition-all duration-75",
          "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          item.isActive 
            ? "bg-primary/10 text-primary border-r-2 border-primary" 
            : "text-muted-foreground hover:text-foreground",
          level > 0 && "ml-4"
        )}
        onClick={handleClick}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center w-5 h-5 shrink-0",
          item.isActive ? "text-primary" : "text-current"
        )}>
          {item.icon}
        </div>
        
        {/* Label and badge */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-between flex-1 min-w-0"
            >
              <span className="truncate">{item.label}</span>
              
              <div className="flex items-center gap-2">
                {/* Badge */}
                {item.badge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full font-medium",
                      typeof item.badge === 'number'
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/20 text-primary"
                    )}
                  >
                    {item.badge}
                  </motion.span>
                )}
                
                {/* Shortcut */}
                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 bg-muted/50 text-xs rounded font-mono">
                    {item.shortcut}
                  </kbd>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
      
      {/* Children */}
      <AnimatePresence>
        {hasChildren && isExpanded && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 mt-1">
              {item.children!.map((child) => (
                <SidebarItemComponent
                  key={child.id}
                  item={child}
                  isCollapsed={isCollapsed}
                  level={level + 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main sidebar component
export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  sections = defaultSections,
  className
}) => {
  return (
    <motion.aside
      animate={{ 
        width: isCollapsed ? 60 : 240 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 25 
      }}
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        "transition-shadow duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Brain className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg">AI Brain</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        {onToggle && (
          <IconButton
            icon={<Sidebar className="w-4 h-4" />}
            onClick={onToggle}
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3 space-y-6">
        {sections.map((section, index) => (
          <div key={index} className="space-y-2">
            {/* Section title */}
            <AnimatePresence>
              {section.title && !isCollapsed && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {section.title}
                </motion.h3>
              )}
            </AnimatePresence>
            
            {/* Section items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItemComponent
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="space-y-1">
          <SidebarItemComponent
            item={{
              id: 'profile',
              label: 'Profile',
              icon: <User className="w-4 h-4" />,
              onClick: () => console.log('Profile')
            }}
            isCollapsed={isCollapsed}
          />
          <SidebarItemComponent
            item={{
              id: 'settings',
              label: 'Settings',
              icon: <Gear className="w-4 h-4" />,
              onClick: () => console.log('Settings'),
              shortcut: '⌘,'
            }}
            isCollapsed={isCollapsed}
          />
        </div>
      </div>
    </motion.aside>
  )
}

// Sidebar hook for state management
export function useSidebar(defaultCollapsed = false) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)

  const toggle = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const collapse = useCallback(() => {
    setIsCollapsed(true)
  }, [])

  const expand = useCallback(() => {
    setIsCollapsed(false)
  }, [])

  return {
    isCollapsed,
    toggle,
    collapse,
    expand
  }
}
