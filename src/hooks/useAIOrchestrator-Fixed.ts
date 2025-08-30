import { useState, useCallback } from 'react'

export interface AIResponse {
  success: boolean
  data?: any
  error?: string
}

export function useAIOrchestrator() {
  const [isProcessing, setIsProcessing] = useState(false)

  const summarizeContent = useCallback(async (content: string): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const sentences = content.split('.').filter(s => s.trim().length > 10)
      const summary = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '')
      
      return {
        success: true,
        data: {
          summary: summary || 'Content summarized successfully',
          word_count: content.split(' ').length,
          key_points: sentences.slice(0, 3).map(s => s.trim())
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to summarize content'
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const extractTasks = useCallback((text: string) => {
    const tasks: any[] = []
    const lines = text.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (line.match(/^\d+\./) || line.match(/^[\-\*]/) || line.includes('할일')) {
        const task = {
          id: Date.now() + index,
          title: line.replace(/^\d+\.|\-|\*/, '').trim(),
          description: '',
          priority: line.includes('중요') || line.includes('urgent') ? 'high' : 'medium',
          status: 'pending',
          created_at: new Date().toISOString(),
          energy: Math.floor(Math.random() * 50) + 50
        }
        tasks.push(task)
      }
    })
    
    return {
      success: true,
      tasks: tasks,
      created_ids: tasks.map(t => t.id),
      summary: `Extracted ${tasks.length} tasks from content`
    }
  }, [])

  const generateInsights = useCallback((notes: any[], tasks: any[], events: any[]) => {
    const insights: any[] = []
    
    // Productivity insight
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalTasks = tasks.length
    
    if (totalTasks > 0) {
      insights.push({
        type: 'productivity',
        title: 'Task Completion Rate',
        description: `You've completed ${completedTasks} out of ${totalTasks} tasks`,
        score: Math.round((completedTasks / totalTasks) * 100),
        data: { completed: completedTasks, total: totalTasks }
      })
    }
    
    // Knowledge insight  
    const recentNotes = notes.filter(n => {
      const noteDate = new Date(n.created_at || n.createdAt)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      return noteDate > weekAgo
    }).length
    
    insights.push({
      type: 'knowledge',
      title: 'Knowledge Building',
      description: `${recentNotes} new notes this week`,
      score: Math.min(recentNotes * 10, 100),
      data: { weekly_notes: recentNotes, total_notes: notes.length }
    })
    
    // Schedule insight
    const today = new Date().toDateString()
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.start || e.date).toDateString()
      return eventDate === today
    }).length
    
    insights.push({
      type: 'schedule',
      title: 'Today\'s Schedule',
      description: `${todayEvents} events scheduled for today`,
      score: todayEvents > 5 ? 50 : 100 - (todayEvents * 10),
      data: { today_events: todayEvents, total_events: events.length }
    })
    
    return insights
  }, [])

  const generateSuggestions = useCallback(async (context: any): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const suggestions = [
        {
          type: 'task',
          title: 'Complete pending tasks',
          description: 'You have several high-priority tasks that need attention',
          action: 'view_tasks',
          priority: 'high'
        },
        {
          type: 'note',
          title: 'Review recent notes',
          description: 'Consider organizing your latest notes with tags',
          action: 'organize_notes',
          priority: 'medium'
        },
        {
          type: 'schedule',
          title: 'Schedule focus time',
          description: 'Block time for deep work based on your energy patterns',
          action: 'create_event',
          priority: 'medium'
        }
      ]
      
      return {
        success: true,
        data: suggestions
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate suggestions'
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const askAI = useCallback(async (question: string, context?: any): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Simple response simulation
      const responses = [
        "Based on your data, I'd recommend focusing on your high-priority tasks first.",
        "Your productivity patterns show peak performance in the morning hours.",
        "Consider breaking down larger tasks into smaller, manageable chunks.",
        "Your recent notes show great progress on the current project."
      ]
      
      const response = responses[Math.floor(Math.random() * responses.length)]
      
      return {
        success: true,
        data: {
          response,
          context_used: context ? Object.keys(context) : [],
          confidence: Math.floor(Math.random() * 30) + 70
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get AI response'
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    isProcessing,
    summarizeContent,
    extractTasks,
    generateInsights,
    generateSuggestions,
    askAI
  }
}
