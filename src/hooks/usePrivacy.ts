import { useState, useCallback } from 'react'

interface PrivacyHook {
  sensitiveNotes: string[]
  toggleSensitive: (noteId: string) => void
  privacyLevel: 'low' | 'medium' | 'high'
  setPrivacyLevel: (level: 'low' | 'medium' | 'high') => void
}

export function usePrivacy(): PrivacyHook {
  const [sensitiveNotes, setSensitiveNotes] = useState<string[]>([])
  const [privacyLevel, setPrivacyLevel] = useState<'low' | 'medium' | 'high'>('medium')

  const toggleSensitive = useCallback((noteId: string) => {
    setSensitiveNotes(prev => 
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    )
  }, [])

  return {
    sensitiveNotes,
    toggleSensitive,
    privacyLevel,
    setPrivacyLevel
  }
}
