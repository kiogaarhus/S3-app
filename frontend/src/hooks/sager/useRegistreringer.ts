/**
 * React Query hook for Sag Registreringer (BBR status, etc.) API
 *
 * Task 14.2: Fetch dynamic registrations for a specific case
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { SagRegistreringListResponse } from '@/types';

// Query keys for React Query cache management
export const registreringerKeys = {
  all: ['registreringer'] as const,
  bySag: (sagId: number) => [...registreringerKeys.all, 'sag', sagId] as const,
};

/**
 * Fetch all registrations (dynamic fields like BBR status) for a specific sag
 *
 * @param sagId - ID of the sag to fetch registrations for
 * @param options - React Query options
 *
 * @returns Query result with registrations data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useRegistreringer(123);
 *
 * if (data) {
 *   console.log(`Found ${data.count} registrations`);
 *   data.data.forEach(reg => {
 *     console.log(`${reg.felt_navn}: ${reg.værdi}`);
 *   });
 * }
 * ```
 */
export const useRegistreringer = (
  sagId: number,
  options?: Omit<UseQueryOptions<SagRegistreringListResponse>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SagRegistreringListResponse>({
    queryKey: registreringerKeys.bySag(sagId),
    queryFn: async () => {
      const response = await apiClient.get<SagRegistreringListResponse>(
        `/api/sager/${sagId}/registreringer`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    enabled: !!sagId, // Only run query if sagId is provided
    ...options,
  });
};
