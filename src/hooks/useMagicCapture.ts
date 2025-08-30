import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface MagicCaptureHook {
  rules: any[]
  runRules: (data: any, rules: any[]) => Promise<any>
  simulateRules: (data: any, rules: any[]) => Promise<any>
  toggleRule: (ruleId: string) => void
}

export function useMagicCapture(): MagicCaptureHook {
  const [rules, setRules] = useState<any[]>([
    {
      id: '1',
      trigger: 'newNote',
      condition: 'content.includes("meeting")',
      action: 'autoTag',
      enabled: true,
      lastRun: null
    },
    {
      id: '2',
      trigger: 'newTask',
      condition: 'priority === "urgent"',
      action: 'autoSchedule',
      enabled: true,
      lastRun: null
    }
  ])

  const runRules = useCallback(async (data: any, activeRules: any[]) => {
    try {
      const response = await fetch('/api/magic/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, rules: activeRules })
      })
      
      if (!response.ok) {
        throw new Error('Magic rules failed')
      }
      
      const result = await response.json()
      toast.success(`Applied ${result.appliedRules?.length || 0} rules`)
      return result.enhancedData || data
    } catch (error) {
      console.error('Magic rules error:', error)
      toast.error('Magic rules failed')
      return data
    }
  }, [])

  const simulateRules = useCallback(async (data: any, activeRules: any[]) => {
    try {
      const response = await fetch('/api/magic/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, rules: activeRules })
      })
      
      if (!response.ok) {
        throw new Error('Rule simulation failed')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Rule simulation error:', error)
      return { preview: data, appliedRules: [] }
    }
  }, [])

  const toggleRule = useCallback((ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ))
  }, [])

  return {
    rules,
    runRules,
    simulateRules,
    toggleRule
  }
}
