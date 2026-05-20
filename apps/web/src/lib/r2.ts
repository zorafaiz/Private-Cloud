/**
 * Cloudflare R2 storage client using AWS S3-compatible SDK.
 * Provides presigned URL generation for secure direct uploads/downloads.
 */

import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { R2_CONFIG } from '@private-cloud/shared';

let cachedClient: S3Client | null = null;

/**
 * Creates and returns a cached S3Client for Cloudflare R2.
 * Reuses the same instance to avoid recreating clients.
 */
export function getR2Client(): S3Client {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  return cachedClient;
}

/**
 * Sanitizes a filename by removing special characters.
 * Keeps only alphanumeric, dots, hyphens, and underscores.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200);
}

/**
 * Generates a presigned PUT URL for uploading a file to R2.
 * Key format: {userId}/{uuid}-{sanitizedFilename}
 *
 * @param userId - The user's ID
 * @param filename - The original filename
 * @param contentType - The MIME type of the file
 * @param size - The file size in bytes
 * @returns Object with presigned URL and the key used
 * @throws Error if file size exceeds limit
 */
export async function generatePresignedUploadUrl(
  userId: string,
  filename: string,
  contentType: string,
  size: number,
): Promise<{ url: string; key: string }> {
  // Validate file size
  if (size > R2_CONFIG.maxFileSize) {
    throw new Error(
      `Ukuran file melebihi batas ${R2_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    );
  }

  const sanitized = sanitizeFilename(filename);
  const uuid = randomUUID();
  const key = `${userId}/${uuid}-${sanitized}`;

  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  // 5 minutes for upload
  const url = await getSignedUrl(client, command, { expiresIn: 300 });

  return { url, key };
}

/**
 * Generates a presigned GET URL for downloading a file from R2.
 *
 * @param key - The R2 object key
 * @returns The presigned download URL
 */
export async function generatePresignedDownloadUrl(key: string): Promise<string> {
  const client = getR2Client();
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  // 15 minutes for download
  return getSignedUrl(client, command, { expiresIn: 900 });
}

/**
 * Deletes an object from R2.
 *
 * @param key - The R2 object key to delete
 * @throws Error if deletion fails
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  await client.send(command);
}
