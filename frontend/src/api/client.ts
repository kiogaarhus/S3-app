/**
 * API Client for S3
 * Converted from backend/reference/reflex_state/base.py
 *
 * Provides HTTP client with caching, error handling, and loading states
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiResponse, ApiError, HttpMethod } from '@/types';

// Cache structure matching Python implementation
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface ApiCache {
  [key: string]: CacheEntry;
}

// API Client Configuration
interface ApiClientConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  cacheTTL?: number; // milliseconds
}

class ApiClient {
  private axiosInstance: AxiosInstance;
  private cache: ApiCache = {};
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes in milliseconds (from Python: 300.0 seconds)

  constructor(config: ApiClientConfig = {}) {
    const {
      baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
      timeout = 30000, // 30 seconds (from Python: 30.0)
      headers = {},
      cacheTTL = 5 * 60 * 1000,
    } = config;

    this.cacheTTL = cacheTTL;

    this.axiosInstance = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        throw this.handleError(error);
      }
    );
  }

  /**
   * Generate cache key from endpoint and params
   * Matches Python: _get_cache_key()
   */
  private getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
    const paramsStr = params ? JSON.stringify(params, Object.keys(params).sort()) : '';
    return `${endpoint}?${paramsStr}`;
  }

  /**
   * Get cached response if valid (not expired)
   * Matches Python: _get_cached_response()
   */
  private getCachedResponse(cacheKey: string): unknown | null {
    const cached = this.cache[cacheKey];
    if (!cached) {
      return null;
    }

    const currentTime = Date.now();
    const age = currentTime - cached.timestamp;

    // Check if cache is still valid
    if (age < this.cacheTTL) {
      return cached.data;
    }

    // Cache expired, remove it
    delete this.cache[cacheKey];
    return null;
  }

  /**
   * Cache a response with current timestamp
   * Matches Python: _set_cached_response()
   */
  private setCachedResponse(cacheKey: string, data: unknown): void {
    this.cache[cacheKey] = {
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all cached responses
   * Matches Python: clear_api_cache()
   */
  public clearCache(): void {
    this.cache = {};
  }

  /**
   * Set cache TTL in milliseconds
   * Matches Python: set_cache_ttl()
   */
  public setCacheTTL(ttl: number): void {
    this.cacheTTL = ttl;
  }

  /**
   * Handle API errors
   * Matches Python error handling in api_call()
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // HTTP error (4xx, 5xx)
      return {
        status: error.response.status,
        message: `HTTP ${error.response.status}: ${error.response.statusText}`,
        details: error.response.data,
      };
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      return {
        status: 408,
        message: `Request timeout after ${this.axiosInstance.defaults.timeout}ms`,
        details: error.message,
      };
    } else if (error.request) {
      // Network error
      return {
        status: 0,
        message: `Network error: ${error.message}`,
        details: error,
      };
    } else {
      // Unknown error
      return {
        status: 500,
        message: `Unexpected error: ${error.message}`,
        details: error,
      };
    }
  }

  /**
   * Make an HTTP request with caching support
   * Matches Python: api_call()
   */
  public async request<T = unknown>(
    endpoint: string,
    options: {
      method?: HttpMethod;
      data?: unknown;
      params?: Record<string, unknown>;
      headers?: Record<string, string>;
      timeout?: number;
      useCache?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      data,
      params,
      headers,
      timeout,
      useCache = true,
    } = options;

    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cacheKey = this.getCacheKey(endpoint, params);
      const cachedResponse = this.getCachedResponse(cacheKey);

      if (cachedResponse !== null) {
        return cachedResponse as ApiResponse<T>;
      }
    }

    try {
      const config: AxiosRequestConfig = {
        method,
        url: endpoint,
        data,
        params,
        headers,
        timeout,
      };

      const response = await this.axiosInstance.request<ApiResponse<T>>(config);

      // Cache GET responses
      if (method === 'GET' && useCache) {
        const cacheKey = this.getCacheKey(endpoint, params);
        this.setCachedResponse(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      // Error already handled by interceptor
      throw error;
    }
  }

  /**
   * Convenience method for GET requests
   * Matches Python: api_get()
   */
  public async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    options?: Omit<Parameters<typeof this.request>[1], 'method' | 'data' | 'params'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET', params });
  }

  /**
   * Convenience method for POST requests
   * Matches Python: api_post()
   */
  public async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<Parameters<typeof this.request>[1], 'method' | 'data'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  /**
   * Convenience method for PUT requests
   * Matches Python: api_put()
   */
  public async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: Omit<Parameters<typeof this.request>[1], 'method' | 'data'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  /**
   * Convenience method for DELETE requests
   * Matches Python: api_delete()
   */
  public async delete<T = unknown>(
    endpoint: string,
    options?: Omit<Parameters<typeof this.request>[1], 'method' | 'data'>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances
export { ApiClient };
export type { ApiClientConfig };
