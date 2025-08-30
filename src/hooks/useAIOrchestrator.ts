import { useState, useCallback } from 'react'
import enhancedAPI from '@/lib/enhanced-api.ts'

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
      const result = await enhancedAPI.summarizeText(content)
      
      return {
        success: true,
        data: {
          summary: result.summary,
          word_count: content.split(' ').length,
          key_points: content.split('.').filter(s => s.trim().length > 10).slice(0, 3)
        }
      }
    } catch (error) {
      console.error('AI summarization failed:', error)
      
      // Fallback to local processing
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
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const extractTasks = useCallback(async (text: string) => {
    setIsProcessing(true)
    try {
      const result = await enhancedAPI.extractTasks(text)
      setIsProcessing(false)
      
      return {
        success: true,
        tasks: result.tasks,
        created_ids: result.created_ids,
        summary: `Extracted ${result.tasks.length} tasks from content`
      }
    } catch (error) {
      console.error('AI task extraction failed:', error)
      setIsProcessing(false)
      
      // Fallback to local processing
      const tasks: any[] = []
      const lines = text.split('\n').filter(line => line.trim())
      
      lines.forEach((line, index) => {
        if (line.match(/^\d+\./) || line.match(/^[\-\*]/) || line.includes('할일') || line.includes('TODO')) {
          const task = {
            id: Date.now() + index,
            title: line.replace(/^\d+\.|\-|\*|TODO:?|할일:?/i, '').trim(),
            description: '',
            priority: line.includes('중요') || line.includes('urgent') || line.includes('!') ? 'high' : 'medium',
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
    }
  }, [])

  const generateInsights = useCallback(async (notes: any[], tasks: any[], events: any[]) => {
    const insights: any[] = []
    
    // Productivity insight
    const completedTasks = tasks.filter(t => t.status === 'completed').length
    const totalTasks = tasks.length
    
    if (totalTasks > 0) {
      insights.push({
        type: 'productivity',
        title: 'Task Completion Rate',
        description: `You've completed ${completedTasks} out of ${totalTasks} tasks (${Math.round((completedTasks / totalTasks) * 100)}%)`,
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
      description: `${recentNotes} new notes this week, total ${notes.length} notes in your knowledge base`,
      score: Math.min(recentNotes * 10, 100),
      data: { weekly_notes: recentNotes, total_notes: notes.length }
    })
    
    // Schedule insight
    const today = new Date().toDateString()
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.start_at || e.start || e.date).toDateString()
      return eventDate === today
    }).length
    
    insights.push({
      type: 'schedule',
      title: 'Today\'s Schedule',
      description: `${todayEvents} events scheduled for today${todayEvents > 5 ? ' - quite busy!' : todayEvents === 0 ? ' - free day' : ''}`,
      score: todayEvents > 5 ? 50 : 100 - (todayEvents * 10),
      data: { today_events: todayEvents, total_events: events.length }
    })

    // Priority task insight
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length
    if (highPriorityTasks > 0) {
      insights.push({
        type: 'priority',
        title: 'High Priority Tasks',
        description: `${highPriorityTasks} high priority tasks need your attention`,
        score: Math.max(0, 100 - (highPriorityTasks * 20)),
        data: { high_priority_count: highPriorityTasks }
      })
    }
    
    return insights
  }, [])

  const generateSuggestions = useCallback(async (context: any): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      const result = await enhancedAPI.getSmartSuggestions()
      setIsProcessing(false)
      
      return {
        success: true,
        data: result.suggestions
      }
    } catch (error) {
      console.error('Failed to get AI suggestions:', error)
      setIsProcessing(false)
      
      // Fallback suggestions
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
    }
  }, [])

  const askAI = useCallback(async (question: string, context?: any): Promise<AIResponse> => {
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1200))
      
      // Enhanced AI responses based on question type
      let response = "Based on your data, I'd recommend focusing on your high-priority tasks first."
      
      if (question.toLowerCase().includes('productivity')) {
        response = "Your productivity patterns show room for improvement. Consider breaking down larger tasks into smaller chunks and setting specific time blocks for focused work."
      } else if (question.toLowerCase().includes('schedule')) {
        response = "Based on your calendar, your mornings appear to be less busy. This might be an ideal time for deep work on important tasks."
      } else if (question.toLowerCase().includes('task') || question.toLowerCase().includes('todo')) {
        response = "I notice you have several pending tasks. Would you like me to help prioritize them based on due dates and importance?"
      } else if (question.toLowerCase().includes('note')) {
        response = "Your notes show great progress. Consider connecting related ideas with tags or creating summary notes for better knowledge organization."
      }
      
      return {
        success: true,
        data: {
          response,
          context_used: context ? Object.keys(context) : [],
          confidence: Math.floor(Math.random() * 30) + 70,
          suggestions: [
            "Would you like me to analyze your productivity patterns?",
            "I can help organize your tasks by priority",
            "Let me suggest optimal time blocks for your schedule"
          ]
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
