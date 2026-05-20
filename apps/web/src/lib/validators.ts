/**
 * Zod validation schemas for API request/response validation.
 * These are web-specific schemas; shared schemas live in @private-cloud/shared.
 */

import { z } from 'zod';

/** Schema for requesting a presigned upload URL */
export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, 'Nama file tidak boleh kosong'),
  contentType: z.string().min(1, 'Tipe konten tidak boleh kosong'),
  size: z
    .number()
    .positive('Ukuran file harus lebih dari 0')
    .max(100 * 1024 * 1024, 'Ukuran file maksimal 100MB'),
});

/** Schema for creating a note */
export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Judul tidak boleh kosong')
    .max(200, 'Judul maksimal 200 karakter'),
  content: z.string(),
});

/** Schema for updating a note */
export const updateNoteSchema = z.object({
  id: z.string().uuid('ID catatan tidak valid'),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
});

/** Re-export from shared package */
export {
  createEventSchema,
  updateEventSchema,
  EVENT_COLOR_PALETTE,
} from '@private-cloud/shared';

/** Schema for shortening a URL */
export const shortenUrlSchema = z.object({
  url: z.string().url('URL tidak valid'),
  customCode: z
    .string()
    .regex(/^[a-zA-Z0-9]{4,12}$/, 'Kode harus alfanumerik, 4-12 karakter')
    .optional(),
});

/** Schema for Telegraph image upload (validated server-side from FormData) */
export const telegraphUploadSchema = z.object({
  image: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'Ukuran gambar maksimal 5MB')
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
      'Hanya file gambar yang diperbolehkan (JPEG, PNG, GIF, WebP)',
    ),
});

/** Type exports */
export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type { CalendarEventInput as CreateEventInput, CalendarEventUpdateInput as UpdateEventInput } from '@private-cloud/shared';
export type ShortenUrlInput = z.infer<typeof shortenUrlSchema>;
export type TelegraphUploadInput = z.infer<typeof telegraphUploadSchema>;
