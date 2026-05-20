/**
 * Note card component displaying a single note.
 * Shows title, content preview, date, and action buttons.
 */

'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/format-date';
import type { Note } from '@private-cloud/shared';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void | Promise<void>;
}

/**
 * Strip markdown symbols from text for preview.
 * @param text - Text with markdown
 * @returns Plain text without markdown symbols
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, '') // Remove headings
    .replace(/\*{1,2}(.+?)\*{1,2}/g, '$1') // Remove bold/italic
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links
    .replace(/^[-*+]\s/gm, '') // Remove list markers
    .trim();
}

/**
 * Truncate text to a maximum length with ellipsis.
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number = 150): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
}): React.ReactElement => {
  const [isHovering, setIsHovering] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await onDelete(note.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const preview = truncateText(stripMarkdown(note.content || 'Tidak ada isi'), 150);

  return (
    <>
      <div
        className="group relative flex h-full flex-col rounded-lg border border-surface-800 bg-surface-900/50 p-4 transition-all hover:border-brand-600/50 hover:bg-surface-800/50 hover:shadow-lg hover:shadow-brand-500/10"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Title */}
        <h3 className="truncate text-lg font-semibold text-surface-100">
          {note.title || 'Untitled'}
        </h3>

        {/* Content preview */}
        <p className="mt-2 flex-1 line-clamp-3 text-sm text-surface-400">
          {preview || 'Tidak ada isi'}
        </p>

        {/* Date */}
        <p className="mt-3 text-xs text-surface-500">
          {formatRelativeDate(note.updated_at)}
        </p>

        {/* Action buttons - visible on hover */}
        {isHovering && (
          <div className="absolute right-4 top-4 flex gap-2 opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(note)}
              className="rounded-lg bg-blue-600/20 p-2 text-blue-400 transition-colors hover:bg-blue-600/30"
              title="Edit catatan"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg bg-red-600/20 p-2 text-red-400 transition-colors hover:bg-red-600/30"
              title="Hapus catatan"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg border border-surface-700 bg-surface-900 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-surface-100">
              Hapus catatan?
            </h3>
            <p className="mt-2 text-sm text-surface-400">
              "{note.title || 'Untitled'}" akan dihapus secara permanen.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-surface-700 px-4 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCard;
