/**
 * Upload dialog component with drag-and-drop support.
 * Handles file selection, validation, and progress tracking.
 */

'use client';

import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileIconComponent } from './file-icon';

interface UploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
  progress?: number;
}

export function UploadDialog({
  isOpen,
  onClose,
  onUpload,
  isLoading = false,
  progress = 0,
}: UploadDialogProps): React.ReactElement | null {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) {
    return null;
  }

  const handleFileSelect = async (files: FileList | null): Promise<void> => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) return;

    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      onClose();
      toast.success('File berhasil diunggah');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengunggah file';
      toast.error(message);
    }
  };

  const handleCancel = (): void => {
    if (!isLoading) {
      setSelectedFile(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleCancel} />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-surface-800 shadow-xl animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-700 p-6">
            <h2 className="text-lg font-semibold text-surface-50">Unggah File</h2>
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="rounded p-1 text-surface-400 transition-colors hover:text-surface-200 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {!selectedFile ? (
              <>
                {/* Drop zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragOver
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-surface-600 hover:border-surface-500'
                  }`}
                >
                  <div className="mb-3 flex justify-center">
                    <Upload
                      size={40}
                      className={
                        isDragOver ? 'text-brand-400' : 'text-surface-400'
                      }
                    />
                  </div>
                  <h3 className="mb-1 font-medium text-surface-100">
                    Seret file ke sini
                  </h3>
                  <p className="mb-4 text-sm text-surface-400">atau</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary text-sm"
                  >
                    Pilih File
                  </button>
                  <p className="mt-3 text-xs text-surface-500">
                    Maksimal 100MB
                  </p>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </>
            ) : (
              <>
                {/* File preview */}
                <div className="mb-4 rounded-lg bg-surface-700/50 p-4">
                  <div className="mb-3 flex justify-center">
                    <div className="text-surface-300">
                      <FileIconComponent
                        mimeType={selectedFile.type || 'application/octet-stream'}
                        size="lg"
                      />
                    </div>
                  </div>
                  <p className="truncate text-center text-sm font-medium text-surface-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-center text-xs text-surface-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                {/* Progress bar */}
                {isLoading && progress > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-surface-300">
                        Mengunggah...
                      </p>
                      <p className="text-xs text-surface-500">{progress}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-700">
                      <div
                        className="h-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                    }}
                    disabled={isLoading}
                    className="flex-1 rounded bg-surface-700 px-4 py-2 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-600 disabled:opacity-50"
                  >
                    Pilih File Lain
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="flex-1 btn-primary text-sm"
                  >
                    {isLoading ? `Mengunggah... ${progress}%` : 'Unggah'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
