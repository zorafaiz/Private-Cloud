/**
 * Note detail page for viewing, editing, and managing a single note.
 * Includes markdown rendering and full note content.
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useNoteQuery, useUpdateNote, useDeleteNote } from '@/hooks/use-notes';
import { formatDateWithRelative } from '@/lib/format-date';
import NoteEditor from '@/components/notes/note-editor';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import type { Note } from '@private-cloud/shared';

export default function NoteDetailPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch note
  const { data: note, isLoading, error } = useNoteQuery(noteId);

  // Mutations
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  // Handle update
  const handleUpdate = async (data: { title: string; content: string }): Promise<void> => {
    await updateMutation.mutateAsync({ id: noteId, ...data });
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(noteId);
      toast.success('Catatan berhasil dihapus');
      router.push('/dashboard/notes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus catatan';
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-surface-400 transition-colors hover:text-surface-200"
          >
            <ArrowLeft size={20} />
            Kembali
          </button>
        </div>
        <div className="space-y-4">
          <div className="h-10 w-3/4 animate-pulse rounded bg-surface-700" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-surface-700" />
          <div className="mt-8 space-y-3">
            <div className="h-3 w-full animate-pulse rounded bg-surface-700" />
            <div className="h-3 w-full animate-pulse rounded bg-surface-700" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-surface-700" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !note) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-surface-400 transition-colors hover:text-surface-200"
        >
          <ArrowLeft size={20} />
          Kembali
        </button>
        <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-8 text-center">
          <p className="text-red-400">Catatan tidak ditemukan</p>
          <button
            onClick={() => router.push('/dashboard/notes')}
            className="mt-4 rounded-lg border border-red-600/30 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-600/10"
          >
            Kembali ke Daftar Catatan
          </button>
        </div>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setIsEditing(false)}
          className="flex items-center gap-2 text-surface-400 transition-colors hover:text-surface-200"
        >
          <ArrowLeft size={20} />
          Batal
        </button>
        <div className="rounded-lg border border-surface-700 bg-surface-900/50 p-6">
          <NoteEditor
            initialData={note}
            onSave={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={updateMutation.isPending}
          />
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/notes')}
          className="flex items-center gap-2 text-surface-400 transition-colors hover:text-surface-200"
        >
          <ArrowLeft size={20} />
          Kembali ke Catatan
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-surface-700 px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800"
          >
            <Pencil size={16} />
            Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      </div>

      {/* Note content */}
      <div className="space-y-4 rounded-lg border border-surface-800 bg-surface-900/50 p-6">
        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-surface-100">{note.title}</h1>
          <p className="mt-2 text-sm text-surface-500">
            {formatDateWithRelative(note.updated_at)}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-surface-800" />

        {/* Markdown content */}
        <div className="prose prose-invert max-w-none text-surface-300">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="mb-4 mt-6 text-3xl font-bold text-surface-100" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="mb-3 mt-5 text-2xl font-bold text-surface-100" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="mb-2 mt-4 text-xl font-bold text-surface-100" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="mb-4 text-surface-300" {...props} />
              ),
              strong: ({ node, ...props }) => (
                <strong className="font-bold text-surface-100" {...props} />
              ),
              em: ({ node, ...props }) => (
                <em className="italic text-surface-300" {...props} />
              ),
              ul: ({ node, ...props }) => (
                <ul className="mb-4 list-inside list-disc space-y-2 text-surface-300" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="mb-4 list-inside list-decimal space-y-2 text-surface-300" {...props} />
              ),
              li: ({ node, ...props }) => <li className="text-surface-300" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="mb-4 border-l-4 border-brand-600 bg-surface-800/50 py-2 pl-4 italic text-surface-400"
                  {...props}
                />
              ),
              code: ({ node, ...props }) => (
                <code
                  className="rounded bg-surface-800 px-2 py-1 font-mono text-sm text-surface-300"
                  {...props}
                />
              ),
              pre: ({ node, ...props }) => (
                <pre
                  className="mb-4 overflow-x-auto rounded-lg bg-surface-800 p-4"
                  {...props}
                />
              ),
            }}
          >
            {note.content || 'Tidak ada isi'}
          </ReactMarkdown>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-lg border border-surface-700 bg-surface-900 p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-surface-100">
              Hapus catatan ini?
            </h3>
            <p className="mt-2 text-sm text-surface-400">
              Catatan "{note.title}" akan dihapus secara permanen dan tidak dapat dipulihkan.
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
                {isDeleting ? 'Menghapus...' : 'Hapus Selamanya'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
