// Enhanced API Client for Real Functionality
import * as api from '../api/client';

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: number;
  version: number;
  is_archived: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  energy: number;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  parent_id?: number;
  note_id?: number;
}

export interface CalendarEvent {
  id: number | string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  user_id: number;
  task_id?: number;
  type?: 'event' | 'task';
  priority?: 'low' | 'medium' | 'high';
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  score?: number;
  data?: any;
}

export interface DailyBrief {
  date: string;
  top_tasks: Task[];
  time_blocks: any[];
  recent_notes: Note[];
  summary?: string;
  productivity_score?: number;
  insights?: AIInsight[];
}

// Enhanced API methods
export const enhancedAPI = {
  // Notes
  async getNotes(query?: string, tags?: string[]): Promise<Note[]> {
    try {
      const notes = await api.listNotes(query, tags) || [];
      // Map API response to frontend interface
      return notes.map(note => ({
        id: parseInt(note.id) || Date.now(),
        title: note.title || '',
        content: note.content || '',
        tags: note.tags || [],
        created_at: note.createdAt || note.created_at || new Date().toISOString(),
        updated_at: note.updatedAt || note.updated_at || new Date().toISOString(),
        user_id: note.user_id || 1,
        version: note.version || 1,
        is_archived: note.is_archived || false
      }));
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  },

  async createNote(data: Partial<Note>): Promise<Note> {
    try {
      console.log('Enhanced API: Creating note with data:', data);
      
      // Validate required fields
      if (!data.title || data.title.trim() === '') {
        throw new Error('Note title is required');
      }
      
      const result = await api.createNote({
        title: data.title.trim(),
        content: data.content || '',
        tags: data.tags || []
      });
      
      console.log('Enhanced API: Note created successfully:', result);
      return result;
    } catch (error) {
      console.error('Enhanced API createNote error:', error);
      // Re-throw with more context
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    return await api.updateNote(id, {
      title: data.title,
      content: data.content,
      tags: data.tags
    });
  },

  async deleteNote(id: number): Promise<void> {
    return await api.deleteNote(id);
  },

  async getRecentNotes(limit = 10): Promise<Note[]> {
    try {
      const notes = await api.listNotes();
      return notes.slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent notes:', error);
      return [];
    }
  },

  // Tasks
  async getTasks(from?: string, to?: string, status?: string): Promise<Task[]> {
    try {
      const tasks = await api.listTasks(from, to) || [];
      // Map API response to frontend interface
      const mappedTasks = tasks.map(task => ({
        id: parseInt(task.id) || Date.now(),
        title: task.title || '',
        description: task.description || '',
        status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' || 'pending',
        priority: task.priority as 'low' | 'medium' | 'high' || 'medium',
        energy: task.energy_level === 'high' ? 80 : task.energy_level === 'low' ? 30 : 50,
        due_at: task.due_at || task.due_date || undefined,
        completed_at: task.completed_at || undefined,
        created_at: task.createdAt || task.created_at || new Date().toISOString(),
        updated_at: task.updatedAt || task.updated_at || new Date().toISOString(),
        user_id: task.user_id || 1,
        parent_id: task.parent_task_id || undefined,
        note_id: task.note_id || undefined
      }));
      
      if (status) {
        return mappedTasks.filter(task => task.status === status);
      }
      return mappedTasks;
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  },

  async getTodayTasks(): Promise<Task[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      return await api.listTasks(today, today) || [];
    } catch (error) {
      console.error('Failed to get today tasks:', error);
      return [];
    }
  },

  async createTask(data: Partial<Task>): Promise<Task> {
    try {
      console.log('Enhanced API: Creating task with data:', data);
      
      // Validate required fields
      if (!data.title || data.title.trim() === '') {
        throw new Error('Task title is required');
      }
      
      const result = await api.createTask({
        title: data.title.trim(),
        description: data.description || '', // Ensure description is always included
        priority: data.priority || 'medium',
        due_at: data.due_at,
        due_date: data.due_at, // Map for backward compatibility
        all_day: true,
        status: 'pending',
        urgency_score: 5,
        importance_score: 5,
        energy: data.energy,
        parent_id: data.parent_id,
        note_id: data.note_id,
        tags: [],
        category: undefined,
        location: undefined,
        energy_level: 'medium',
        context_tags: [],
        recurrence_rule: undefined
      });
      
      console.log('Enhanced API: Task created successfully:', result);
      return result;
    } catch (error) {
      console.error('Enhanced API createTask error:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateTask(id: number, data: Partial<Task>): Promise<Task> {
    try {
      console.log('Enhanced API: Updating task with data:', { id, data });
      
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.due_at !== undefined) {
        updateData.due_at = data.due_at;
        updateData.due_date = data.due_at; // Map for backward compatibility
      }
      if (data.energy !== undefined) updateData.energy = data.energy;
      
      const result = await api.updateTask(id, updateData);
      
      console.log('Enhanced API: Task updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Enhanced API updateTask error:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteTask(id: number): Promise<void> {
    return await api.deleteTask(id);
  },

  async getTaskStats(): Promise<any> {
    try {
      const tasks = await api.listTasks();
      return {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length
      };
    } catch (error) {
      console.error('Failed to get task stats:', error);
      return { total: 0, completed: 0, pending: 0, in_progress: 0 };
    }
  },

  // Calendar
  async getCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
    try {
      // Use the correct API endpoint that the backend provides
      const events = await api.getCalendarEvents(from, to) || [];
      // Map API response to frontend interface, handling both task and event formats
      return events.map(event => ({
        id: parseInt(event.id) || Date.now(),
        title: event.title || '',
        description: event.description || '',
        start_at: event.start || event.start_at || event.due_at || '',
        end_at: event.end || event.end_at || event.due_at || '',
        location: event.location || '',
        attendees: event.attendees || [],
        created_at: event.createdAt || event.created_at || new Date().toISOString(),
        updated_at: event.updatedAt || event.updated_at || new Date().toISOString(),
        user_id: event.user_id || 1,
        task_id: event.task_id || undefined
      }));
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  },

  async createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      console.log('Enhanced API: Creating calendar event with data:', data);
      
      // Validate required fields
      if (!data.title || data.title.trim() === '') {
        throw new Error('Event title is required');
      }
      
      const result = await api.createCalendarEvent({
        title: data.title.trim(),
        description: data.description || '',
        start_at: data.start_at || '',
        end_at: data.end_at || data.start_at || '',
        location: data.location,
        attendees: data.attendees || []
      });
      
      console.log('Enhanced API: Calendar event created successfully:', result);
      return result;
    } catch (error) {
      console.error('Enhanced API createCalendarEvent error:', error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    // Calendar events are stored as tasks, so we need to map the fields properly
    return await api.updateCalendarEvent(id, {
      title: data.title,
      description: data.description,
      start_at: data.start_at,
      end_at: data.end_at
    });
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    return await api.deleteCalendarEvent(id);
  },

  // AI Features
  async summarizeText(text: string, style = 'concise'): Promise<{ summary: string }> {
    try {
      return await api.summarize(text, style);
    } catch (error) {
      console.error('Failed to summarize text:', error);
      return { summary: 'AI 요약 기능이 준비 중입니다.' };
    }
  },

  async extractTasks(text: string): Promise<{ tasks: any[]; created_ids: number[] }> {
    try {
      return await api.extractTasks(text);
    } catch (error) {
      console.error('Failed to extract tasks:', error);
      return { tasks: [], created_ids: [] };
    }
  },

  async getProductivityAnalysis(): Promise<{ insights: AIInsight[]; score: number; recommendations: string[] }> {
    try {
      // For now, create mock analysis based on existing data
      const tasks = await this.getTasks();
      const completed = tasks.filter(t => t.status === 'completed').length;
      const total = tasks.length;
      const score = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        insights: [
          {
            type: 'productivity',
            title: 'Task Completion Rate',
            description: `${completed}/${total} tasks completed`,
            score,
            data: { completed, total }
          }
        ],
        score,
        recommendations: ['Focus on completing pending tasks', 'Break down large tasks']
      };
    } catch (error) {
      console.error('Failed to get productivity analysis:', error);
      return { insights: [], score: 0, recommendations: [] };
    }
  },

  async getSmartSuggestions(): Promise<{ suggestions: any[] }> {
    try {
      // For now, create mock suggestions based on existing data
      const tasks = await this.getTasks();
      const pendingTasks = tasks.filter(t => t.status === 'pending');
      
      const suggestions = [
        {
          type: 'task',
          title: 'Complete pending tasks',
          description: `You have ${pendingTasks.length} pending tasks`,
          action: 'view_tasks'
        }
      ];
      
      return { suggestions };
    } catch (error) {
      console.error('Failed to get smart suggestions:', error);
      return { suggestions: [] };
    }
  },

  // Daily Brief
  async getDailyBrief(date?: string): Promise<DailyBrief> {
    try {
      const brief = await api.getDailyBrief();
      
      return {
        date: brief.date,
        top_tasks: brief.top_tasks || [],
        time_blocks: brief.time_blocks || [],
        recent_notes: brief.recent_notes || [],
        summary: brief.summary || '오늘의 일정과 작업을 확인하세요.',
        productivity_score: 85,
        insights: []
      };
    } catch (error) {
      console.error('Failed to get daily brief:', error);
      return {
        date: date || new Date().toISOString().split('T')[0],
        top_tasks: [],
        time_blocks: [],
        recent_notes: [],
        summary: '데이터를 불러올 수 없습니다.',
        productivity_score: 0,
        insights: []
      };
    }
  },

  async getWeeklyReview(): Promise<any> {
    try {
      const tasks = await api.listTasks();
      const notes = await api.listNotes();
      
      return {
        completed_tasks: tasks.filter(t => t.status === 'completed').length,
        total_tasks: tasks.length,
        notes_created: notes.length,
        productivity_trend: 'improving',
        insights: ['이번 주 생산성이 향상되었습니다.']
      };
    } catch (error) {
      console.error('Failed to get weekly review:', error);
      return { completed_tasks: 0, total_tasks: 0, notes_created: 0, productivity_trend: 'stable', insights: [] };
    }
  },

  // Search
  async search(query: string, filters?: any): Promise<{ results: any[]; total: number }> {
    try {
      const notes = await api.listNotes(query);
      const tasks = await api.listTasks();
      
      const filteredTasks = tasks.filter(task => 
        task.title.toLowerCase().includes(query.toLowerCase()) ||
        (task.content && task.content.toLowerCase().includes(query.toLowerCase()))
      );
      
      const results = [...notes, ...filteredTasks];
      return { results, total: results.length };
    } catch (error) {
      console.error('Failed to search:', error);
      return { results: [], total: 0 };
    }
  },

  // Analytics
  async getAnalytics(period?: string): Promise<any> {
    try {
      const tasks = await api.listTasks();
      const notes = await api.listNotes();
      
      return {
        tasks_completed: tasks.filter(t => t.status === 'completed').length,
        notes_created: notes.length,
        productivity_score: 85,
        trends: ['생산성 향상', '작업 완료율 증가']
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return { tasks_completed: 0, notes_created: 0, productivity_score: 0, trends: [] };
    }
  },

  // Time Blocking
  async suggestTimeBlocks(tasks: number[]): Promise<{ suggestions: any[] }> {
    return { suggestions: [] };
  },

  async applyTimeBlocks(blocks: any[]): Promise<{ created: any[] }> {
    return { created: [] };
  },

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const result = await api.healthCheck();
      return { 
        status: result.status, 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
};

export default enhancedAPI;
