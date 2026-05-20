/**
 * Application-wide constants shared across all packages.
 */

export const API_ROUTES = {
  AUTH: {
    CALLBACK: '/api/auth/callback',
  },
  FILES: {
    BASE: '/api/files',
    PRESIGNED: '/api/files/presigned',
    DOWNLOAD: '/api/files/download',
  },
  NOTES: '/api/notes',
  EVENTS: '/api/events',
  SHORTEN: '/api/shorten',
  TELEGRAPH: {
    UPLOAD: '/api/telegraph/upload',
  },
} as const;

export const R2_CONFIG = {
  /** Maximum file size in bytes (100 MB) */
  maxFileSize: 100 * 1024 * 1024,
  /** Allowed MIME types for file uploads */
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/xml',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ] as const,
} as const;

export const SHORTENER = {
  /** Length of generated short codes */
  codeLength: 6,
  /** Alphabet for generating short codes (URL-safe, no ambiguous characters) */
  alphabet: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
} as const;

export const TELEGRAPH_API_URL = 'https://telegra.ph';
