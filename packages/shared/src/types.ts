/**
 * Core domain types for the Private Cloud platform.
 * All database-facing interfaces use snake_case to match PostgreSQL conventions.
 */

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface FileMetadata {
  id: string;
  user_id: string;
  filename: string;
  r2_key: string;
  size_bytes: number;
  mime_type: string;
  uploaded_at: string;
}

export interface ShortLink {
  code: string;
  url: string;
  created_at: string;
  clicks?: number;
}

export interface ShortenResult {
  shortUrl: string;
  code: string;
  url: string;
  clicks?: number;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated list: `data` is the current page of items. */
export interface PaginatedResponse<Item> extends ApiResponse<Item[]> {
  page: number;
  per_page: number;
  total: number;
}
