'use client';

import React, { useMemo } from 'react';
import type { CalendarEvent } from '@private-cloud/shared';
import {
  getMonthGrid,
  getEventsForDay,
  isToday,
  isWeekend,
  formatMonthName,
  toDateString,
  INDONESIAN_DAY_ABBREVS,
} from '@/lib/calendar-utils';

interface MonthGridProps {
  year: number;
  month: number;
  events: CalendarEvent[];
  compact?: boolean;
  focusedDate?: string | null;
  onDayClick?: (date: string) => void;
  onMonthHeaderClick?: (month: number) => void;
  onDayFocus?: (date: string) => void;
}

const MAX_DOTS = 3;

export function MonthGrid({
  year,
  month,
  events,
  compact = true,
  focusedDate = null,
  onDayClick,
  onMonthHeaderClick,
  onDayFocus,
}: MonthGridProps): React.ReactElement {
  const weeks = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <div
      className={`schedule-month transition-opacity duration-300 ${
        compact ? 'rounded-lg border border-surface-800 bg-surface-900/40 p-2' : 'p-3'
      }`}
    >
      <button
        type="button"
        onClick={() => onMonthHeaderClick?.(month)}
        className={`mb-2 w-full text-left font-semibold text-surface-200 transition-colors hover:text-brand-400 ${
          compact ? 'text-xs' : 'text-base'
        }`}
      >
        {formatMonthName(month)}
      </button>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {INDONESIAN_DAY_ABBREVS.map((label) => (
          <div
            key={label}
            className={`text-center font-medium text-surface-500 ${compact ? 'text-[9px]' : 'text-xs'}`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weeks.flat().map((date, idx) => {
          if (!date) {
            return <div key={`pad-${idx}`} className={compact ? 'h-7' : 'h-10'} />;
          }

          const dateStr = toDateString(date);
          const dayEvents = getEventsForDay(events, date);
          const visible = dayEvents.slice(0, MAX_DOTS);
          const overflow = dayEvents.length - MAX_DOTS;
          const today = isToday(date);
          const weekend = isWeekend(date);
          const focused = focusedDate === dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              tabIndex={0}
              onClick={() => {
                onDayFocus?.(dateStr);
                onDayClick?.(dateStr);
              }}
              onFocus={() => onDayFocus?.(dateStr)}
              className={`group relative flex flex-col items-center rounded transition-colors ${
                compact ? 'min-h-[1.75rem] px-0.5 py-0.5' : 'min-h-[2.5rem] px-1 py-1'
              } ${weekend ? 'bg-surface-800/30' : ''} ${
                focused ? 'ring-2 ring-brand-500 ring-offset-1 ring-offset-surface-900' : ''
              } hover:bg-surface-800/80`}
              aria-label={`${date.getDate()} ${formatMonthName(month)}, ${dayEvents.length} acara`}
            >
              <span
                className={`flex items-center justify-center rounded-full font-medium ${
                  compact ? 'h-5 w-5 text-[10px]' : 'h-7 w-7 text-sm'
                } ${
                  today
                    ? 'animate-pulse bg-brand-600 font-bold text-white ring-2 ring-brand-400'
                    : 'text-surface-300'
                }`}
              >
                {date.getDate()}
              </span>

              {dayEvents.length > 0 ? (
                <div className="mt-0.5 flex max-w-full flex-wrap items-center justify-center gap-px">
                  {visible.map((ev) => (
                    <span
                      key={ev.id}
                      title={ev.title}
                      className={`inline-block rounded-full ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
                      style={{ backgroundColor: ev.color }}
                    />
                  ))}
                  {overflow > 0 ? (
                    <span
                      className={`text-surface-500 ${compact ? 'text-[8px]' : 'text-[10px]'}`}
                      title={dayEvents
                        .slice(MAX_DOTS)
                        .map((e) => e.title)
                        .join(', ')}
                    >
                      +{overflow}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MonthGrid;
