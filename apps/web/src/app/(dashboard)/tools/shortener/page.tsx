'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  Link2,
  Loader2,
  Trash2,
  QrCode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { post, get } from '@/lib/api-client';
import type { ApiResponse, ShortenResult } from '@private-cloud/shared';
import {
  loadRecentLinks,
  saveRecentLink,
  removeRecentLink,
  updateRecentLinkClicks,
  type StoredShortLink,
} from '@/lib/shortener-storage';

function truncateUrl(url: string, max = 48): string {
  return url.length > max ? `${url.slice(0, max)}…` : url;
}

export default function ShortenerPage(): React.ReactElement {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<StoredShortLink[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refreshStats = useCallback(async (code: string) => {
    try {
      const response = await get<{ code: string; clicks: number; url: string }>(
        `/api/shorten/stats/${encodeURIComponent(code)}`,
      );
      if (response.success && response.data) {
        setRecent(updateRecentLinkClicks(code, response.data.clicks));
      }
    } catch {
      // ignore stats errors for MVP
    }
  }, []);

  useEffect(() => {
    const items = loadRecentLinks();
    setRecent(items);
    items.forEach((item) => {
      void refreshStats(item.code);
    });
  }, [refreshStats]);

  const handleShorten = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setCopied(false);
    setShowQr(false);

    try {
      const payload: { url: string; customCode?: string } = {
        url: url.trim(),
      };
      if (customCode.trim()) {
        payload.customCode = customCode.trim();
      }

      const response = await post<ShortenResult>('/api/shorten', payload);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memendekkan URL');
      }

      setResult(response.data);
      const stored: StoredShortLink = {
        code: response.data.code,
        url: response.data.url,
        shortUrl: response.data.shortUrl,
        created_at: response.data.created_at ?? new Date().toISOString(),
        clicks: response.data.clicks ?? 0,
      };
      setRecent(saveRecentLink(stored));
      toast.success('URL berhasil dipendekkan!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal memendekkan URL';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, code?: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      if (code) {
        setCopiedCode(code);
        window.setTimeout(() => setCopiedCode(null), 2000);
      } else {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
      toast.success('Disalin ke clipboard');
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  const handleDeleteRecent = (code: string): void => {
    setRecent(removeRecentLink(code));
    if (result?.code === code) {
      setResult(null);
    }
    toast.success('Dihapus dari daftar');
  };

  const qrImageUrl = result
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(result.shortUrl)}`
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-surface-100">
          <Link2 className="text-brand-500" />
          Pemendek URL
        </h1>
        <p className="mt-2 text-surface-400">
          Buat tautan pendek untuk dibagikan — redirect via Cloudflare Worker
        </p>
      </div>

      <div className="glass-card max-w-2xl">
        <form onSubmit={handleShorten} className="space-y-4">
          <div>
            <label htmlFor="url-input" className="mb-1.5 block text-sm font-medium text-surface-300">
              URL panjang
            </label>
            <input
              id="url-input"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://contoh.com/halaman-yang-sangat-panjang"
              required
              disabled={isLoading}
              className="input-field"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <label htmlFor="custom-code" className="text-sm font-medium text-surface-300">
                Kode kustom (opsional)
              </label>
              <span
                className="text-surface-500"
                title="Biarkan kosong untuk kode acak 6 karakter"
              >
                <HelpCircle size={14} />
              </span>
            </div>
            <input
              id="custom-code"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              placeholder="kodeKustom"
              minLength={4}
              maxLength={12}
              disabled={isLoading}
              className="input-field font-mono"
            />
            <p className="mt-1 text-xs text-surface-500">
              Biarkan kosong untuk kode acak · 4–12 karakter alfanumerik
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses…
              </>
            ) : (
              'Pendekkan'
            )}
          </button>
        </form>
      </div>

      {result ? (
        <div className="glass-card max-w-2xl space-y-4 border-brand-600/30">
          <h2 className="text-lg font-semibold text-surface-100">Hasil</h2>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              readOnly
              value={result.shortUrl}
              className="input-field flex-1 font-mono text-sm text-brand-300"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(result.shortUrl)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Tersalin' : 'Salin'}
              </button>
              <a
                href={result.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary no-underline inline-flex items-center gap-2"
              >
                <ExternalLink size={16} />
                Coba
              </a>
            </div>
          </div>

          <p className="text-xs text-surface-500">
            Asli: <span className="text-surface-400">{truncateUrl(result.url, 80)}</span>
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300"
            >
              <QrCode size={16} />
              {showQr ? 'Sembunyikan QR' : 'Tampilkan QR'}
            </button>
          </div>

          {showQr && qrImageUrl ? (
            <div className="inline-block rounded-lg border border-surface-700 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrImageUrl} alt={`QR ${result.shortUrl}`} width={180} height={180} />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="max-w-3xl">
        <h2 className="mb-4 text-lg font-semibold text-surface-200">Tautan terbaru</h2>

        {recent.length === 0 ? (
          <p className="text-sm text-surface-500">
            Belum ada tautan. Hasil pemendekan akan muncul di sini (disimpan di perangkat Anda).
          </p>
        ) : (
          <ul className="space-y-3">
            {recent.map((item) => (
              <li
                key={item.code}
                className="group flex flex-col gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm text-brand-300">{item.shortUrl}</p>
                  <p className="mt-1 truncate text-xs text-surface-500" title={item.url}>
                    {truncateUrl(item.url)}
                  </p>
                  <p className="mt-1 text-xs text-surface-600">
                    {item.clicks} kunjungan ·{' '}
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.shortUrl, item.code)}
                    className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-sm"
                  >
                    {copiedCode === item.code ? <Check size={14} /> : <Copy size={14} />}
                    Salin
                  </button>
                  <a
                    href={item.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost no-underline inline-flex items-center gap-1 px-3 py-1.5 text-sm"
                  >
                    <ExternalLink size={14} />
                    Buka
                  </a>
                  <button
                    type="button"
                    onClick={() => refreshStats(item.code)}
                    className="btn-ghost px-3 py-1.5 text-sm text-surface-400"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteRecent(item.code)}
                    className="rounded-lg p-2 text-red-400 opacity-100 transition-colors hover:bg-red-600/20 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Hapus dari daftar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
