/**
 * API Types for S3
 * Based on backend API structure and Reflex state patterns
 */

// Generic API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination metadata
export interface PaginationInfo {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

// API Response with pagination
export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T> {
  pagination?: PaginationInfo;
}

// Dashboard Types (from dashboard.py)
export interface DashboardStats {
  projekttyper_count: number;
  active_projects_count: number;
  events_count: number;
  pending_cases_count: number;
  [key: string]: number | string; // Allow dynamic stats
}

export interface RecentActivity {
  id: string;
  type: 'project' | 'event' | 'case';
  description: string;
  timestamp: string;
  user?: string;
}

// Projekttyper Types
export interface ProjektType {
  id: number;
  navn: string;
  antal_projekter: number;
  status: 'Aktiv' | 'Inaktiv';
  beskrivelse?: string;
  created_at?: string;
  updated_at?: string;
}

// Hændelser Types
export interface Haendelse {
  id: number;
  titel: string;
  beskrivelse: string;
  type: string;
  timestamp: string;
  projekt_id?: number;
  user_id?: string;
}

// Task 13.3: Sag Hændelser Types (matching backend API)
export interface SagHaendelse {
  id: number;
  dato: string | null;
  haendelsestype: string;
  bemaerkning: string | null;
  init: string | null;
  link: string | null;
}

export interface SagHaendelseListResponse {
  success: boolean;
  data: SagHaendelse[];
  count: number;
}

// Task 14.2: Sag Registreringer Types (BBR status, etc.)
export interface SagRegistrering {
  id: number;
  felt_navn: string;
  værdi: string | null;
  dato: string | null;
  frist: string | null;
  init: string | null;
}

export interface SagRegistreringListResponse {
  success: boolean;
  data: SagRegistrering[];
  count: number;
}

// Sagsbehandling Types
export interface Sag {
  id: number;
  sag_nummer: string;
  titel: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  prioritet: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  assigned_to?: string;
}

// API Error Types
export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

// HTTP Method Types
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API Request Options (from base.py)
export interface ApiRequestOptions {
  method?: HttpMethod;
  data?: unknown;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  timeout?: number;
  useCache?: boolean;
}

// API Hook Return Type
export interface ApiHookResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}
