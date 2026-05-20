'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { createEventSchema, EVENT_COLOR_PALETTE } from '@private-cloud/shared';
import type { CalendarEvent } from '@private-cloud/shared';

export interface EventFormValues {
  title: string;
  event_date: string;
  description?: string;
  color: string;
}

interface EventDialogProps {
  event?: CalendarEvent;
  defaultDate?: string;
  onClose: () => void;
  onSave: (values: EventFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function EventDialog({
  event,
  defaultDate,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: EventDialogProps): React.ReactElement {
  const isEdit = Boolean(event?.id && !event.id.startsWith('temp-'));

  const [title, setTitle] = useState(event?.title ?? '');
  const [eventDate, setEventDate] = useState(event?.event_date ?? defaultDate ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [color, setColor] = useState(event?.color ?? EVENT_COLOR_PALETTE[1]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(event?.title ?? '');
    setEventDate(event?.event_date ?? defaultDate ?? '');
    setDescription(event?.description ?? '');
    setColor(event?.color ?? EVENT_COLOR_PALETTE[1]);
    setError(null);
  }, [event, defaultDate]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    const parsed = createEventSchema.safeParse({
      title: title.trim(),
      event_date: eventDate,
      description: description.trim() || undefined,
      color,
    });

    if (!parsed.success) {
      setError(parsed.error.errors.map((err) => err.message).join(', '));
      return;
    }

    try {
      await onSave({
        title: parsed.data.title,
        event_date: parsed.data.event_date,
        description: parsed.data.description,
        color: parsed.data.color,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!event?.id || !onDelete) {
      return;
    }
    if (!window.confirm(`Hapus acara "${event.title}"?`)) {
      return;
    }
    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-surface-700 bg-surface-900 p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="event-dialog-title" className="text-xl font-bold text-surface-100">
            {isEdit ? 'Edit Acara' : 'Tambah Acara'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-300">Judul</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nama acara"
              required
              maxLength={200}
              disabled={isSaving || isDeleting}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-surface-300">Tanggal</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
              disabled={isSaving || isDeleting}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-surface-300">
              Deskripsi (opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSaving || isDeleting}
              placeholder="Detail acara..."
              className="w-full resize-y rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-surface-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-surface-300">Warna</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLOR_PALETTE.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  title={hex}
                  onClick={() => setColor(hex)}
                  disabled={isSaving || isDeleting}
                  className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === hex ? 'border-white ring-2 ring-brand-500' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isDeleting}
              className="flex-1 rounded-lg border border-surface-600 px-4 py-2.5 font-medium text-surface-200 hover:bg-surface-800 disabled:opacity-50"
            >
              Batal
            </button>
          </div>

          {isEdit && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving || isDeleting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-600/40 bg-red-600/10 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-600/20 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Menghapus…' : 'Hapus Acara'}
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export default EventDialog;
