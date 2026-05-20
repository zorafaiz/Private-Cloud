/**
 * Typed fetch wrapper for making API requests from the client.
 * Provides consistent error handling and response typing.
 */

import type { ApiResponse } from '@private-cloud/shared';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface FetchOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

async function parseJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.status === 204) {
    return { success: true } as ApiResponse<T>;
  }

  const text = await response.text();
  if (!text) {
    if (response.ok) {
      return { success: true } as ApiResponse<T>;
    }
    return {
      success: false,
      error: `Request failed with status ${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      error: 'Respons server tidak valid',
    };
  }
}

/**
 * Makes a typed API request and returns a standardized ApiResponse.
 *
 * @param url - The API endpoint URL (relative or absolute)
 * @param options - Fetch options including method, body, headers
 * @returns A typed ApiResponse wrapping the response data
 */
export async function apiClient<T>(
  url: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, signal } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'include',
    signal,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    const data = await parseJsonResponse<T>(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        message: data.message,
      };
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        error: 'Permintaan dibatalkan',
      };
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Makes a GET request to the API.
 * @param url - The API endpoint URL
 * @param signal - Optional abort signal
 * @returns A typed ApiResponse
 */
export async function get<T>(
  url: string,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'GET', signal });
}

/**
 * Makes a POST request to the API.
 * @param url - The API endpoint URL
 * @param body - The request body
 * @param signal - Optional abort signal
 * @returns A typed ApiResponse
 */
export async function post<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'POST', body, signal });
}

/**
 * Makes a PUT request to the API.
 * @param url - The API endpoint URL
 * @param body - The request body
 * @param signal - Optional abort signal
 * @returns A typed ApiResponse
 */
export async function put<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'PUT', body, signal });
}

/**
 * Makes a PATCH request to the API.
 * @param url - The API endpoint URL
 * @param body - The request body
 * @param signal - Optional abort signal
 * @returns A typed ApiResponse
 */
export async function patch<T>(
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'PATCH', body, signal });
}

/**
 * Makes a DELETE request to the API.
 * @param url - The API endpoint URL
 * @param signal - Optional abort signal
 * @returns A typed ApiResponse
 */
export async function deleteRequest<T>(
  url: string,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  return apiClient<T>(url, { method: 'DELETE', signal });
}

/**
 * Makes an API request with FormData (for file uploads).
 * Does NOT set Content-Type header to let the browser set the multipart boundary.
 */
export async function apiClientFormData<T>(
  url: string,
  formData: FormData,
  signal?: AbortSignal,
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      signal,
    });

    const data = await parseJsonResponse<T>(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Upload failed with status ${response.status}`,
        message: data.message,
      };
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        success: false,
        error: 'Unggahan dibatalkan',
      };
    }

    const message = err instanceof Error ? err.message : 'Terjadi kesalahan jaringan';
    return {
      success: false,
      error: message,
    };
  }
}
