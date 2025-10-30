/**
 * Hook for managing search filters with URL parameter persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface SearchFilters {
  entityType?: 'all' | 'project' | 'case' | 'event';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  projectType?: string;
}

export const useSearchFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>(() => {
    // Initialize from URL params
    return {
      entityType: (searchParams.get('type') as any) || 'all',
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      status: searchParams.get('status') || undefined,
      projectType: searchParams.get('projectType') || undefined,
    };
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    // Update or remove parameters based on filter values
    if (filters.entityType && filters.entityType !== 'all') {
      params.set('type', filters.entityType);
    } else {
      params.delete('type');
    }

    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    } else {
      params.delete('dateFrom');
    }

    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    } else {
      params.delete('dateTo');
    }

    if (filters.status) {
      params.set('status', filters.status);
    } else {
      params.delete('status');
    }

    if (filters.projectType) {
      params.set('projectType', filters.projectType);
    } else {
      params.delete('projectType');
    }

    // Only update if params changed
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const applyFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ entityType: 'all' });
  }, []);

  const hasActiveFilters = useCallback(() => {
    return !!(
      (filters.entityType && filters.entityType !== 'all') ||
      filters.dateFrom ||
      filters.dateTo ||
      filters.status ||
      filters.projectType
    );
  }, [filters]);

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.entityType && filters.entityType !== 'all') count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.status) count++;
    if (filters.projectType) count++;
    return count;
  }, [filters]);

  return {
    filters,
    applyFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
    activeFilterCount: getActiveFilterCount(),
  };
};

// Hook for saved searches (localStorage)
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

export const useSavedSearches = () => {
  const STORAGE_KEY = 'gidas_saved_searches';
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveSearch = useCallback(
    (name: string, query: string, filters: SearchFilters) => {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name,
        query,
        filters,
        createdAt: new Date().toISOString(),
      };

      setSavedSearches((prev) => {
        const updated = [...prev, newSearch];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save search:', error);
        }
        return updated;
      });

      return newSearch.id;
    },
    []
  );

  const deleteSearch = useCallback((id: string) => {
    setSavedSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to delete search:', error);
      }
      return updated;
    });
  }, []);

  const loadSearch = useCallback((id: string) => {
    return savedSearches.find((s) => s.id === id);
  }, [savedSearches]);

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    loadSearch,
  };
};
