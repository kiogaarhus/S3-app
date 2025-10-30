/**
 * React Hook for API calls
 * Converted from backend/reference/reflex_state/base.py
 *
 * Provides loading states, error handling, and automatic refetching
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/client';
import type { ApiResponse, ApiError, HttpMethod } from '@/types';

interface UseApiOptions {
  method?: HttpMethod;
  data?: unknown;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  useCache?: boolean;
  enabled?: boolean; // If false, won't fetch automatically
  refetchOnMount?: boolean;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom hook for making API calls
 * Matches Python BaseState pattern with loading and error_message
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data, loading, error, refetch } = useApi<DashboardStats>(
 *     '/api/dashboard/stats'
 *   );
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 * ```
 */
export function useApi<T = unknown>(
  endpoint: string,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    method = 'GET',
    data: requestData,
    params,
    headers,
    timeout,
    useCache = true,
    enabled = true,
    refetchOnMount = true,
  } = options;

  // State matching Python: loading, error_message
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Clear error message
   * Matches Python: clear_error()
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch data from API
   * Matches Python: api_call()
   */
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.request<T>(endpoint, {
        method,
        data: requestData,
        params,
        headers,
        timeout,
        useCache,
      });

      if (response.success && response.data) {
        setData(response.data);
      } else {
        // Handle API response with success: false
        setError({
          status: 400,
          message: response.error || response.message || 'Request failed',
          details: response,
        });
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, requestData, params, headers, timeout, useCache, enabled]);

  // Auto-fetch on mount or when dependencies change
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }
  }, [fetchData, enabled, refetchOnMount]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearError,
  };
}

/**
 * Hook for GET requests
 * Matches Python: api_get()
 */
export function useApiGet<T = unknown>(
  endpoint: string,
  params?: Record<string, unknown>,
  options?: Omit<UseApiOptions, 'method' | 'data' | 'params'>
): UseApiResult<T> {
  return useApi<T>(endpoint, { ...options, method: 'GET', params });
}

/**
 * Hook for POST requests (manual trigger)
 * Matches Python: api_post()
 */
export function useApiPost<T = unknown>(
  endpoint: string,
  options?: Omit<UseApiOptions, 'method' | 'enabled'>
): Omit<UseApiResult<T>, 'refetch'> & {
  post: (data: unknown) => Promise<void>;
} {
  const { data, loading, error, clearError } = useApi<T>(endpoint, {
    ...options,
    method: 'POST',
    enabled: false, // Don't auto-fetch
  });

  const post = useCallback(
    async (postData: unknown) => {
      try {
        const response = await apiClient.post<T>(endpoint, postData, options);
        if (response.success && response.data) {
          return response.data;
        }
      } catch (err) {
        throw err;
      }
    },
    [endpoint, options]
  );

  return { data, loading, error, clearError, post };
}

/**
 * Hook for PUT requests (manual trigger)
 * Matches Python: api_put()
 */
export function useApiPut<T = unknown>(
  endpoint: string,
  options?: Omit<UseApiOptions, 'method' | 'enabled'>
): Omit<UseApiResult<T>, 'refetch'> & {
  put: (data: unknown) => Promise<void>;
} {
  const { data, loading, error, clearError } = useApi<T>(endpoint, {
    ...options,
    method: 'PUT',
    enabled: false,
  });

  const put = useCallback(
    async (putData: unknown) => {
      try {
        const response = await apiClient.put<T>(endpoint, putData, options);
        if (response.success && response.data) {
          return response.data;
        }
      } catch (err) {
        throw err;
      }
    },
    [endpoint, options]
  );

  return { data, loading, error, clearError, put };
}

/**
 * Hook for DELETE requests (manual trigger)
 * Matches Python: api_delete()
 */
export function useApiDelete<T = unknown>(
  endpoint: string,
  options?: Omit<UseApiOptions, 'method' | 'enabled'>
): Omit<UseApiResult<T>, 'refetch'> & {
  deleteRequest: () => Promise<void>;
} {
  const { data, loading, error, clearError } = useApi<T>(endpoint, {
    ...options,
    method: 'DELETE',
    enabled: false,
  });

  const deleteRequest = useCallback(async () => {
    try {
      const response = await apiClient.delete<T>(endpoint, options);
      if (response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      throw err;
    }
  }, [endpoint, options]);

  return { data, loading, error, clearError, deleteRequest };
}
