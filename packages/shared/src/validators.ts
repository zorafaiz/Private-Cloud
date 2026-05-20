/**
 * Shared Zod validation schemas used across the platform.
 */

import { z } from 'zod';

/** Create note body (POST /api/notes). */
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').max(200, 'Judul maksimal 200 karakter'),
  content: z.string(),
});

/** @deprecated Use createNoteSchema */
export const noteCreateSchema = createNoteSchema;

/** Partial update body (PUT /api/notes/[id]); at least one field required. */
export const updateNoteSchema = z
  .object({
    title: z.string().min(1, 'Judul tidak boleh kosong').max(200, 'Judul maksimal 200 karakter').optional(),
    content: z.string().optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'Sertakan judul atau isi untuk memperbarui catatan',
  });

/** @deprecated Use updateNoteSchema */
export const noteUpdateSchema = updateNoteSchema;

/** Allowed event accent colors (hex). */
export const EVENT_COLOR_PALETTE = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#f97316', // orange
  '#ec4899', // pink
  '#eab308', // yellow
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#f43f5e', // rose
  '#84cc16', // lime
  '#06b6d4', // cyan
] as const;

const eventDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

const eventColorSchema = z
  .string()
  .refine(
    (value) => (EVENT_COLOR_PALETTE as readonly string[]).includes(value),
    'Warna tidak ada dalam palet yang diizinkan',
  );

/** Create event body (POST /api/events). */
export const createEventSchema = z.object({
  title: z.string().min(1, 'Judul acara tidak boleh kosong').max(200, 'Judul maksimal 200 karakter'),
  event_date: eventDateSchema,
  description: z.string().max(2000).optional(),
  color: eventColorSchema.optional().default('#3b82f6'),
});

/** Partial update body (PUT /api/events/[id]). */
export const updateEventSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    event_date: eventDateSchema.optional(),
    description: z.string().max(2000).nullable().optional(),
    color: eventColorSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.event_date !== undefined ||
      data.description !== undefined ||
      data.color !== undefined,
    { message: 'Sertakan setidaknya satu field untuk memperbarui acara' },
  );

/** @deprecated Use createEventSchema */
export const calendarEventSchema = createEventSchema;

export const shortenUrlSchema = z.object({
  url: z.string().url('URL tidak valid'),
  customCode: z
    .string()
    .regex(/^[a-zA-Z0-9]{4,12}$/, 'Kode harus alfanumerik, 4-12 karakter')
    .optional(),
});

export const presignedUrlRequestSchema = z.object({
  filename: z.string().min(1, 'Nama file tidak boleh kosong'),
  contentType: z.string().min(1, 'Tipe konten tidak boleh kosong'),
  size: z.number().positive('Ukuran file harus lebih dari 0'),
});

/** Type exports inferred from schemas */
export type NoteCreateInput = z.infer<typeof createNoteSchema>;
export type NoteUpdateInput = z.infer<typeof updateNoteSchema>;
export type CalendarEventInput = z.infer<typeof createEventSchema>;
export type CalendarEventUpdateInput = z.infer<typeof updateEventSchema>;
export type ShortenUrlInput = z.infer<typeof shortenUrlSchema>;
export type PresignedUrlRequestInput = z.infer<typeof presignedUrlRequestSchema>;
