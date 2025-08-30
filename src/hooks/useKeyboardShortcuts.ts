import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  [key: string]: () => void
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Build shortcut string
    const parts: string[] = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.metaKey) parts.push('cmd')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    parts.push(event.key.toLowerCase())
    
    const shortcutString = parts.join('+')
    
    // Check for matches
    Object.keys(shortcuts).forEach(shortcut => {
      const normalizedShortcut = shortcut.toLowerCase().replace(/\s/g, '')
      if (normalizedShortcut === shortcutString) {
        event.preventDefault()
        shortcuts[shortcut]()
      }
    })
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useKeyboardShortcuts
