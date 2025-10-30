/**
 * Central export for all React hooks
 */

export {
  useApi,
  useApiGet,
  useApiPost,
  useApiPut,
  useApiDelete,
} from './useApi';

export {
  useDashboardStats,
  useRecentActivity,
  useDashboardRefresh,
  usePaginatedActivity,
} from './useDashboard';

export {
  useTheme,
  type Theme,
} from './useTheme';

export {
  useHaendelser,
  haendelserKeys,
} from './sager/useHaendelser';

export {
  useRegistreringer,
  registreringerKeys,
} from './sager/useRegistreringer';

// Type exports handled by TypeScript automatically
