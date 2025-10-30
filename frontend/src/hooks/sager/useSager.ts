/**
 * React Query hooks for Sager API
 *
 * TODO: Implement all hooks for Sager CRUD operations
 * - useSager: Fetch paginated list of sager with filters
 * - useSag: Fetch single sag by ID
 * - useCreateSag: Create new sag
 * - useUpdateSag: Update existing sag
 * - useUpdateSagStatus: Update sag status (PATCH)
 * - useDeleteSag: Delete sag
 * - useExportSagerCSV: Export filtered sager to CSV
 * - useExportSagerExcel: Export filtered sager to Excel
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type {
  Sag,
  SagCreate,
  SagUpdate,
  SagStatusUpdate,
  SagerFilterParams,
  SagListResponse,
  SagDetailResponse,
} from '@/types/sager';

// Query keys for React Query cache management
export const sagerKeys = {
  all: ['sager'] as const,
  lists: () => [...sagerKeys.all, 'list'] as const,
  list: (filters: SagerFilterParams) => [...sagerKeys.lists(), filters] as const,
  details: () => [...sagerKeys.all, 'detail'] as const,
  detail: (id: number) => [...sagerKeys.details(), id] as const,
};

/**
 * TODO: Fetch paginated list of sager with filters
 *
 * Usage:
 * const { data, isLoading, error } = useSager({
 *   page: 1,
 *   per_page: 50,
 *   projekttype_navn: 'Separering',
 *   faerdigmeldt: 0
 * });
 */
export const useSager = (
  filters: SagerFilterParams = {},
  options?: UseQueryOptions<SagListResponse>
) => {
  return useQuery({
    queryKey: sagerKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<SagListResponse>('/api/sager', filters);
      return response;
    },
    ...options,
  });
};

/**
 * TODO: Fetch single sag by ID with related data
 *
 * Usage:
 * const { data, isLoading } = useSag(123);
 */
export const useSag = (id: number, options?: UseQueryOptions<SagDetailResponse>) => {
  return useQuery({
    queryKey: sagerKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<SagDetailResponse>(`/api/sager/${id}`);
      return response;
    },
    enabled: !!id,
    ...options,
  });
};

/**
 * TODO: Create new sag
 *
 * Usage:
 * const createSag = useCreateSag();
 * createSag.mutate({ ProjektID: 1, Bemærkning: 'New case' });
 */
export const useCreateSag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SagCreate) => {
      const response = await apiClient.post<SagDetailResponse>('/api/sager', data);
      return response;
    },
    onSuccess: () => {
      // Invalidate sager lists to refetch
      queryClient.invalidateQueries({ queryKey: sagerKeys.lists() });
    },
  });
};

/**
 * TODO: Update existing sag
 *
 * Usage:
 * const updateSag = useUpdateSag();
 * updateSag.mutate({ id: 123, data: { Bemærkning: 'Updated' } });
 */
export const useUpdateSag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SagUpdate }) => {
      const response = await apiClient.put<SagDetailResponse>(`/api/sager/${id}`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific sag and lists
      queryClient.invalidateQueries({ queryKey: sagerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: sagerKeys.lists() });
    },
  });
};

/**
 * TODO: Update sag status (færdigmeldt, påbud)
 *
 * Usage:
 * const updateStatus = useUpdateSagStatus();
 * updateStatus.mutate({ id: 123, data: { FærdigmeldtInt: 1 } });
 */
export const useUpdateSagStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: SagStatusUpdate }) => {
      const response = await apiClient.request<SagDetailResponse>(`/api/sager/${id}/status`, {
        method: 'PATCH',
        data,
      });
      return response;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific sag and lists
      queryClient.invalidateQueries({ queryKey: sagerKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: sagerKeys.lists() });
    },
  });
};

/**
 * TODO: Delete sag
 *
 * Usage:
 * const deleteSag = useDeleteSag();
 * deleteSag.mutate(123);
 */
export const useDeleteSag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/api/sager/${id}`);
    },
    onSuccess: () => {
      // Invalidate all sager lists
      queryClient.invalidateQueries({ queryKey: sagerKeys.lists() });
    },
  });
};

/**
 * TODO: Export sager to CSV with filters
 *
 * Usage:
 * const exportCSV = useExportSagerCSV();
 * exportCSV.mutate({ projekttype_navn: 'Separering' });
 */
export const useExportSagerCSV = () => {
  return useMutation({
    mutationFn: async (filters: SagerFilterParams & { columns?: string[], includeHeaders?: boolean, filename?: string }) => {
      // Build query parameters, handling array columns properly
      const params = new URLSearchParams();

      // Add basic filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'columns' && key !== 'includeHeaders' && key !== 'filename' && value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      // Handle columns array - convert to comma-separated string
      if (filters.columns && filters.columns.length > 0) {
        params.append('columns', filters.columns.join(','));
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sager/export/csv?${params.toString()}`);
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or use custom filename
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = filters.filename ||
        contentDisposition?.match(/filename="(.+)"/)?.[1] ||
        'sager_export.csv';

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * TODO: Export sager to Excel with filters
 *
 * Usage:
 * const exportExcel = useExportSagerExcel();
 * exportExcel.mutate({ faerdigmeldt: 0 });
 */
export const useExportSagerExcel = () => {
  return useMutation({
    mutationFn: async (filters: SagerFilterParams & { columns?: string[], includeHeaders?: boolean, filename?: string }) => {
      // Build query parameters, handling array columns properly
      const params = new URLSearchParams();

      // Add basic filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (key !== 'columns' && key !== 'includeHeaders' && key !== 'filename' && value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });

      // Handle columns array - convert to comma-separated string
      if (filters.columns && filters.columns.length > 0) {
        params.append('columns', filters.columns.join(','));
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sager/export/excel?${params.toString()}`);
      const blob = await response.blob();

      // Extract filename from Content-Disposition header or use custom filename
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = filters.filename ||
        contentDisposition?.match(/filename="(.+)"/)?.[1] ||
        'sager_export.xlsx';

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};

/**
 * Task 2.7: Export single sag to PDF
 *
 * Usage:
 * const exportPDF = useExportSagPDF();
 * exportPDF.mutate(123);
 */
export const useExportSagPDF = () => {
  return useMutation({
    mutationFn: async (sagId: number) => {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/sager/${sagId}/export/pdf`);

      if (!response.ok) {
        throw new Error('Failed to export PDF');
      }

      const blob = await response.blob();

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `sag_${sagId}.pdf`;

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });
};
