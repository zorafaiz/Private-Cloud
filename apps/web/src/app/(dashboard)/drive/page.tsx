/**
 * Cloud Drive page - Complete file management interface.
 * Features: Upload, download, delete, pagination, and progress tracking.
 */

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download, Grid3x3, List } from 'lucide-react';
import { apiClient, apiClientFormData } from '@/lib/api-client';
import { UploadDialog } from '@/components/upload-dialog';
import { FileActions } from '@/components/file-actions';
import { FileIconComponent } from '@/components/file-icon';
import type { FileMetadata, PaginatedResponse } from '@private-cloud/shared';

type ViewMode = 'grid' | 'list';

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileId: string;
}

/**
 * Formats bytes to human-readable file size.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

/**
 * Formats a date to local string.
 */
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export default function DrivePage(): React.ReactElement {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 20;
  const queryClient = useQueryClient();

  // Fetch files
  const { data: filesData, isLoading, error, refetch } = useQuery({
    queryKey: ['files', currentPage, perPage],
    queryFn: async () => {
      const response = await apiClient<FileMetadata[]>(
        `/api/files?page=${currentPage}&per_page=${perPage}`,
      );
      if (!response.success) {
        throw new Error(response.error || 'Gagal mengambil file');
      }
      return response as PaginatedResponse<FileMetadata>;
    },
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await apiClient(
        `/api/files?id=${fileId}`,
        { method: 'DELETE' },
      );
      if (!response.success) {
        throw new Error(response.error || 'Gagal menghapus file');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });

  // Download file
  const handleDownload = useCallback(
    async (r2Key: string, filename: string) => {
      try {
        const response = await apiClient<{ downloadUrl: string }>(
          `/api/files/download?key=${encodeURIComponent(r2Key)}`,
        );
        if (!response.success) {
          throw new Error(response.error || 'Gagal membuat URL unduhan');
        }
        const { downloadUrl } = response.data || {};
        if (!downloadUrl) {
          throw new Error('URL unduhan tidak valid');
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengunduh file';
        throw new Error(message);
      }
    },
    [],
  );

  // Upload file with progress tracking
  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploadProgress(0);

        // Step 1: Get presigned URL
        const presignedResponse = await apiClient<PresignedUrlResponse>(
          '/api/files/presigned',
          {
            method: 'POST',
            body: {
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
              size: file.size,
            },
          },
        );

        if (!presignedResponse.success) {
          throw new Error(presignedResponse.error || 'Gagal membuat URL presigned');
        }

        const { uploadUrl } = presignedResponse.data || {};
        if (!uploadUrl) {
          throw new Error('URL presigned tidak valid');
        }

        setUploadProgress(20);

        // Step 2: Upload file directly to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 80) + 20;
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Upload was cancelled'));
          });

          xhr.open('PUT', uploadUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.send(file);
        });

        setUploadProgress(100);

        // Invalidate and refetch
        await queryClient.invalidateQueries({ queryKey: ['files'] });
        setUploadProgress(0);
      } catch (err) {
        setUploadProgress(0);
        const message = err instanceof Error ? err.message : 'Gagal mengunggah file';
        throw new Error(message);
      }
    },
    [queryClient],
  );

  // Memoize file list to avoid unnecessary re-renders
  const files = useMemo(() => filesData?.data || [], [filesData?.data]);
  const totalFiles = useMemo(() => filesData?.total || 0, [filesData?.total]);
  const totalPages = useMemo(() => Math.ceil(totalFiles / perPage), [totalFiles]);

  // Calculate total storage
  const totalStorage = useMemo(
    () => files.reduce((sum, file) => sum + file.size_bytes, 0),
    [files],
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-surface-50">Cloud Drive</h1>
          <p className="mt-1 text-sm text-surface-400">
            {totalFiles === 0
              ? 'Belum ada file. Mulai dengan mengunggah file pertama kamu.'
              : `${totalFiles} file(s) • ${formatFileSize(totalStorage)} digunakan`}
          </p>
        </div>
        <button
          onClick={() => setUploadDialogOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          Unggah File
        </button>
      </div>

      {/* View mode toggle */}
      {files.length > 0 && (
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded px-3 py-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            }`}
          >
            <Grid3x3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded px-3 py-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-600 text-white'
                : 'bg-surface-700 text-surface-300 hover:bg-surface-600'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card animate-pulse p-4">
              <div className="mb-4 h-12 w-12 rounded bg-surface-700" />
              <div className="mb-2 h-4 w-3/4 rounded bg-surface-700" />
              <div className="h-3 w-1/2 rounded bg-surface-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card flex min-h-[300px] flex-col items-center justify-center text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 text-lg font-semibold text-surface-300">
            Gagal memuat file
          </h2>
          <p className="mt-2 text-sm text-surface-500">
            {error instanceof Error ? error.message : 'Terjadi kesalahan'}
          </p>
          <button
            onClick={() => refetch()}
            className="btn-primary mt-4"
          >
            Coba Lagi
          </button>
        </div>
      ) : files.length === 0 ? (
        /* Empty state */
        <div className="glass-card flex min-h-[400px] flex-col items-center justify-center text-center">
          <div className="text-6xl">☁️</div>
          <h2 className="mt-4 text-lg font-semibold text-surface-300">
            Belum ada file
          </h2>
          <p className="mt-2 text-sm text-surface-500">
            Unggah file pertama Anda untuk memulai cloud drive
          </p>
          <button
            onClick={() => setUploadDialogOpen(true)}
            className="btn-primary mt-6"
          >
            Unggah File Pertama
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid view */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {files.map((file) => (
            <div
              key={file.id}
              className="glass-card group relative overflow-hidden p-4 transition-all hover:border-surface-600 hover:shadow-lg"
            >
              {/* File icon */}
              <div className="mb-3 flex items-center text-4xl">
                <FileIconComponent mimeType={file.mime_type} size="lg" />
              </div>

              {/* File info */}
              <p className="truncate text-sm font-medium text-surface-100">
                {file.filename}
              </p>
              <p className="truncate text-xs text-surface-500">
                {formatFileSize(file.size_bytes)}
              </p>
              <p className="mt-1 truncate text-xs text-surface-600">
                {formatDate(file.uploaded_at)}
              </p>

              {/* Hover actions */}
              <div className="mt-3 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleDownload(file.r2_key, file.filename)}
                  className="flex-1 rounded bg-brand-600/20 px-2 py-1.5 text-xs font-medium text-brand-300 transition-colors hover:bg-brand-600/30"
                  title="Unduh file"
                >
                  <Download size={14} className="mx-auto" />
                </button>
                <div className="flex-1">
                  <FileActions
                    fileId={file.id}
                    filename={file.filename}
                    r2Key={file.r2_key}
                    onDelete={async (id) => {
                      await deleteFileMutation.mutateAsync(id);
                    }}
                    onDownload={handleDownload}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700 bg-surface-900/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Nama File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Ukuran
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Tanggal Unggah
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-surface-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.id}
                  className="border-t border-surface-700 transition-colors hover:bg-surface-700/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIconComponent mimeType={file.mime_type} size="sm" />
                      <span className="truncate text-sm font-medium text-surface-200">
                        {file.filename}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">
                    {formatFileSize(file.size_bytes)}
                  </td>
                  <td className="px-4 py-3 text-sm text-surface-400">
                    {formatDate(file.uploaded_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(file.r2_key, file.filename)}
                        className="rounded p-1.5 text-surface-400 transition-colors hover:bg-surface-700 hover:text-brand-400"
                        title="Unduh file"
                      >
                        <Download size={16} />
                      </button>
                      <FileActions
                        fileId={file.id}
                        filename={file.filename}
                        r2Key={file.r2_key}
                        onDelete={async (id) => {
                      await deleteFileMutation.mutateAsync(id);
                    }}
                        onDownload={handleDownload}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded bg-surface-700 px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>
          <div className="text-sm text-surface-400">
            Halaman {currentPage} dari {totalPages}
          </div>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded bg-surface-700 px-3 py-2 text-sm font-medium text-surface-300 transition-colors hover:bg-surface-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Berikutnya
          </button>
        </div>
      )}

      {/* Upload dialog */}
      <UploadDialog
        isOpen={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setUploadProgress(0);
        }}
        onUpload={handleUpload}
        isLoading={uploadProgress > 0 && uploadProgress < 100}
        progress={uploadProgress}
      />
    </div>
  );
}
