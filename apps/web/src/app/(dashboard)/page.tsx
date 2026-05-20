/**
 * Dashboard overview page with stats cards and quick actions.
 * Displays file count, notes count, events this month, and active short links.
 * Provides quick action buttons for common tasks.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  HardDrive,
  FileText,
  Calendar,
  Link2,
  ArrowRight,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalFiles: number;
  totalNotes: number;
  eventsThisMonth: number;
  activeShortLinks: number;
}

export default function DashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalNotes: 0,
    eventsThisMonth: 0,
    activeShortLinks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        setLoading(true);
        // Fetch only endpoints that exist
        const [filesRes, notesRes, eventsRes] = await Promise.all([
          fetch('/api/files'),
          fetch('/api/notes'),
          fetch(`/api/events?year=${new Date().getFullYear()}`),
        ]);

        // Parse responses and extract counts
        const filesData = await filesRes.json();
        const notesData = await notesRes.json();
        const eventsData = await eventsRes.json();

        // Properly extract array lengths from API responses
        setStats({
          totalFiles: Array.isArray(filesData.data) ? filesData.data.length : 0,
          totalNotes: Array.isArray(notesData.data) ? notesData.data.length : 0,
          eventsThisMonth: Array.isArray(eventsData.data)
            ? eventsData.data.filter(
                (e: { month: number }) => e.month === new Date().getMonth() + 1,
              ).length
            : 0,
          activeShortLinks: 0, // TODO: Implement GET /api/shorten endpoint
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        toast.error('Gagal memuat statistik');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    href,
  }: {
    icon: LucideIcon;
    label: string;
    value: number;
    href: string;
  }): React.ReactElement => (
    <a
      href={href}
      className="group rounded-xl border border-surface-800 bg-surface-900/50 p-6 transition-all hover:border-brand-600/50 hover:bg-surface-800/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-surface-400">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded bg-surface-700" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-surface-100">{value}</p>
          )}
        </div>
        <div className="rounded-lg bg-surface-800 p-3 text-brand-400 transition-colors group-hover:bg-brand-600/20">
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-surface-400 transition-colors group-hover:text-brand-400">
        <span>Lihat Detail</span>
        <ArrowRight size={14} />
      </div>
    </a>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-surface-100">Selamat Datang</h1>
        <p className="mt-2 text-surface-400">
          Kelola file, catatan, jadwal, dan alat Anda dari sini
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={HardDrive}
          label="Total File"
          value={stats.totalFiles}
          href="/dashboard/drive"
        />
        <StatCard
          icon={FileText}
          label="Total Catatan"
          value={stats.totalNotes}
          href="/dashboard/notes"
        />
        <StatCard
          icon={Calendar}
          label="Event Bulan Ini"
          value={stats.eventsThisMonth}
          href="/dashboard/schedule"
        />
        <StatCard
          icon={Link2}
          label="Link Aktif"
          value={stats.activeShortLinks}
          href="/dashboard/tools/shortener"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-surface-100">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="/dashboard/drive"
            className="group flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4 transition-all hover:border-brand-600/50 hover:bg-surface-800/50"
          >
            <div className="rounded-lg bg-surface-800 p-2 text-blue-400 transition-colors group-hover:bg-blue-600/20">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-100">Upload File</p>
              <p className="text-xs text-surface-400">Ke Cloud Drive</p>
            </div>
          </a>

          <a
            href="/dashboard/notes"
            className="group flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4 transition-all hover:border-brand-600/50 hover:bg-surface-800/50"
          >
            <div className="rounded-lg bg-surface-800 p-2 text-purple-400 transition-colors group-hover:bg-purple-600/20">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-100">
                Buat Catatan
              </p>
              <p className="text-xs text-surface-400">Catatan Baru</p>
            </div>
          </a>

          <a
            href="/dashboard/schedule"
            className="group flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4 transition-all hover:border-brand-600/50 hover:bg-surface-800/50"
          >
            <div className="rounded-lg bg-surface-800 p-2 text-green-400 transition-colors group-hover:bg-green-600/20">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-100">
                Jadwal Baru
              </p>
              <p className="text-xs text-surface-400">Event Tahunan</p>
            </div>
          </a>

          <a
            href="/dashboard/tools/shortener"
            className="group flex items-center gap-3 rounded-lg border border-surface-800 bg-surface-900/50 p-4 transition-all hover:border-brand-600/50 hover:bg-surface-800/50"
          >
            <div className="rounded-lg bg-surface-800 p-2 text-orange-400 transition-colors group-hover:bg-orange-600/20">
              <Plus size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-surface-100">Buat Links</p>
              <p className="text-xs text-surface-400">URL Pendek</p>
            </div>
          </a>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div>
        <h2 className="mb-4 text-xl font-bold text-surface-100">
          Aktivitas Terbaru
        </h2>
        <div className="rounded-xl border border-surface-800 bg-surface-900/50 p-8 text-center">
          <p className="text-surface-400">
            Belum ada aktivitas terbaru. Mulai dengan upload file atau buat catatan baru.
          </p>
        </div>
      </div>
    </div>
  );
}
