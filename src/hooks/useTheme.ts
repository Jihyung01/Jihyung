// src/hooks/useTheme.ts
import { useState, useEffect, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface UseThemeReturn {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resolvedTheme: 'light' | 'dark'
  systemTheme: 'light' | 'dark'
}

export const useTheme = (): UseThemeReturn => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Calculate resolved theme
  const resolvedTheme = theme === 'system' ? systemTheme : theme

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add current theme class
    root.classList.add(resolvedTheme)
    
    // Update CSS custom properties for theme
    if (resolvedTheme === 'dark') {
      root.style.colorScheme = 'dark'
    } else {
      root.style.colorScheme = 'light'
    }
  }, [resolvedTheme])

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }, [])

  // Toggle between light and dark (skip system)
  const toggleTheme = useCallback(() => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current system theme
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    }
  }, [theme, systemTheme, setTheme])

  return {
    theme,
    setTheme,
    toggleTheme,
    resolvedTheme,
    systemTheme
  }
}
