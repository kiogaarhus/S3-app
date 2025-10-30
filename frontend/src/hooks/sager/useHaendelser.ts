/**
 * React Query hook for Sag Hændelser (Case Events) API
 *
 * Task 13.3: Fetch events for a specific case
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { SagHaendelseListResponse } from '@/types';

// Query keys for React Query cache management
export const haendelserKeys = {
  all: ['haendelser'] as const,
  bySag: (sagId: number) => [...haendelserKeys.all, 'sag', sagId] as const,
};

/**
 * Fetch all hændelser (events) for a specific sag
 *
 * @param sagId - ID of the sag to fetch events for
 * @param options - React Query options
 *
 * @returns Query result with hændelser data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useHaendelser(123);
 *
 * if (data) {
 *   console.log(`Found ${data.count} events`);
 *   data.data.forEach(event => {
 *     console.log(`${event.haendelsestype}: ${event.bemaerkning}`);
 *   });
 * }
 * ```
 */
export const useHaendelser = (
  sagId: number,
  options?: Omit<UseQueryOptions<SagHaendelseListResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SagHaendelseListResponse>({
    queryKey: haendelserKeys.bySag(sagId),
    queryFn: async () => {
      const response = await apiClient.get<SagHaendelseListResponse>(
        `/api/sager/${sagId}/haendelser`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!sagId, // Only run query if sagId is provided
    ...options,
  });
};
