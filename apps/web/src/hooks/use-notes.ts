/**
 * Custom React Query hooks for notes management.
 * Query keys: ['notes'], ['notes', search, sort], ['note', id]
 */

import React, { useEffect, useState } from 'react';
import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { get, post, put, deleteRequest } from '@/lib/api-client';
import type { Note, ApiResponse, PaginatedResponse } from '@private-cloud/shared';
import toast from 'react-hot-toast';

const PER_PAGE = 20;

export const notesQueryKeys = {
  all: ['notes'] as const,
  list: (search: string, sort: string) => ['notes', search, sort] as const,
  note: (id: string) => ['note', id] as const,
};

type NotesInfiniteData = InfiniteData<PaginatedResponse<Note>, number>;

/**
 * Infinite list of notes (search + sort); pages map to ?page=.
 */
export function useNotesInfiniteQuery(search: string, sort: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: notesQueryKeys.list(search, sort),
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const page = typeof pageParam === 'number' ? pageParam : 1;
      const response = await get<Note[]>(
        `/api/notes?search=${encodeURIComponent(search)}&page=${page}&per_page=${PER_PAGE}&sort=${encodeURIComponent(sort)}`,
        signal,
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch notes');
      }

      return response as PaginatedResponse<Note>;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.success || !lastPage.data) {
        return undefined;
      }
      const loaded = lastPage.page * lastPage.per_page;
      if (loaded < lastPage.total) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled,
  });
}

/**
 * Single note by id.
 */
export function useNoteQuery(id?: string) {
  return useQuery({
    queryKey: id ? notesQueryKeys.note(id) : ['note', ''],
    queryFn: async ({ signal }) => {
      if (!id) {
        throw new Error('Note ID is required');
      }
      const response = await get<Note>(`/api/notes/${id}`, signal);
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch note');
      }
      return (response as ApiResponse<Note>).data as Note;
    },
    enabled: !!id,
  });
}

function replaceNoteInInfiniteData(
  old: NotesInfiniteData | undefined,
  id: string,
  next: Note,
): NotesInfiniteData | undefined {
  if (!old?.pages) {
    return old;
  }
  return {
    ...old,
    pages: old.pages.map((page) => {
      if (!page.data) {
        return page;
      }
      return {
        ...page,
        data: page.data.map((n) => (n.id === id ? next : n)),
      };
    }),
  };
}

function removeNoteFromInfiniteData(
  old: NotesInfiniteData | undefined,
  id: string,
): NotesInfiniteData | undefined {
  if (!old?.pages) {
    return old;
  }
  return {
    ...old,
    pages: old.pages.map((page) => {
      if (!page.data) {
        return page;
      }
      const filtered = page.data.filter((n) => n.id !== id);
      const removed = page.data.length - filtered.length;
      return {
        ...page,
        data: filtered,
        total: Math.max(0, (page.total ?? 0) - removed),
      };
    }),
  };
}

function prependNoteToFirstPage(
  old: NotesInfiniteData | undefined,
  note: Note,
): NotesInfiniteData | undefined {
  if (!old?.pages?.length) {
    return old;
  }
  const [first, ...rest] = old.pages;
  const firstData = first.data ?? [];
  return {
    ...old,
    pages: [
      {
        ...first,
        data: [note, ...firstData],
        total: (first.total ?? 0) + 1,
      },
      ...rest,
    ],
  };
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { title: string; content?: string }) => {
      const response = await post<Note>('/api/notes', {
        title: data.title,
        content: data.content ?? '',
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create note');
      }

      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: notesQueryKeys.all });
      const tempId = `temp-${Date.now()}`;
      const optimistic: Note = {
        id: tempId,
        user_id: '',
        title: variables.title,
        content: variables.content ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const snapshots = queryClient.getQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all });

      queryClient.setQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all }, (old) =>
        prependNoteToFirstPage(old, optimistic),
      );

      return { snapshots, tempId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
      toast.error('Gagal menyimpan catatan');
    },
    onSuccess: (created, _vars, ctx) => {
      if (ctx?.tempId) {
        queryClient.setQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all }, (old) => {
          if (!old?.pages) {
            return old;
          }
          return {
            ...old,
            pages: old.pages.map((page, idx) => {
              if (idx !== 0 || !page.data) {
                return page;
              }
              return {
                ...page,
                data: page.data.map((n) => (n.id === ctx.tempId ? created : n)),
              };
            }),
          };
        });
      }
      queryClient.setQueryData(notesQueryKeys.note(created.id), created);
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all });
      toast.success('Catatan berhasil dibuat!');
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string; title?: string; content?: string }) => {
      const body: Record<string, string> = {};
      if (payload.title !== undefined) {
        body.title = payload.title;
      }
      if (payload.content !== undefined) {
        body.content = payload.content;
      }

      const response = await put<Note>(`/api/notes/${payload.id}`, body);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to update note');
      }

      return response.data;
    },
    onMutate: async (payload) => {
      const { id, title, content } = payload;
      await queryClient.cancelQueries({ queryKey: notesQueryKeys.all });
      await queryClient.cancelQueries({ queryKey: notesQueryKeys.note(id) });

      const previousNote = queryClient.getQueryData<Note>(notesQueryKeys.note(id));
      const snapshots = queryClient.getQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all });

      const optimistic: Note | null =
        previousNote != null
          ? {
              ...previousNote,
              ...(title !== undefined ? { title } : {}),
              ...(content !== undefined ? { content } : {}),
              updated_at: new Date().toISOString(),
            }
          : null;

      if (optimistic) {
        queryClient.setQueryData(notesQueryKeys.note(id), optimistic);
        queryClient.setQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all }, (old) =>
          replaceNoteInInfiniteData(old, id, optimistic),
        );
      }

      return { snapshots, previousNote, id };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots) {
          queryClient.setQueryData(key, data);
        }
      }
      if (ctx?.previousNote) {
        queryClient.setQueryData(notesQueryKeys.note(ctx.id), ctx.previousNote);
      }
      toast.error('Gagal memperbarui catatan');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(notesQueryKeys.note(updated.id), updated);
      queryClient.setQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all }, (old) =>
        replaceNoteInInfiniteData(old, updated.id, updated),
      );
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all });
      toast.success('Catatan berhasil diperbarui!');
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteRequest<null>(`/api/notes/${id}`);

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete note');
      }

      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: notesQueryKeys.note(id) });
      queryClient.setQueriesData<NotesInfiniteData>({ queryKey: notesQueryKeys.all }, (old) =>
        removeNoteFromInfiniteData(old, id),
      );
      queryClient.invalidateQueries({ queryKey: notesQueryKeys.all });
      toast.success('Catatan berhasil dihapus!');
    },
    onError: () => {
      toast.error('Gagal menghapus catatan');
    },
  });
}

/**
 * Online / offline status from the browser.
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
