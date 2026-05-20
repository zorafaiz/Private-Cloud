/**
 * Dashboard layout with sidebar navigation and auth protection.
 * Redirects to login if user is not authenticated.
 * Provides persistent sidebar with user menu and logout.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppProviders } from '@/components/providers';
import {
  Home,
  HardDrive,
  FileText,
  Calendar,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
          router.push('/login');
          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email || 'Unknown',
        });
      } catch (err) {
        console.error('Auth check failed:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async (): Promise<void> => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success('Logout berhasil');
      router.push('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal logout';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-700 border-t-brand-500" />
          </div>
          <p className="text-sm text-surface-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <></>;
  }

  const navItems = [
    { label: 'Dasbor', href: '/dashboard', icon: Home },
    { label: 'Cloud Drive', href: '/dashboard/drive', icon: HardDrive },
    { label: 'Catatan', href: '/dashboard/notes', icon: FileText },
    { label: 'Jadwal Tahunan', href: '/dashboard/schedule', icon: Calendar },
  ];

  const toolItems = [
    { label: 'Pemendek URL', href: '/dashboard/tools/shortener' },
    { label: 'Telegraph Upload', href: '/dashboard/tools/telegraph' },
  ];

  return (
    <AppProviders>
    <div className="flex min-h-screen bg-surface-950">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-64 border-r border-surface-800 bg-surface-950/80 backdrop-blur-xl transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-surface-800 px-6">
            <div className="rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 p-2">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-gradient">Private Cloud</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-100"
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}

            <div className="my-3 border-t border-surface-800" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
              Alat
            </p>

            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-100"
            >
              <span>Alat Lainnya</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {toolsOpen && (
              <div className="ml-3 space-y-1">
                {toolItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm text-surface-400 transition-colors hover:bg-surface-800 hover:text-surface-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </nav>

          {/* User section */}
          <div className="border-t border-surface-800 p-4">
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-surface-800/50 p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-surface-100">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600/20 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-surface-800 p-2 text-surface-200 transition-colors hover:bg-surface-700 lg:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="w-full lg:ml-64">
        <div className="p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
    </AppProviders>
  );
}
