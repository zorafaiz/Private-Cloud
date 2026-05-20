/**
 * Calendar helpers for the annual schedule UI.
 */

import type { CalendarEvent } from '@private-cloud/shared';

export const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const INDONESIAN_DAY_ABBREVS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'] as const;

/** Monday = 0 … Sunday = 6 */
export function getMondayBasedWeekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Six-week grid (7 columns), Monday-first. `null` = padding cell.
 */
export function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const leading = getMondayBasedWeekday(firstDay);
  const daysInMonth = getDaysInMonth(year, month);
  const cells: (Date | null)[] = [];

  for (let i = 0; i < leading; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }
  while (cells.length < 42) {
    cells.push(null);
  }

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

export function isSameDay(a: Date | string, b: Date | string): boolean {
  const da = typeof a === 'string' ? parseDateOnly(a) : a;
  const db = typeof b === 'string' ? parseDateOnly(b) : b;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getEventsForDay(events: CalendarEvent[], date: Date | string): CalendarEvent[] {
  const target = typeof date === 'string' ? parseDateOnly(date) : date;
  return events.filter((ev) => isSameDay(ev.event_date, target));
}

export function formatMonthName(month: number, locale = 'id'): string {
  if (locale === 'id' && month >= 0 && month < 12) {
    return INDONESIAN_MONTH_NAMES[month];
  }
  return new Date(2000, month, 1).toLocaleString(locale, { month: 'long' });
}

export function formatDayChip(dateStr: string): string {
  const d = parseDateOnly(dateStr);
  return `${d.getDate()} ${INDONESIAN_MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

export function groupEventsByMonth(
  events: CalendarEvent[],
  year: number,
): Map<number, CalendarEvent[]> {
  const map = new Map<number, CalendarEvent[]>();
  for (let m = 0; m < 12; m += 1) {
    map.set(m, []);
  }
  for (const ev of events) {
    const d = parseDateOnly(ev.event_date);
    if (d.getFullYear() !== year) {
      continue;
    }
    const month = d.getMonth();
    map.get(month)?.push(ev);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.event_date.localeCompare(b.event_date));
  }
  return map;
}

export function addDays(date: Date, delta: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + delta);
  return next;
}

export function getYearRange(year: number): { start: string; end: string } {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}
