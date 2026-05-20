/**
 * localStorage persistence for recent shortened links (MVP list).
 */

export interface StoredShortLink {
  code: string;
  url: string;
  shortUrl: string;
  created_at: string;
  clicks: number;
}

const STORAGE_KEY = 'private-cloud-shortener-recent';
const MAX_ITEMS = 50;

export function loadRecentLinks(): StoredShortLink[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as StoredShortLink[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentLink(link: StoredShortLink): StoredShortLink[] {
  const existing = loadRecentLinks().filter((item) => item.code !== link.code);
  const next = [link, ...existing].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeRecentLink(code: string): StoredShortLink[] {
  const next = loadRecentLinks().filter((item) => item.code !== code);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function updateRecentLinkClicks(code: string, clicks: number): StoredShortLink[] {
  const next = loadRecentLinks().map((item) =>
    item.code === code ? { ...item, clicks } : item,
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
