import { useState, useEffect } from 'react'
import { 
  Brain, 
  House, 
  Tray, 
  NotePencil, 
  CheckSquare, 
  Calendar,
  Users,
  Gear,
  SignOut,
  MagnifyingGlass,
  Plus,
  Bell
} from '@phosphor-icons/react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useApp } from '../../contexts/AppContext'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { state, actions } = useApp()
  const [notifications, setNotifications] = useState(3)
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      const { logout, setAuthToken } = await import('../../api/client')
      await logout() // Clear auth token on server
      setAuthToken(null) // Clear local auth token
    } catch (error) {
      console.error('로그아웃 에러:', error)
    }
    
    actions.setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('로그아웃되었습니다.')
    window.location.reload()
  }

  const navigation = [
    { name: '오늘', href: '/', icon: House, current: location.pathname === '/' },
    { name: '받은함', href: '/inbox', icon: Tray, current: location.pathname === '/inbox', badge: notifications },
    { name: '노트', href: '/notes', icon: NotePencil, current: location.pathname === '/notes' },
    { name: '태스크', href: '/tasks', icon: CheckSquare, current: location.pathname === '/tasks' },
    { name: '캘린더', href: '/calendar', icon: Calendar, current: location.pathname === '/calendar' },
    { name: 'AI 기능', href: '/ai', icon: Brain, current: location.pathname === '/ai' },
    { name: '협업', href: '/collaboration', icon: Users, current: location.pathname === '/collaboration' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Brain className="w-5 h-5 text-primary-foreground" weight="bold" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Jihyung</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`
                  group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${item.current 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" weight={item.current ? 'fill' : 'regular'} />
                <span className="truncate">{item.name}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto min-w-5 h-5 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t border-border p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={state.user?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {state.user?.name?.[0] || state.user?.email?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-foreground truncate">
                    {state.user?.name || '사용자'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {state.user?.email || 'user@example.com'}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{state.user?.name || '사용자'}</p>
                  <p className="text-xs text-muted-foreground">{state.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
                            <DropdownMenuItem>
                <Gear className="w-4 h-4 mr-2" />
                설정
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/help')}>
                <Bell className="w-4 h-4 mr-2" />
                도움말
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <SignOut className="w-4 h-4 mr-2" />
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex-1 flex items-center gap-4">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => toast.info('빠른 캡처 기능은 준비 중입니다.')}
              >
                <Plus className="w-4 h-4" />
                캡처
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => toast.info('검색 기능은 준비 중입니다.')}
              >
                <MagnifyingGlass className="w-4 h-4" />
                검색
                <Badge variant="secondary" className="text-xs">⌘K</Badge>
              </Button>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
                  {notifications}
                </Badge>
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const html = document.documentElement
                const isDark = html.classList.contains('dark')
                if (isDark) {
                  html.classList.remove('dark')
                  localStorage.setItem('theme', 'light')
                } else {
                  html.classList.add('dark')
                  localStorage.setItem('theme', 'dark')
                }
              }}
            >
              🌙
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}