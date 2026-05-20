'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { CalendarEvent } from '@private-cloud/shared';
import { formatMonthName, groupEventsByMonth, formatDayChip } from '@/lib/calendar-utils';

interface EventListProps {
  events: CalendarEvent[];
  year: number;
  onEventClick: (event: CalendarEvent) => void;
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

function truncate(text: string | undefined, max: number): string {
  if (!text) {
    return '';
  }
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function EventList({
  events,
  year,
  onEventClick,
  onDelete,
  deletingId = null,
}: EventListProps): React.ReactElement {
  const grouped = useMemo(() => groupEventsByMonth(events, year), [events, year]);
  const [swipeId, setSwipeId] = useState<string | null>(null);
  const touchStartX = useRef(0);

  return (
    <div className="schedule-list space-y-8">
      {Array.from({ length: 12 }, (_, month) => {
        const monthEvents = grouped.get(month) ?? [];
        return (
          <section key={month} className="rounded-lg border border-surface-800 bg-surface-900/30 p-4">
            <div className="mb-4 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-surface-100">{formatMonthName(month)}</h3>
              <span className="badge">{monthEvents.length}</span>
            </div>

            {monthEvents.length === 0 ? (
              <p className="text-sm text-surface-500">Tidak ada event di bulan ini</p>
            ) : (
              <ul className="space-y-2">
                {monthEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className={`group relative overflow-hidden rounded-lg border border-surface-800 bg-surface-900/60 transition-transform ${
                      swipeId === ev.id ? '-translate-x-16' : ''
                    }`}
                    onTouchStart={(e) => {
                      touchStartX.current = e.touches[0].clientX;
                    }}
                    onTouchEnd={(e) => {
                      const delta = touchStartX.current - e.changedTouches[0].clientX;
                      if (delta > 60) {
                        setSwipeId(ev.id);
                      } else if (delta < -30) {
                        setSwipeId(null);
                      }
                    }}
                  >
                    <div
                      className="flex cursor-pointer items-stretch gap-3 p-3 pl-4 transition-colors hover:bg-surface-800/50"
                      style={{ borderLeftWidth: 4, borderLeftColor: ev.color }}
                      onClick={() => onEventClick(ev)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onEventClick(ev);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex shrink-0 flex-col items-center justify-center rounded-md bg-surface-800 px-2 py-1 text-center">
                        <span className="text-xs font-bold text-surface-100">
                          {formatDayChip(ev.event_date).split(' ')[0]}
                        </span>
                        <span className="text-[10px] uppercase text-surface-500">
                          {formatDayChip(ev.event_date).split(' ')[1]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-surface-100">{ev.title}</p>
                        {ev.description ? (
                          <p className="mt-0.5 text-sm text-surface-400">
                            {truncate(ev.description, 120)}
                          </p>
                        ) : null}
                      </div>
                      <div className="hidden shrink-0 items-center gap-1 sm:flex">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(ev);
                          }}
                          className="rounded p-2 text-surface-400 opacity-0 transition-opacity hover:bg-surface-700 hover:text-brand-400 group-hover:opacity-100"
                          aria-label="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(ev.id);
                          }}
                          disabled={deletingId === ev.id}
                          className="rounded p-2 text-surface-400 opacity-0 transition-opacity hover:bg-red-600/20 hover:text-red-400 group-hover:opacity-100 disabled:opacity-50"
                          aria-label="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {swipeId === ev.id ? (
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-full w-16 items-center justify-center bg-red-600 text-white sm:hidden"
                        onClick={() => onDelete(ev.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default EventList;
