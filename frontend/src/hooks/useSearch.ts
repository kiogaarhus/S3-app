/**
 * Custom hook for global search functionality
 * Integrates with backend search API (GET /api/search/)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export interface SearchResult {
  id: number;
  type: 'project' | 'case' | 'event';
  title: string;
  subtitle?: string;
  highlight?: string;
  relevanceScore?: number;
}

export interface SearchResponse {
  query: string;
  results: {
    projects: Array<{
      id: number;
      projektnavn: string;
      projektmappe?: string;
      projekttype_navn?: string;
      match_field: string;
      match_highlight: string;
    }>;
    cases: Array<{
      id: number;
      projekt_navn?: string;
      bemærkning?: string;
      adresse?: string;
      ejendomsnummer?: number;
      journalnummer?: string;
      match_field: string;
      match_highlight: string;
    }>;
    events: Array<{
      id: number;
      sag_projekt_navn?: string;
      type_navn?: string;
      bemærkning?: string;
      dato?: string;
      match_field: string;
      match_highlight: string;
    }>;
    total_count: number;
  };
  execution_time_ms: number;
}

interface UseSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

export const useSearch = (options: UseSearchOptions = {}) => {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    limit = 10,
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce the search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs]);

  // Fetch search results
  const {
    data: rawData,
    isLoading,
    error,
  } = useQuery<SearchResponse>({
    queryKey: ['search', debouncedQuery, limit],
    queryFn: async () => {
      console.log('[Search] Sending API request:', { q: debouncedQuery, type: 'all', limit });
      console.log('[Search] Query enabled:', debouncedQuery.length >= minQueryLength);

      try {
        const response = await apiClient.get<SearchResponse>('/api/search/', {
          q: debouncedQuery,
          type: 'all',
          limit,
        });
        console.log('[Search] API response received:', response);

        // Backend returns SearchResponse directly (not wrapped in ApiResponse)
        // apiClient.get returns the axios response.data which IS the SearchResponse
        const searchResponse = response as unknown as SearchResponse;
        console.log('[Search] Search response:', searchResponse);

        return searchResponse;
      } catch (err) {
        console.error('[Search] API request failed:', err);
        throw err;
      }
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log errors
  if (error) {
    console.error('[Search] Query error:', error);
  }

  // Transform API response to SearchResult format
  const results: SearchResult[] = rawData
    ? [
        // Projects
        ...(rawData.results.projects || []).map((p) => ({
          id: p.id,
          type: 'project' as const,
          title: p.projektnavn,
          subtitle: p.projektmappe || p.projekttype_navn,
          highlight: p.match_highlight,
        })),
        // Cases
        ...(rawData.results.cases || []).map((c) => ({
          id: c.id,
          type: 'case' as const,
          title: c.bemærkning || 'Ingen titel',
          subtitle: c.adresse || (c.ejendomsnummer ? `Ejendom ${c.ejendomsnummer}` : c.journalnummer),
          highlight: c.match_highlight,
        })),
        // Events
        ...(rawData.results.events || []).map((e) => ({
          id: e.id,
          type: 'event' as const,
          title: e.bemærkning || 'Ingen titel',
          subtitle: e.dato || e.type_navn,
          highlight: e.match_highlight,
        })),
      ]
    : [];

  console.log('[Search] Transformed results:', { rawData, results, totalCount: rawData?.results.total_count });

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            return results[selectedIndex];
          }
          break;
      }
    },
    [isOpen, results, selectedIndex]
  );

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  // Open dropdown when query is entered
  useEffect(() => {
    if (query.length >= minQueryLength) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, minQueryLength]);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    totalResults: rawData?.results.total_count || 0,
  };
};

// Hook for autocomplete suggestions
export const useSuggestions = (query: string, options: { debounceMs?: number; minQueryLength?: number } = {}) => {
  const { debounceMs = 200, minQueryLength = 1 } = options;

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce the query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs]);

  // Fetch suggestions from backend
  const { data, isLoading } = useQuery({
    queryKey: ['search-suggestions', debouncedQuery],
    queryFn: async () => {
      const response = await apiClient.get('/api/search/suggestions', {
        q: debouncedQuery,
        limit: 5,
      });
      return response as unknown as {
        query: string;
        suggestions: Array<{
          text: string;
          type: 'project' | 'case' | 'event';
          entity_id: number;
          description?: string;
        }>;
      };
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    suggestions: data?.suggestions || [],
    isLoading,
  };
};

// Hook for recent searches (using localStorage)
export const useRecentSearches = (maxItems = 10) => {
  const STORAGE_KEY = 'gidas_recent_searches';

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      setRecentSearches((prev) => {
        // Remove duplicates and add to front
        const filtered = prev.filter((q) => q !== query);
        const updated = [query, ...filtered].slice(0, maxItems);

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Failed to save recent searches:', error);
        }

        return updated;
      });
    },
    [maxItems]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
  };
};
