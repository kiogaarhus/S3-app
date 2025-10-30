/**
 * Dashboard-specific hooks
 * Converted from backend/reference/reflex_state/dashboard.py
 */

import { useState, useCallback } from 'react';
import { useApiGet } from './useApi';
import type {
  DashboardStats,
  RecentActivity,
  PaginatedApiResponse
} from '@/types';

/**
 * Hook for loading dashboard statistics
 * Matches Python: DashboardState.load_dashboard_stats()
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { data: stats, loading, error, refetch } = useDashboardStats();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <div>
 *       <h1>Projects: {stats?.projekttyper_count}</h1>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboardStats() {
  console.log('[useDashboardStats] Hook called');
  const result = useApiGet<DashboardStats>('/api/dashboard/stats', undefined, {
    useCache: false,  // Disable cache for debugging
    timeout: 60000,   // Increase timeout to 60s for debugging
  });
  console.log('[useDashboardStats] Result:', {
    hasData: !!result.data,
    loading: result.loading,
    error: result.error
  });
  return result;
}

/**
 * Hook for loading recent activity with pagination
 * Matches Python: DashboardState.load_recent_activity()
 *
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page (default: 20 from Python)
 *
 * @example
 * ```tsx
 * function RecentActivityList() {
 *   const [page, setPage] = useState(1);
 *   const { data, loading, pagination } = useRecentActivity(page, 20);
 *
 *   return (
 *     <div>
 *       {data?.map(activity => (
 *         <ActivityItem key={activity.id} activity={activity} />
 *       ))}
 *       <Pagination
 *         page={page}
 *         total={pagination?.total_pages}
 *         onPageChange={setPage}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useRecentActivity(page: number = 1, perPage: number = 20) {
  const params = {
    page,
    per_page: perPage,
  };

  const { data, loading, error, refetch } = useApiGet<
    PaginatedApiResponse<RecentActivity[]>
  >('/api/dashboard/recent-activity', params, {
    useCache: true,
  });

  return {
    data: data?.data || null,
    pagination: data?.pagination || null,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for refreshing all dashboard data
 * Matches Python: DashboardState.refresh_dashboard()
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const { refreshDashboard, loading } = useDashboardRefresh();
 *
 *   return (
 *     <button onClick={refreshDashboard} disabled={loading}>
 *       {loading ? 'Refreshing...' : 'Refresh Dashboard'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useDashboardRefresh() {
  const { refetch: refetchStats, loading: loadingStats } = useDashboardStats();
  const { refetch: refetchActivity, loading: loadingActivity } = useRecentActivity(1);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([refetchStats(), refetchActivity()]);
  }, [refetchStats, refetchActivity]);

  return {
    refreshDashboard,
    loading: loadingStats || loadingActivity,
  };
}

/**
 * Hook for paginated recent activity with navigation
 * Matches Python: DashboardState with next_activity_page() and prev_activity_page()
 *
 * @example
 * ```tsx
 * function ActivityPagination() {
 *   const {
 *     data,
 *     page,
 *     totalPages,
 *     nextPage,
 *     prevPage,
 *     hasNextPage,
 *     hasPrevPage,
 *     loading
 *   } = usePaginatedActivity();
 *
 *   return (
 *     <div>
 *       {data?.map(activity => <ActivityCard key={activity.id} {...activity} />)}
 *       <div>
 *         <button onClick={prevPage} disabled={!hasPrevPage || loading}>
 *           Previous
 *         </button>
 *         <span>Page {page} of {totalPages}</span>
 *         <button onClick={nextPage} disabled={!hasNextPage || loading}>
 *           Next
 *         </button>
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePaginatedActivity(initialPage: number = 1, perPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(initialPage);

  const { data, pagination, loading, error, refetch } = useRecentActivity(
    currentPage,
    perPage
  );

  const nextPage = useCallback(() => {
    if (pagination && currentPage < pagination.total_pages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, pagination]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return {
    data,
    page: currentPage,
    totalPages: pagination?.total_pages || 0,
    total: pagination?.total || 0,
    perPage,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: pagination ? currentPage < pagination.total_pages : false,
    hasPrevPage: currentPage > 1,
    refetch,
  };
}
