import { useState } from 'react'
import { House, File, Calendar as CalendarIcon, Target } from '@phosphor-icons/react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface RouterProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export function Router({ currentPage, onNavigate }: RouterProps) {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: House },
    { id: 'notes', label: '노트', icon: File },
    { id: 'tasks', label: '태스크', icon: Target },
    { id: 'calendar', label: '캘린더', icon: CalendarIcon },
  ]

  return (
    <nav className="flex items-center gap-2">
      {navItems.map(item => {
        const Icon = item.icon
        return (
          <Button
            key={item.id}
            variant={currentPage === item.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onNavigate(item.id)}
            className={cn(
              'gap-2',
              currentPage === item.id && 'bg-primary text-primary-foreground'
            )}
            data-testid={`${item.id}-nav`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Button>
        )
      })}
    </nav>
  )
}