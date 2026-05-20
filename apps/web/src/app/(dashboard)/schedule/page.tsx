'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
} from 'lucide-react';
import { MonthGrid } from '@/components/schedule/month-grid';
import { EventList } from '@/components/schedule/event-list';
import { EventDialog, type EventFormValues } from '@/components/schedule/event-dialog';
import {
  useEventsQuery,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/hooks/use-events';
import {
  addDays,
  formatMonthName,
  getEventsForDay,
  parseDateOnly,
  toDateString,
} from '@/lib/calendar-utils';
import type { CalendarEvent } from '@private-cloud/shared';

type ViewMode = 'grid' | 'list';

interface DialogState {
  open: boolean;
  event?: CalendarEvent;
  defaultDate?: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 5 + i);

export default function SchedulePage(): React.ReactElement {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [zoomMonth, setZoomMonth] = useState<number | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [focusedDate, setFocusedDate] = useState<string | null>(null);

  const { data: events = [], isLoading, error, refetch } = useEventsQuery(year);
  const createMutation = useCreateEvent(year);
  const updateMutation = useUpdateEvent(year);
  const deleteMutation = useDeleteEvent(year);

  const openCreate = useCallback((dateStr?: string) => {
    setDialog({ open: true, defaultDate: dateStr ?? toDateString(new Date()) });
  }, []);

  const openEdit = useCallback((event: CalendarEvent) => {
    setDialog({ open: true, event });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ open: false });
  }, []);

  const handleSave = async (values: EventFormValues): Promise<void> => {
    if (dialog.event?.id && !dialog.event.id.startsWith('temp-')) {
      await updateMutation.mutateAsync({
        id: dialog.event.id,
        title: values.title,
        event_date: values.event_date,
        description: values.description ?? null,
        color: values.color,
      });
    } else {
      await createMutation.mutateAsync(values);
    }
    closeDialog();
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteMutation.mutateAsync(id);
    closeDialog();
  };

  const handleDayClick = useCallback(
    (dateStr: string): void => {
      const dayEvents = getEventsForDay(events, dateStr);
      if (dayEvents.length === 1) {
        openEdit(dayEvents[0]);
      } else {
        openCreate(dateStr);
      }
    },
    [events, openCreate, openEdit],
  );

  const yearEvents = useMemo(
    () => events.filter((e) => parseDateOnly(e.event_date).getFullYear() === year),
    [events, year],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!focusedDate || dialog.open) {
        return;
      }
      const target = document.activeElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }

      const current = parseDateOnly(focusedDate);
      let next = current;
      if (e.key === 'ArrowLeft') {
        next = addDays(current, -1);
      } else if (e.key === 'ArrowRight') {
        next = addDays(current, 1);
      } else if (e.key === 'ArrowUp') {
        next = addDays(current, -7);
      } else if (e.key === 'ArrowDown') {
        next = addDays(current, 7);
      } else if (e.key === 'Enter') {
        handleDayClick(focusedDate);
        return;
      } else {
        return;
      }

      e.preventDefault();
      if (next.getFullYear() !== year) {
        setYear(next.getFullYear());
      }
      setFocusedDate(toDateString(next));
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusedDate, dialog.open, year, events, handleDayClick]);

  const monthsToRender =
    zoomMonth !== null ? [zoomMonth] : Array.from({ length: 12 }, (_, m) => m);

  return (
    <div className="schedule-page space-y-6 print:text-black">
      <header className="flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-surface-100">
            <CalendarDays className="text-brand-500" />
            Jadwal Tahunan
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-700 bg-surface-900/60">
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              className="rounded-l-lg p-2 text-surface-300 hover:bg-surface-800"
              aria-label="Tahun sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border-0 bg-transparent px-2 py-2 text-sm font-semibold text-surface-100 focus:ring-0"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              className="rounded-r-lg p-2 text-surface-300 hover:bg-surface-800"
              aria-label="Tahun berikutnya"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex rounded-lg border border-surface-700 p-0.5">
            <button
              type="button"
              onClick={() => {
                setViewMode('grid');
                setZoomMonth(null);
              }}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
                viewMode === 'grid'
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <LayoutGrid size={16} />
              Grid Tahunan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              <List size={16} />
              Daftar
            </button>
          </div>

          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            <Plus size={18} />
            Tambah Event
          </button>
        </div>
      </header>

      {zoomMonth !== null ? (
        <div className="print:hidden">
          <button
            type="button"
            onClick={() => setZoomMonth(null)}
            className="mb-3 text-sm text-brand-400 hover:underline"
          >
            ← Kembali ke tampilan tahunan
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print:hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-lg border border-surface-800 bg-surface-900/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-600/30 bg-red-600/10 p-8 text-center print:hidden">
          <p className="text-red-400">Gagal memuat jadwal</p>
          <p className="mt-2 text-sm text-red-400/80">
            {error instanceof Error ? error.message : 'Terjadi kesalahan'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-lg border border-red-600/40 px-4 py-2 text-sm text-red-300 hover:bg-red-600/10"
          >
            Coba Lagi
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div
          className={`grid gap-3 transition-all duration-300 print:grid-cols-3 print:gap-2 ${
            zoomMonth !== null
              ? 'max-w-md mx-auto grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}
        >
          {monthsToRender.map((month) => (
            <MonthGrid
              key={month}
              year={year}
              month={month}
              events={yearEvents}
              compact={zoomMonth === null}
              focusedDate={focusedDate}
              onDayClick={handleDayClick}
              onMonthHeaderClick={(m) => setZoomMonth(m)}
              onDayFocus={setFocusedDate}
            />
          ))}
        </div>
      ) : (
        <EventList
          events={yearEvents}
          year={year}
          onEventClick={openEdit}
          onDelete={(id) => {
            if (window.confirm('Hapus acara ini?')) {
              deleteMutation.mutate(id);
            }
          }}
          deletingId={deleteMutation.isPending ? deleteMutation.variables : null}
        />
      )}

      {focusedDate && viewMode === 'grid' ? (
        <p className="text-center text-xs text-surface-500 print:hidden">
          Navigasi: panah keyboard · Enter untuk buka/edit · Fokus: {focusedDate}
        </p>
      ) : null}

      {dialog.open ? (
        <EventDialog
          event={dialog.event}
          defaultDate={dialog.defaultDate}
          onClose={closeDialog}
          onSave={handleSave}
          onDelete={dialog.event ? handleDelete : undefined}
          isSaving={createMutation.isPending || updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      ) : null}

      <div className="hidden print:block">
        <h2 className="mb-4 text-xl font-bold">
          Jadwal {year} — {yearEvents.length} acara
        </h2>
        {Array.from({ length: 12 }, (_, month) => {
          const monthEvents = yearEvents.filter(
            (e) => parseDateOnly(e.event_date).getMonth() === month,
          );
          if (monthEvents.length === 0) {
            return null;
          }
          return (
            <div key={month} className="mb-4 break-inside-avoid">
              <h3 className="font-semibold">{formatMonthName(month)}</h3>
              <ul className="ml-4 list-disc text-sm">
                {monthEvents.map((ev) => (
                  <li key={ev.id}>
                    {ev.event_date}: {ev.title}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
