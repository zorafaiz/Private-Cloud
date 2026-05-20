/**
 * File actions dropdown menu component.
 * Provides download, rename, and delete options with confirmation dialogs.
 */

'use client';

import { useState } from 'react';
import { MoreVertical, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FileActionsProps {
  fileId: string;
  filename: string;
  r2Key: string;
  onDelete: (fileId: string) => Promise<void>;
  onDownload: (r2Key: string, filename: string) => Promise<void>;
}

export function FileActions({
  fileId,
  filename,
  r2Key,
  onDelete,
  onDownload,
}: FileActionsProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDownload = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await onDownload(r2Key, filename);
      setIsOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunduh file';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await onDelete(fileId);
      setShowDeleteConfirm(false);
      setIsOpen(false);
      toast.success('File berhasil dihapus');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus file';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="rounded p-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-50"
        aria-label="File actions"
      >
        <MoreVertical size={18} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-surface-700 bg-surface-800 py-1 shadow-lg">
          <button
            onClick={handleDownload}
            disabled={isLoading}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-300 transition-colors hover:bg-surface-700 hover:text-surface-100 disabled:opacity-50"
          >
            <Download size={16} />
            Unduh
          </button>

          <div className="my-1 border-t border-surface-700" />

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-900/20 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-surface-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-surface-100">Hapus file?</h3>
            <p className="mt-2 text-sm text-surface-400">
              Apakah Anda yakin ingin menghapus <span className="font-medium">{filename}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="flex-1 rounded bg-surface-700 px-3 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-600 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close menu when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
