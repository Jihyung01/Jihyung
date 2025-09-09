import { useState, useEffect, useCallback } from 'react'

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
  tags: string[]
  subtasks: SubTask[]
  estimatedTime?: number // 분 단위
  actualTime?: number // 분 단위
  category: string
  project?: string
}

export interface SubTask {
  id: string
  title: string
  completed: boolean
  createdAt: Date
}

export interface TaskStats {
  total: number
  completed: number
  pending: number
  overdue: number
  completionRate: number
  totalEstimatedTime: number
  totalActualTime: number
  productivity: number
}

export const useRealTaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startTime: Date } | null>(null)

  // 로컬 스토리지에서 태스크 로드
  const loadTasks = useCallback(() => {
    try {
      const stored = localStorage.getItem('tasks')
      if (stored) {
        const parsed = JSON.parse(stored)
        const tasksWithDates = parsed.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          subtasks: task.subtasks.map((subtask: any) => ({
            ...subtask,
            createdAt: new Date(subtask.createdAt)
          }))
        }))
        setTasks(tasksWithDates)
      }
    } catch (error) {
      console.error('Failed to load tasks:', error)
      setError('Failed to load tasks')
    }
  }, [])

  // 로컬 스토리지에 태스크 저장
  const saveTasks = useCallback((newTasks: Task[]) => {
    try {
      localStorage.setItem('tasks', JSON.stringify(newTasks))
    } catch (error) {
      console.error('Failed to save tasks:', error)
      setError('Failed to save tasks')
    }
  }, [])

  // 태스크 추가
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      subtasks: []
    }
    
    setTasks(prev => {
      const updated = [...prev, newTask]
      saveTasks(updated)
      return updated
    })
    
    return newTask
  }, [saveTasks])

  // 태스크 업데이트
  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      )
      saveTasks(updated)
      return updated
    })
  }, [saveTasks])

  // 태스크 완료/미완료 토글
  const toggleTaskCompletion = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === id) {
          const completed = !task.completed
          return {
            ...task,
            completed,
            updatedAt: new Date()
          }
        }
        return task
      })
      saveTasks(updated)
      return updated
    })
  }, [saveTasks])

  // 태스크 삭제
  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const updated = prev.filter(task => task.id !== id)
      saveTasks(updated)
      return updated
    })
  }, [saveTasks])

  // 서브태스크 추가
  const addSubTask = useCallback((taskId: string, title: string) => {
    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      completed: false,
      createdAt: new Date()
    }
    
    setTasks(prev => {
      const updated = prev.map(task => 
        task.id === taskId 
          ? { ...task, subtasks: [...task.subtasks, newSubTask], updatedAt: new Date() }
          : task
      )
      saveTasks(updated)
      return updated
    })
    
    return newSubTask
  }, [saveTasks])

  // 서브태스크 토글
  const toggleSubTaskCompletion = useCallback((taskId: string, subtaskId: string) => {
    setTasks(prev => {
      const updated = prev.map(task => {
        if (task.id === taskId) {
          const updatedSubtasks = task.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
          )
          return { ...task, subtasks: updatedSubtasks, updatedAt: new Date() }
        }
        return task
      })
      saveTasks(updated)
      return updated
    })
  }, [saveTasks])

  // 태스크 필터링
  const getFilteredTasks = useCallback((filters: {
    completed?: boolean
    priority?: 'low' | 'medium' | 'high'
    category?: string
    project?: string
    tag?: string
    overdue?: boolean
  }) => {
    return tasks.filter(task => {
      if (filters.completed !== undefined && task.completed !== filters.completed) return false
      if (filters.priority && task.priority !== filters.priority) return false
      if (filters.category && task.category !== filters.category) return false
      if (filters.project && task.project !== filters.project) return false
      if (filters.tag && !task.tags.includes(filters.tag)) return false
      if (filters.overdue && task.dueDate) {
        const isOverdue = new Date() > task.dueDate && !task.completed
        if (!isOverdue) return false
      }
      return true
    })
  }, [tasks])

  // 오늘 해야 할 일
  const getTodaysTasks = useCallback(() => {
    const today = new Date()
    const todayStr = today.toDateString()
    
    return tasks.filter(task => {
      if (task.completed) return false
      if (!task.dueDate) return false
      return task.dueDate.toDateString() === todayStr
    })
  }, [tasks])

  // 이번 주 태스크
  const getWeeklyTasks = useCallback(() => {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6))
    
    return tasks.filter(task => {
      if (!task.dueDate) return false
      return task.dueDate >= weekStart && task.dueDate <= weekEnd
    })
  }, [tasks])

  // 통계 계산
  const getTaskStats = useCallback((): TaskStats => {
    const total = tasks.length
    const completed = tasks.filter(t => t.completed).length
    const pending = total - completed
    const overdue = tasks.filter(t => t.dueDate && new Date() > t.dueDate && !t.completed).length
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    
    const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
    const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0)
    const productivity = totalEstimatedTime > 0 ? (totalActualTime / totalEstimatedTime) * 100 : 0
    
    return {
      total,
      completed,
      pending,
      overdue,
      completionRate,
      totalEstimatedTime,
      totalActualTime,
      productivity
    }
  }, [tasks])

  // 시간 추적 시작
  const startTimeTracking = useCallback((taskId: string) => {
    setActiveTimer({ taskId, startTime: new Date() })
  }, [])

  // 시간 추적 중지
  const stopTimeTracking = useCallback(() => {
    if (activeTimer) {
      const endTime = new Date()
      const duration = Math.round((endTime.getTime() - activeTimer.startTime.getTime()) / 60000) // 분 단위
      
      updateTask(activeTimer.taskId, {
        actualTime: (tasks.find(t => t.id === activeTimer.taskId)?.actualTime || 0) + duration
      })
      
      setActiveTimer(null)
    }
  }, [activeTimer, updateTask, tasks])

  // 태스크 검색
  const searchTasks = useCallback((query: string) => {
    const lowercaseQuery = query.toLowerCase()
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      task.description?.toLowerCase().includes(lowercaseQuery) ||
      task.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      task.category.toLowerCase().includes(lowercaseQuery)
    )
  }, [tasks])

  // 태스크 우선순위 자동 조정
  const autoAdjustPriorities = useCallback(() => {
    const now = new Date()
    const updated = tasks.map(task => {
      if (task.completed || !task.dueDate) return task
      
      const timeUntilDue = task.dueDate.getTime() - now.getTime()
      const daysUntilDue = timeUntilDue / (1000 * 60 * 60 * 24)
      
      let newPriority = task.priority
      
      if (daysUntilDue < 1) {
        newPriority = 'high'
      } else if (daysUntilDue < 3 && task.priority === 'low') {
        newPriority = 'medium'
      }
      
      return { ...task, priority: newPriority, updatedAt: new Date() }
    })
    
    setTasks(updated)
    saveTasks(updated)
  }, [tasks, saveTasks])

  // 태스크 내보내기 (JSON)
  const exportTasks = useCallback(() => {
    const dataStr = JSON.stringify(tasks, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }, [tasks])

  // 태스크 가져오기
  const importTasks = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        const tasksWithNewIds = imported.map((task: any) => ({
          ...task,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }))
        
        setTasks(prev => {
          const combined = [...prev, ...tasksWithNewIds]
          saveTasks(combined)
          return combined
        })
      } catch (error) {
        setError('Failed to import tasks')
      }
    }
    reader.readAsText(file)
  }, [saveTasks])

  // 컴포넌트 마운트 시 태스크 로드
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 매일 자동 우선순위 조정
  useEffect(() => {
    const interval = setInterval(autoAdjustPriorities, 24 * 60 * 60 * 1000) // 24시간마다
    return () => clearInterval(interval)
  }, [autoAdjustPriorities])

  return {
    tasks,
    loading,
    error,
    activeTimer,
    addTask,
    updateTask,
    toggleTaskCompletion,
    deleteTask,
    addSubTask,
    toggleSubTaskCompletion,
    getFilteredTasks,
    getTodaysTasks,
    getWeeklyTasks,
    getTaskStats,
    startTimeTracking,
    stopTimeTracking,
    searchTasks,
    autoAdjustPriorities,
    exportTasks,
    importTasks
  }
}
