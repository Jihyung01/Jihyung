import React from 'react'
import { motion } from 'framer-motion'
import { 
  Home, FileText, CheckSquare, Calendar, BarChart3, Settings,
  Brain, Users, Sparkles, Target, Lightbulb, Cpu
} from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isCollapsed: boolean
  onNavigate: (page: string) => void
  onToggleCollapse: () => void
  stats: any
  aiMode: string
  privacyMode: boolean
  insights: any[]
  currentPage: string
}

export function Sidebar({
  isCollapsed,
  onNavigate,
  onToggleCollapse,
  stats,
  aiMode,
  privacyMode,
  insights,
  currentPage
}: SidebarProps) {
  const navigationItems = [
    { 
      id: 'dashboard', 
      icon: Home, 
      label: 'Dashboard', 
      shortcut: '⌘1',
      badge: stats?.totalNotes || 0
    },
    { 
      id: 'notes', 
      icon: FileText, 
      label: 'Notes', 
      shortcut: '⌘2',
      badge: stats?.totalNotes || 0
    },
    { 
      id: 'tasks', 
      icon: CheckSquare, 
      label: 'Tasks', 
      shortcut: '⌘3',
      badge: stats?.pendingTasks || 0
    },
    { 
      id: 'calendar', 
      icon: Calendar, 
      label: 'Calendar', 
      shortcut: '⌘4',
      badge: stats?.todayEvents || 0
    },
    { 
      id: 'graph', 
      icon: Target, 
      label: 'Knowledge Graph', 
      shortcut: '⌘5',
      badge: insights?.length || 0
    },
    { 
      id: 'analytics', 
      icon: BarChart3, 
      label: 'Analytics', 
      shortcut: '⌘6'
    },
    { 
      id: 'ai-workspace', 
      icon: Sparkles, 
      label: 'AI Workspace', 
      shortcut: '⌘7',
      badge: 'AI'
    },
    { 
      id: 'settings', 
      icon: Settings, 
      label: 'Settings', 
      shortcut: '⌘8'
    }
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5, type: 'spring' }}
          >
            <Brain className="w-5 h-5 text-white" />
          </motion.div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Brain
              </h1>
              <p className="text-xs text-muted-foreground">Next-Gen Workspace</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item, index) => (
          <Tooltip key={item.id} side="right">
            <TooltipTrigger asChild>
              <motion.button
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                  'transition-all duration-200 ease-out group relative',
                  'hover:bg-muted/50 hover:scale-[1.02]',
                  currentPage === item.id && [
                    'bg-primary/10 text-primary shadow-md',
                    'border border-primary/20'
                  ]
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.badge && item.badge !== 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-2 -right-2 min-w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center text-xs font-bold px-1"
                    >
                      {typeof item.badge === 'number' ? (item.badge > 99 ? '99+' : item.badge) : item.badge}
                    </motion.div>
                  )}
                </div>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left text-sm font-medium">
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.shortcut}
                    </span>
                  </>
                )}
              </motion.button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{item.label} ({item.shortcut})</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {/* AI Status */}
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-3 h-3 rounded-full bg-green-500"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">
                AI Mode: {aiMode}
              </p>
              <p className="text-xs text-green-500">
                Online & Synced
              </p>
            </div>
          )}
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <Avatar className="w-8 h-8">
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">AI User</p>
              <p className="text-xs text-muted-foreground truncate">user@example.com</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </motion.div>
        )}
      </div>
    </div>
  )
}
