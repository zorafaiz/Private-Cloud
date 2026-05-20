/**
 * React Query hooks for calendar events.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post, put, deleteRequest } from '@/lib/api-client';
import { getYearRange } from '@/lib/calendar-utils';
import type { ApiResponse, CalendarEvent } from '@private-cloud/shared';
import toast from 'react-hot-toast';

export const eventsQueryKeys = {
  all: ['events'] as const,
  year: (year: number) => ['events', year] as const,
};

export function useEventsQuery(year: number, enabled = true) {
  const { start, end } = getYearRange(year);

  return useQuery({
    queryKey: eventsQueryKeys.year(year),
    queryFn: async ({ signal }) => {
      const response = await get<CalendarEvent[]>(
        `/api/events?start=${start}&end=${end}`,
        signal,
      );
      if (!response.success) {
        throw new Error(response.error || 'Gagal memuat acara');
      }
      return (response as ApiResponse<CalendarEvent[]>).data ?? [];
    },
    enabled,
  });
}

export function useCreateEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      event_date: string;
      description?: string;
      color?: string;
    }) => {
      const response = await post<CalendarEvent>('/api/events', payload);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal membuat acara');
      }
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKeys.year(year) });
      const previous = queryClient.getQueryData<CalendarEvent[]>(eventsQueryKeys.year(year));
      const optimistic: CalendarEvent = {
        id: `temp-${Date.now()}`,
        user_id: '',
        title: variables.title,
        event_date: variables.event_date,
        description: variables.description,
        color: variables.color ?? '#3b82f6',
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<CalendarEvent[]>(eventsQueryKeys.year(year), (old) =>
        [...(old ?? []), optimistic].sort((a, b) => a.event_date.localeCompare(b.event_date)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(eventsQueryKeys.year(year), ctx.previous);
      }
      toast.error('Gagal menyimpan acara');
    },
    onSuccess: (created) => {
      queryClient.setQueryData<CalendarEvent[]>(eventsQueryKeys.year(year), (old) => {
        const list = (old ?? []).filter((e) => !e.id.startsWith('temp-'));
        const exists = list.some((e) => e.id === created.id);
        const next = exists
          ? list.map((e) => (e.id === created.id ? created : e))
          : [...list, created];
        return next.sort((a, b) => a.event_date.localeCompare(b.event_date));
      });
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.year(year) });
      toast.success('Acara berhasil dibuat');
    },
  });
}

export function useUpdateEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      title?: string;
      event_date?: string;
      description?: string | null;
      color?: string;
    }) => {
      const { id, ...body } = payload;
      const response = await put<CalendarEvent>(`/api/events/${id}`, body);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memperbarui acara');
      }
      return response.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKeys.year(year) });
      const previous = queryClient.getQueryData<CalendarEvent[]>(eventsQueryKeys.year(year));
      queryClient.setQueryData<CalendarEvent[]>(eventsQueryKeys.year(year), (old) =>
        (old ?? [])
          .map((e) =>
            e.id === payload.id
              ? {
                  ...e,
                  ...(payload.title !== undefined ? { title: payload.title } : {}),
                  ...(payload.event_date !== undefined ? { event_date: payload.event_date } : {}),
                  ...(payload.description !== undefined
                    ? { description: payload.description ?? undefined }
                    : {}),
                  ...(payload.color !== undefined ? { color: payload.color } : {}),
                }
              : e,
          )
          .sort((a, b) => a.event_date.localeCompare(b.event_date)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(eventsQueryKeys.year(year), ctx.previous);
      }
      toast.error('Gagal memperbarui acara');
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<CalendarEvent[]>(eventsQueryKeys.year(year), (old) =>
        (old ?? [])
          .map((e) => (e.id === updated.id ? updated : e))
          .sort((a, b) => a.event_date.localeCompare(b.event_date)),
      );
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.year(year) });
      toast.success('Acara diperbarui');
    },
  });
}

export function useDeleteEvent(year: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await deleteRequest<null>(`/api/events/${id}`);
      if (!response.success) {
        throw new Error(response.error || 'Gagal menghapus acara');
      }
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: eventsQueryKeys.year(year) });
      const previous = queryClient.getQueryData<CalendarEvent[]>(eventsQueryKeys.year(year));
      queryClient.setQueryData<CalendarEvent[]>(
        eventsQueryKeys.year(year),
        (old) => (old ?? []).filter((e) => e.id !== id),
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(eventsQueryKeys.year(year), ctx.previous);
      }
      toast.error('Gagal menghapus acara');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.year(year) });
      toast.success('Acara dihapus');
    },
  });
}
