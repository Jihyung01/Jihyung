// Enhanced API Client for Real Functionality
import * as client from '../api/client-fixed';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  version: number;
  is_archived: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  energy: number;
  due_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  parent_id?: string;
  note_id?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string;
  attendees?: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  task_id?: string;
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
      const notes = await client.listNotes(query, tags) || [];
      return notes.map(note => ({
        id: String(note.id) || String(Date.now()),
        title: note.title || '',
        content: note.content || '',
        tags: note.tags || [],
        created_at: note.createdAt || note.created_at || new Date().toISOString(),
        updated_at: note.updatedAt || note.updated_at || new Date().toISOString(),
        user_id: String(note.user_id) || '1',
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
      if (!data.title || data.title.trim() === '') {
        throw new Error('Note title is required');
      }
      
      const result = await client.createNote({
        title: data.title.trim(),
        content: data.content || '',
        tags: data.tags || []
      });
      
      return result;
    } catch (error) {
      console.error('Enhanced API createNote error:', error);
      throw new Error(`Failed to create note: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateNote(id: string, data: Partial<Note>): Promise<Note> {
    return await client.updateNote(id, {
      title: data.title,
      content: data.content,
      tags: data.tags
    });
  },

  async deleteNote(id: string): Promise<void> {
    return await client.deleteNote(id);
  },

  // Tasks
  async getTasks(from?: string, to?: string, status?: string): Promise<Task[]> {
    try {
      const tasks = await client.listTasks(from, to) || [];
      const mappedTasks = tasks.map(task => ({
        id: String(task.id) || String(Date.now()),
        title: task.title || '',
        description: task.description || '',
        status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled' || 'pending',
        priority: task.priority as 'low' | 'medium' | 'high' || 'medium',
        energy: task.energy_level === 'high' ? 80 : task.energy_level === 'low' ? 30 : 50,
        due_at: task.due_at || task.due_date || undefined,
        completed_at: task.completed_at || undefined,
        created_at: task.createdAt || task.created_at || new Date().toISOString(),
        updated_at: task.updatedAt || task.updated_at || new Date().toISOString(),
        user_id: String(task.user_id) || '1',
        parent_id: task.parent_task_id ? String(task.parent_task_id) : undefined,
        note_id: task.note_id ? String(task.note_id) : undefined
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

  async createTask(data: Partial<Task>): Promise<Task> {
    try {
      if (!data.title || data.title.trim() === '') {
        throw new Error('Task title is required');
      }
      
      const result = await client.createTask({
        title: data.title.trim(),
        priority: data.priority || 'medium',
        due_at: data.due_at,
        energy: data.energy
      });
      
      return result;
    } catch (error) {
      console.error('Enhanced API createTask error:', error);
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    try {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.due_at !== undefined) updateData.due_at = data.due_at;
      if (data.energy !== undefined) updateData.energy = data.energy;
      
      const result = await client.updateTask(id, updateData);
      return result;
    } catch (error) {
      console.error('Enhanced API updateTask error:', error);
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async deleteTask(id: string): Promise<void> {
    return await client.deleteTask(id);
  },

  // Calendar
  async getCalendarEvents(from: string, to: string): Promise<CalendarEvent[]> {
    try {
      const events = await client.getCalendarEvents(from, to) || [];
      return events.map(event => ({
        id: String(event.id) || String(Date.now()),
        title: event.title || '',
        description: event.description || '',
        start_at: event.start || event.start_at || event.due_at || '',
        end_at: event.end || event.end_at || event.due_at || '',
        location: event.location || '',
        attendees: event.attendees || [],
        created_at: event.createdAt || event.created_at || new Date().toISOString(),
        updated_at: event.updatedAt || event.updated_at || new Date().toISOString(),
        user_id: String(event.user_id) || '1',
        task_id: event.task_id ? String(event.task_id) : undefined
      }));
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  },

  async createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    try {
      if (!data.title || data.title.trim() === '') {
        throw new Error('Event title is required');
      }
      
      const result = await client.createCalendarEvent({
        title: data.title.trim(),
        description: data.description || '',
        start: data.start_at || '',
        end: data.end_at || data.start_at || ''
      });
      
      return result;
    } catch (error) {
      console.error('Enhanced API createCalendarEvent error:', error);
      throw new Error(`Failed to create calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  async updateCalendarEvent(id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return await client.updateCalendarEvent(id, {
      title: data.title,
      description: data.description,
      start_at: data.start_at,
      end_at: data.end_at
    });
  },

  async deleteCalendarEvent(id: string): Promise<void> {
    return await client.deleteCalendarEvent(id);
  },

  // AI Features
  async summarizeText(text: string, style = 'concise'): Promise<{ summary: string }> {
    try {
      return await client.summarize(text, style);
    } catch (error) {
      console.error('Failed to summarize text:', error);
      return { summary: 'AI 요약 기능이 준비 중입니다.' };
    }
  },

  async extractTasks(text: string): Promise<{ tasks: any[]; created_ids: number[] }> {
    try {
      return await client.extractTasks(text);
    } catch (error) {
      console.error('Failed to extract tasks:', error);
      return { tasks: [], created_ids: [] };
    }
  },

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      const result = await client.healthCheck();
      return { 
        status: result.status, 
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  }
};

// Export individual functions for convenience
export const {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  summarizeText,
  extractTasks,
  healthCheck
} = enhancedAPI;

// Also export as default for backward compatibility
export default enhancedAPI;
