/**
 * Sager-specific Search Hook
 * Uses the global search API but filters for cases only
 *
 * Based on useSearch.ts but specialized for the Sager page
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export interface SagerSearchResult {
  id: number;
  title: string;
  subtitle?: string;
  highlight?: string;
}

export interface SagerSearchResponse {
  query: string;
  results: {
    cases: Array<{
      id: number;
      sagnr: string;
      projekt_navn: string;
      fuld_adresse: string;
      match_highlight: string;
    }>;
    total_count: number;
  };
  execution_time_ms: number;
}

export interface SagerSearchOptions {
  debounceMs?: number;
  minQueryLength?: number;
  limit?: number;
}

export const useSagerSearch = (options: SagerSearchOptions = {}) => {
  const { debounceMs = 300, minQueryLength = 2, limit = 10 } = options;

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
    data: searchResponse,
    isLoading,
    error,
  } = useQuery<SagerSearchResponse>({
    queryKey: ['sager-search', debouncedQuery, limit],
    queryFn: async () => {
      console.log('[SagerSearch] Sending API request:', { q: debouncedQuery, type: 'case', limit });
      try {
        const response = await apiClient.get<SagerSearchResponse>('/api/search/', {
          q: debouncedQuery,
          type: 'case', // Only search for cases
          limit,
        });
        // Backend returns SearchResponse directly (not wrapped in ApiResponse)
        const searchData = response as unknown as SagerSearchResponse;
        console.log('[SagerSearch] API response:', searchData);
        return searchData;
      } catch (err) {
        console.error('[SagerSearch] API request failed:', err);
        throw err;
      }
    },
    enabled: debouncedQuery.length >= minQueryLength,
  });

  // Transform results to common format
  const results: SagerSearchResult[] =
    searchResponse?.results.cases.map((caseItem) => ({
      id: caseItem.id,
      title: `${caseItem.sagnr} - ${caseItem.projekt_navn}`,
      subtitle: caseItem.fuld_adresse,
      highlight: caseItem.match_highlight,
    })) || [];

  const totalResults = searchResponse?.results.total_count || 0;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent): SagerSearchResult | null => {
      if (!isOpen || results.length === 0) return null;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
          return null;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          return null;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            return results[selectedIndex];
          }
          return null;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          return null;

        default:
          return null;
      }
    },
    [isOpen, results, selectedIndex]
  );

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

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
    totalResults,
  };
};

/**
 * Hook for case-specific autocomplete suggestions
 */
export interface SagerSuggestion {
  type: 'case';
  entity_id: number;
  text: string;
  description?: string;
}

export interface SagerSuggestionsResponse {
  query: string;
  suggestions: SagerSuggestion[];
}

export const useSagerSuggestions = (
  query: string,
  options: { debounceMs?: number; minQueryLength?: number } = {}
) => {
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

  const { data, isLoading } = useQuery<SagerSuggestionsResponse>({
    queryKey: ['sager-suggestions', debouncedQuery],
    queryFn: async () => {
      const response = await apiClient.get<SagerSuggestionsResponse>('/api/search/suggestions', {
        q: debouncedQuery,
        type: 'case', // Only get case suggestions
      });
      return response as unknown as SagerSuggestionsResponse;
    },
    enabled: debouncedQuery.length >= minQueryLength && debouncedQuery.length < 2,
  });

  return {
    suggestions: data?.suggestions || [],
    isLoading,
  };
};
