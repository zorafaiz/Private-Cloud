/**
 * Web app-specific type definitions.
 * Shared types live in @private-cloud/shared.
 */

// Re-export shared types for convenience
export type {
  Note,
  CalendarEvent,
  FileMetadata,
  ShortLink,
  ApiResponse,
  PaginatedResponse,
} from '@private-cloud/shared';

// Web-specific types

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export interface UINotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface FileUploadProgress {
  fileId: string;
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface DashboardStats {
  totalFiles: number;
  totalNotes: number;
  totalEvents: number;
  storageUsedBytes: number;
}

export interface NoteFilters {
  search?: string;
  sortBy?: 'created' | 'updated' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface EventFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface FileFilters {
  search?: string;
  mimeType?: string;
  sortBy?: 'name' | 'size' | 'date';
  sortOrder?: 'asc' | 'desc';
}
