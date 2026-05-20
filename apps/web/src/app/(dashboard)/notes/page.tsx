/**
 * Notes page: Main interface for managing text notes.
 * Search (debounced), sort, infinite "Load more", create / edit modals, delete confirm.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, X } from 'lucide-react';
import {
  useNotesInfiniteQuery,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useIsOnline,
} from '@/hooks/use-notes';
import NoteCard from '@/components/notes/note-card';
import NoteEditor from '@/components/notes/note-editor';
import type { Note } from '@private-cloud/shared';

function NoteSkeleton(): React.ReactElement {
  return (
    <div className="space-y-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4">
      <div className="h-5 w-[75%] animate-pulse rounded bg-surface-700" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-surface-700" />
        <div className="h-3 w-[83%] animate-pulse rounded bg-surface-700" />
      </div>
      <div className="h-3 w-1/4 animate-pulse rounded bg-surface-700" />
    </div>
  );
}

type SortOption = 'updated_at.desc' | 'updated_at.asc' | 'title.asc' | 'title.desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updated_at.desc', label: 'Terbaru' },
  { value: 'updated_at.asc', label: 'Terlama' },
  { value: 'title.asc', label: 'A-Z' },
  { value: 'title.desc', label: 'Z-A' },
];

export default function NotesPage(): React.ReactElement {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('updated_at.desc');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isOnline = useIsOnline();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
  } = useNotesInfiniteQuery(debouncedSearch, sort, isOnline);

  const notes = useMemo(
    () => data?.pages.flatMap((p) => (p.success && p.data ? p.data : [])) ?? [],
    [data],
  );

  const totalListed = data?.pages[0]?.total ?? 0;

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();
  const deleteMutation = useDeleteNote();

  const handleCreate = async (payload: { title: string; content: string }): Promise<void> => {
    await createMutation.mutateAsync(payload);
    setShowCreateModal(false);
  };

  const handleEdit = (note: Note): void => {
    setEditingNote(note);
  };

  const handleUpdate = async (payload: { title: string; content: string }): Promise<void> => {
    if (!editingNote) {
      return;
    }
    await updateMutation.mutateAsync({
      id: editingNote.id,
      title: payload.title,
      content: payload.content,
    });
    setEditingNote(null);
  };

  const handleDeleteConfirm = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  const clearSearch = (): void => {
    setSearchTerm('');
    setDebouncedSearch('');
  };

  const isSearching = debouncedSearch.length > 0;
  const hasNotes = notes.length > 0;
  const isInitialLoading = isLoading && !data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-100">Catatan</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus size={20} />
          Buat Catatan
        </button>
      </div>

      {!isOnline && (
        <div className="rounded-lg border border-yellow-600/30 bg-yellow-600/10 px-4 py-3 text-sm text-yellow-200">
          Anda sedang offline. Perubahan mungkin gagal disimpan sampai koneksi kembali.
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full rounded-lg border border-surface-800 bg-surface-900/50 py-2.5 pl-10 pr-10 text-surface-100 placeholder-surface-500 transition-colors focus:border-brand-600 focus:outline-none"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 transition-colors hover:text-surface-300"
                aria-label="Hapus pencarian"
              >
                <X size={18} />
              </button>
            ) : null}
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="rounded-lg border border-surface-800 bg-surface-900/50 px-4 py-2.5 text-surface-100 transition-colors focus:border-brand-600 focus:outline-none md:w-56"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {isSearching ? (
          <p className="text-sm text-surface-400">
            Menampilkan hasil untuk &apos;{debouncedSearch}&apos;
            {typeof totalListed === 'number' ? ` (${totalListed} catatan)` : ''}
          </p>
        ) : null}
      </div>

      <div>
        {isInitialLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <NoteSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-8 text-center">
            <p className="text-red-400">Gagal memuat catatan</p>
            <p className="mt-2 text-sm text-red-400/80">
              {error instanceof Error ? error.message : 'Terjadi kesalahan'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg border border-red-600/40 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-600/10"
            >
              Coba Lagi
            </button>
          </div>
        ) : !hasNotes ? (
          <div className="rounded-lg border border-dashed border-surface-700 p-12 text-center">
            <p className="text-lg font-medium text-surface-300">
              {isSearching ? 'Tidak ada hasil' : 'Belum ada catatan. Mulai tulis sesuatu!'}
            </p>
            {!isSearching ? (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-6 rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
              >
                Buat Catatan
              </button>
            ) : (
              <p className="mt-2 text-surface-500">Coba kata kunci lain atau kosongkan pencarian.</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={handleEdit}
                  onDelete={handleDeleteConfirm}
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage || isFetching}
                  className="rounded-lg border border-surface-700 bg-surface-900/60 px-6 py-2.5 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800 disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Memuat…' : 'Muat lebih banyak'}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-surface-700 bg-surface-900 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-surface-100">Buat Catatan Baru</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <NoteEditor
              onSave={handleCreate}
              onCancel={() => setShowCreateModal(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </div>
      ) : null}

      {editingNote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-surface-700 bg-surface-900 p-6 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-xl font-bold text-surface-100">Edit Catatan</h2>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="rounded p-1 text-surface-400 hover:bg-surface-800 hover:text-surface-200"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            <NoteEditor
              key={editingNote.id}
              initialData={editingNote}
              onSave={handleUpdate}
              onCancel={() => setEditingNote(null)}
              isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      ) : null}

      <p className="text-center text-xs text-surface-600">
        Tip: buka detail catatan untuk pratinjau markdown penuh —{' '}
        <Link href="/dashboard/notes" className="text-brand-400 hover:underline">
          daftar ini
        </Link>
        .
      </p>
    </div>
  );
}
