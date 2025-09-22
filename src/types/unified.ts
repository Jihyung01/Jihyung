// Unified type definitions that maintain backward compatibility

// Base types that work with both API versions
export interface BaseNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  // Enhanced API fields (optional for backward compatibility)
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  version?: number;
  is_archived?: boolean;
  is_pinned?: boolean;
  content_type?: string;
  word_count?: number;
  collaborators?: string[];
  isEncrypted?: boolean;
  // Additional fields from original interface
  folder?: string;
  wordCount?: number;
  type?: "note" | "idea" | "project" | "meeting" | "personal";
  color?: string;
  starred?: boolean;
  pinned?: boolean;
}

export interface BaseTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  // Enhanced API fields (optional for backward compatibility)
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  energy?: 'low' | 'medium' | 'high';
  subtasks?: BaseTask[];
  dependencies?: string[];
  assignee?: string;
}

export interface BaseCalendarEvent {
  id: string;
  title: string;
  description?: string;
  // Support both naming conventions
  startDate?: string;
  endDate?: string;
  start_at?: string;
  end_at?: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  reminders?: { time: number; type: 'popup' | 'email' }[];
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
  // Enhanced API fields
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

// Type conversion utilities
export const convertToEnhancedNote = (note: BaseNote): BaseNote => ({
  ...note,
  created_at: note.created_at || note.createdAt || new Date().toISOString(),
  updated_at: note.updated_at || note.updatedAt || new Date().toISOString(),
  user_id: note.user_id || 'default-user',
  version: note.version || 1,
  is_archived: note.is_archived || false,
  is_pinned: note.is_pinned || note.pinned || false,
  content_type: note.content_type || 'text',
  word_count: note.word_count || note.wordCount || note.content.split(' ').length,
});

export const convertToEnhancedTask = (task: BaseTask): BaseTask => ({
  ...task,
  created_at: task.created_at || task.createdAt || new Date().toISOString(),
  updated_at: task.updated_at || task.updatedAt || new Date().toISOString(),
  user_id: task.user_id || 'default-user',
  energy: task.energy || 'medium',
});

export const convertToEnhancedEvent = (event: BaseCalendarEvent): BaseCalendarEvent => ({
  ...event,
  start_at: event.start_at || event.startDate || new Date().toISOString(),
  end_at: event.end_at || event.endDate || new Date().toISOString(),
  created_at: event.created_at || event.createdAt || new Date().toISOString(),
  updated_at: event.updated_at || event.updatedAt || new Date().toISOString(),
  user_id: event.user_id || 'default-user',
});

// Type aliases for backward compatibility
export type Note = BaseNote;
export type Task = BaseTask;
export type CalendarEvent = BaseCalendarEvent;

// Component props interfaces
export interface SmartAIAssistantProps {
  notes: Note[];
  tasks: Task[];
  events: CalendarEvent[];
  onNoteCreated?: (note: Note) => void;
  onTaskCreated?: (task: Task) => void;
  onEventCreated?: (event: CalendarEvent) => void;
  // Optional props to maintain backward compatibility
  mode?: "gpt4" | "gpt4-mini";
  privacyMode?: boolean;
}

export interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoteCreated: (note: Note) => Promise<void>;
  onTasksCreated: (tasks: Task[]) => void;
  // Optional props
  quantumEnabled?: boolean;
}

export interface AutoSchedulerProps {
  tasks: Task[];
  events: CalendarEvent[];
  onSchedule: (scheduledTasks: Task[]) => void;
}

// Training data interface for AI features
export interface TrainingData {
  input: string;
  output: string;
  context?: string;
  // Remove epochs property as it doesn't belong here
}

// Voice command interfaces
export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface VoiceCommand {
  phrase: string;
  action: () => void;
  description: string;
  category: string;
}