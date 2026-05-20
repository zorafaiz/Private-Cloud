/**
 * Reusable note editor component for creating and editing notes.
 * Includes title input, content textarea, and formatting toolbar.
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Bold, Italic, Heading2, List, X } from 'lucide-react';
import type { Note } from '@private-cloud/shared';

interface NoteEditorProps {
  initialData?: Note;
  onSave: (data: { title: string; content: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Auto-resize textarea based on content.
 */
function useAutoResizeTextarea(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
): void {
  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = 'auto';
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = `${Math.min(scrollHeight, 500)}px`;
  }, [value]);
}

/**
 * Insert markdown formatting around selected text.
 */
function insertMarkdown(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string = before,
): void {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const text = textarea.value;

  const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
  textarea.value = newText;

  // Move cursor inside formatting
  const newCursorPos = start + before.length + selectedText.length;
  textarea.focus();
  textarea.setSelectionRange(newCursorPos, newCursorPos);

  // Trigger change event to update state
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}): React.ReactElement => {
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [content, setContent] = React.useState(initialData?.content || '');
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(textareaRef, content);

  // Handle Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [title, content]);

  const handleSave = async (): Promise<void> => {
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Judul catatan tidak boleh kosong');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: trimmedTitle,
        content,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menyimpan catatan';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const insertBold = (): void => {
    if (textareaRef.current) {
      insertMarkdown(textareaRef.current, '**', '**');
    }
  };

  const insertItalic = (): void => {
    if (textareaRef.current) {
      insertMarkdown(textareaRef.current, '*', '*');
    }
  };

  const insertHeading = (): void => {
    if (textareaRef.current) {
      insertMarkdown(textareaRef.current, '## ', '');
    }
  };

  const insertList = (): void => {
    if (textareaRef.current) {
      insertMarkdown(textareaRef.current, '- ', '');
    }
  };

  const charCount = title.length;
  const maxChars = 200;

  return (
    <div className="space-y-4">
      {/* Title input */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-surface-300">
            Judul Catatan
          </label>
          <span
            className={`text-xs ${
              charCount > maxChars
                ? 'text-red-400'
                : charCount > maxChars * 0.8
                  ? 'text-yellow-400'
                  : 'text-surface-500'
            }`}
          >
            {charCount}/{maxChars}
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Masukkan judul catatan..."
          maxLength={maxChars}
          disabled={isSaving || isLoading}
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-surface-100 placeholder-surface-500 transition-colors focus:border-brand-600 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Content textarea with toolbar */}
      <div>
        <label className="mb-2 block text-sm font-medium text-surface-300">
          Isi Catatan
        </label>

        {/* Formatting toolbar */}
        <div className="mb-2 flex gap-1 rounded-lg border border-surface-700 bg-surface-800 p-2">
          <button
            type="button"
            onClick={insertBold}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center rounded px-2 py-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-50"
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={insertItalic}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center rounded px-2 py-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-50"
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={insertHeading}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center rounded px-2 py-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-50"
            title="Heading"
          >
            <Heading2 size={16} />
          </button>
          <button
            type="button"
            onClick={insertList}
            disabled={isSaving || isLoading}
            className="flex items-center justify-center rounded px-2 py-1 text-surface-400 transition-colors hover:bg-surface-700 hover:text-surface-200 disabled:opacity-50"
            title="List"
          >
            <List size={16} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tuliskan isi catatan di sini... (Support markdown)"
          disabled={isSaving || isLoading}
          className="w-full min-h-[200px] rounded-lg border border-surface-700 bg-surface-800 px-4 py-3 text-surface-100 placeholder-surface-500 transition-colors focus:border-brand-600 focus:outline-none disabled:opacity-50"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Catatan'}
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving || isLoading}
          className="flex items-center justify-center rounded-lg border border-surface-700 px-4 py-2 font-medium text-surface-300 transition-colors hover:bg-surface-800 disabled:opacity-50"
        >
          <X size={18} />
        </button>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-surface-500">
        💡 Tekan Ctrl+S untuk menyimpan dengan cepat
      </p>
    </div>
  );
};

export default NoteEditor;
