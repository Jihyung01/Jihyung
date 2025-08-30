import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface AutoScheduleHook {
  proposedSchedule: any[]
  proposeSchedule: (tasks: any[]) => Promise<void>
  commitSchedule: (schedule: any[]) => Promise<void>
  isProposing: boolean
  scheduleConflicts: any[]
}

export function useAutoSchedule(): AutoScheduleHook {
  const [proposedSchedule, setProposedSchedule] = useState<any[]>([])
  const [isProposing, setIsProposing] = useState(false)
  const [scheduleConflicts, setScheduleConflicts] = useState<any[]>([])

  const proposeSchedule = useCallback(async (tasks: any[]) => {
    try {
      setIsProposing(true)
      
      const response = await fetch('/api/schedule/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tasks, 
          constraints: {
            workHours: { start: 9, end: 17 },
            energyWindows: ['morning', 'afternoon'],
            maxDailyHours: 8
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Schedule proposal failed')
      }
      
      const result = await response.json()
      setProposedSchedule(result.schedule || [])
      setScheduleConflicts(result.conflicts || [])
      
      toast.success(`Proposed ${result.schedule?.length || 0} time blocks`)
    } catch (error) {
      console.error('Auto-schedule error:', error)
      toast.error('Auto-schedule failed')
      setProposedSchedule([])
    } finally {
      setIsProposing(false)
    }
  }, [])

  const commitSchedule = useCallback(async (schedule: any[]) => {
    try {
      const response = await fetch('/api/schedule/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      })
      
      if (!response.ok) {
        throw new Error('Schedule commit failed')
      }
      
      setProposedSchedule([])
      setScheduleConflicts([])
      toast.success('Schedule committed successfully')
    } catch (error) {
      console.error('Schedule commit error:', error)
      toast.error('Failed to commit schedule')
    }
  }, [])

  return {
    proposedSchedule,
    proposeSchedule,
    commitSchedule,
    isProposing,
    scheduleConflicts
  }
}
