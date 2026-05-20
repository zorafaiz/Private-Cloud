/**
 * Indonesian relative date formatter.
 * Uses date-fns with Indonesian locale (`id`).
 */

import { format, differenceInMinutes, differenceInHours, isYesterday, differenceInCalendarDays } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format a date as relative time in Indonesian.
 *
 * Rules:
 * - &lt; 1 minute: "Baru saja"
 * - &lt; 60 minutes: "X menit yang lalu"
 * - &lt; 24 hours: "X jam yang lalu"
 * - Calendar yesterday: "Kemarin"
 * - &lt; 7 days: "X hari yang lalu"
 * - &lt; 30 days: "X minggu yang lalu"
 * - else: "dd MMM yyyy" with Indonesian month names
 */
export function formatRelativeDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) {
    return 'Tanggal tidak valid';
  }

  const now = new Date();

  const minutes = differenceInMinutes(now, dateObj);
  if (minutes < 1) {
    return 'Baru saja';
  }
  if (minutes < 60) {
    return `${minutes} menit yang lalu`;
  }

  const hours = differenceInHours(now, dateObj);
  if (hours < 24) {
    return `${hours} jam yang lalu`;
  }

  if (isYesterday(dateObj)) {
    return 'Kemarin';
  }

  const calendarDays = differenceInCalendarDays(now, dateObj);
  if (calendarDays < 7) {
    return `${calendarDays} hari yang lalu`;
  }

  if (calendarDays < 30) {
    const weeks = Math.floor(calendarDays / 7);
    return `${weeks} minggu yang lalu`;
  }

  return format(dateObj, 'dd MMM yyyy', { locale: id });
}

/**
 * Absolute date plus relative fragment (for detail subtitles).
 */
export function formatDateWithRelative(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(dateObj.getTime())) {
    return 'Tanggal tidak valid';
  }

  const fullDate = format(dateObj, 'dd MMM yyyy, HH:mm', { locale: id });
  const relative = formatRelativeDate(dateObj);

  return `${fullDate} · ${relative}`;
}

export function formatDateISO(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toISOString();
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? null : date;
}
