/**
 * File type icon component.
 * Maps MIME types to appropriate Lucide icons with color coding.
 */

'use client';

import {
  FileIcon,
  ImageIcon,
  VideoIcon,
  MusicIcon,
  FileTextIcon,
  Archive,
  FileCode,
  type LucideProps,
} from 'lucide-react';

interface FileIconProps {
  mimeType: string;
  size?: 'sm' | 'md' | 'lg';
}

type IconSize = 16 | 20 | 24 | 32;

const sizeMap: Record<NonNullable<FileIconProps['size']>, IconSize> = {
  sm: 16,
  md: 24,
  lg: 32,
};

/**
 * Gets the appropriate icon component and color for a MIME type.
 * Returns Lucide ForwardRef component compatible with LucideProps.
 */
function getIconForMimeType(
  mimeType: string,
): { Icon: React.ComponentType<LucideProps>, color: string } {
  // Images
  if (mimeType.startsWith('image/')) {
    return {
      Icon: ImageIcon,
      color: 'text-blue-400',
    };
  }

  // Videos
  if (mimeType.startsWith('video/')) {
    return {
      Icon: VideoIcon,
      color: 'text-red-400',
    };
  }

  // Audio
  if (mimeType.startsWith('audio/')) {
    return {
      Icon: MusicIcon,
      color: 'text-purple-400',
    };
  }

  // PDFs and documents
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.includes('document')
  ) {
    return {
      Icon: FileTextIcon,
      color: 'text-green-400',
    };
  }

  // Archives
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/gzip' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed'
  ) {
    return {
      Icon: Archive,
      color: 'text-yellow-400',
    };
  }

  // Code and text
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    return {
      Icon: FileCode,
      color: 'text-cyan-400',
    };
  }

  // Default
  return {
    Icon: FileIcon,
    color: 'text-surface-400',
  };
}

export function FileIconComponent({ mimeType, size = 'md' }: FileIconProps): React.ReactElement {
  const iconSize = sizeMap[size];
  const { Icon, color } = getIconForMimeType(mimeType);

  return (
    <div className={`flex items-center justify-center ${color}`}>
      <Icon size={iconSize} />
    </div>
  );
}
