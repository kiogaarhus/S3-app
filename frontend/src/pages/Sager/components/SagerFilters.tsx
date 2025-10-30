/**
 * Sager Filters Component
 *
 * Task 2.4: Implement filtering UI with projekttype badges
 *
 * IMPLEMENTATION CHECKLIST:
 * -------------------------
 * [ ] Filter controls in collapsible panel:
 *     - Projekttype dropdown/badges (Separering, Åben Land, Other)
 *     - Færdigmeldt status filter (All, Active, Completed)
 *     - Påbud filter (All, With Påbud, Without Påbud)
 *     - Date range filter (Oprettet Fra/Til)
 *     - Search input (free text search)
 * [ ] Active filter badges with remove button
 * [ ] Clear all filters button
 * [ ] Filter count indicator
 * [ ] Collapsible/expandable panel
 * [ ] Sync filters with URL query params
 * [ ] Apply filters button (or auto-apply on change)
 * [ ] Loading state during filter application
 * [ ] Projekttype color-coded badges:
 *     - Separering: Blue
 *     - Åben Land: Green
 *     - Other: Gray
 *
 * DEPENDENCIES:
 * - Badge component from @/components/ui/Badge
 * - Button component from @/components/ui/Button
 * - Card component from @/components/ui/Card
 * - SagerFilterParams type from @/types/sager
 */

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Search, X, Sparkles } from 'lucide-react';
import { useSagerSearch, useSagerSuggestions } from '@/hooks/useSagerSearch';
import type { SagerFilterParams } from '@/types/sager';

interface SagerFiltersProps {
  onFiltersChange?: (filters: SagerFilterParams) => void;
  isLoading?: boolean;
}

export const SagerFilters = ({ onFiltersChange, isLoading }: SagerFiltersProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse initial filters from URL params (excluding search which is handled separately)
  const [filters, setFilters] = useState<SagerFilterParams>({
    projekttype_navn: searchParams.get('projekttype_navn') || undefined,
    projekt_navn: searchParams.get('projekt_navn') || undefined,
    faerdigmeldt: searchParams.get('faerdigmeldt')
      ? Number(searchParams.get('faerdigmeldt'))
      : undefined,
    paabud: searchParams.get('paabud') || undefined,
    oprettet_fra: searchParams.get('oprettet_fra') || undefined,
    oprettet_til: searchParams.get('oprettet_til') || undefined,
  });

  // State for available projects based on selected projekttype
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);

  // Use new search hooks
  const {
    query,
    setQuery,
    results,
    isLoading: isSearchLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    totalResults,
  } = useSagerSearch({
    debounceMs: 300,
    minQueryLength: 2,
    limit: 10,
  });

  const { suggestions } = useSagerSuggestions(query, {
    debounceMs: 200,
    minQueryLength: 1,
  });

  // Fetch available projects when projekttype changes
  useEffect(() => {
    const fetchProjects = async () => {
      if (!filters.projekttype_navn) {
        setAvailableProjects([]);
        return;
      }

      // Map projekttype to appropriate API endpoint
      const projekttypeMap: { [key: string]: string } = {
        'Separering': 'separering',
        'Åben Land': 'aabenland',
        'Dispensationssag': 'dispensationssag',
        'Nedsivningstilladelse': 'nedsivningstilladelse'
      };

      const endpoint = projekttypeMap[filters.projekttype_navn];
      if (!endpoint) return;

      try {
        const response = await fetch(`/api/dashboard/${endpoint}/projects`);
        if (!response.ok) return;
        const data = await response.json();
        setAvailableProjects(data.data || []);
      } catch (error) {
        console.error('Error fetching projects:', error);
        setAvailableProjects([]);
      }
    };

    fetchProjects();
  }, [filters.projekttype_navn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Handle search result selection
  const handleSelectResult = (sagId: number) => {
    setQuery('');
    setIsOpen(false);
    navigate(`/sager/${sagId}`);
  };

  // Handle keyboard navigation with selection
  const handleKeyDownWithSelection = (e: React.KeyboardEvent) => {
    const selectedResult = handleKeyDown(e);
    if (selectedResult && e.key === 'Enter') {
      handleSelectResult(selectedResult.id);
    }
  };

  // Apply filters to URL
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Clear all filter params first
    ['projekttype_navn', 'projekt_navn', 'faerdigmeldt', 'paabud', 'oprettet_fra', 'oprettet_til', 'search'].forEach(
      (key) => params.delete(key)
    );

    // Add active filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value));
      }
    });

    // Add search query if present
    if (query.trim()) {
      params.set('search', query);
    }

    // Reset to page 1 when filters change
    params.set('page', '1');

    setSearchParams(params);

    if (onFiltersChange) {
      onFiltersChange({ ...filters, search: query || undefined });
    }
  };

  // Filter change handler
  const handleFilterChange = (key: keyof SagerFilterParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
    setQuery('');
    const params = new URLSearchParams(searchParams);
    ['projekttype_navn', 'projekt_navn', 'faerdigmeldt', 'paabud', 'oprettet_fra', 'oprettet_til', 'search'].forEach(
      (key) => params.delete(key)
    );
    params.set('page', '1');
    setSearchParams(params);

    if (onFiltersChange) {
      onFiltersChange({});
    }
  };

  // Remove individual filter
  const handleRemoveFilter = (key: keyof SagerFilterParams) => {
    if (key === 'search') {
      setQuery('');
    }
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);

    const params = new URLSearchParams(searchParams);
    params.delete(key);
    params.set('page', '1');
    setSearchParams(params);

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // Calculate active filter count (including search query)
  const activeFilterCount =
    Object.values(filters).filter((value) => value !== undefined && value !== '').length +
    (query.trim() ? 1 : 0);

  // Show different content based on query length
  const showSuggestions = isOpen && query.length === 1 && suggestions.length > 0;
  const showResults = isOpen && query.length >= 2;

  return (
    <div className="space-y-6">
      {/* Filter Panel Header */}
      <div className="flex justify-between items-center pb-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 text-xl font-bold transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          <span className="text-primary-500">{isExpanded ? '▼' : '▶'}</span>
          <span>🔍 Filtre</span>
          {activeFilterCount > 0 && (
            <Badge variant="primary" className="ml-2 px-3 py-1">
              {activeFilterCount} aktive
            </Badge>
          )}
        </button>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="hover:bg-red-50 hover:text-red-600">
            🗑️ Ryd alle
          </Button>
        )}
      </div>

      {/* Active Filters (Always visible) */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.projekttype_navn && (
            <Badge variant="primary" className="flex items-center gap-2">
              <span>Type: {filters.projekttype_navn}</span>
              <button
                onClick={() => handleRemoveFilter('projekttype_navn')}
                className="hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.projekt_navn && (
            <Badge variant="info" className="flex items-center gap-2">
              <span>Projekt: {filters.projekt_navn}</span>
              <button
                onClick={() => handleRemoveFilter('projekt_navn')}
                className="hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.faerdigmeldt !== undefined && (
            <Badge variant="default" className="flex items-center gap-2">
              <span>Status: {
                filters.faerdigmeldt === 1 ? 'Færdigmeldt' :
                filters.faerdigmeldt === -1 ? 'Afsluttet' :
                'Aktiv'
              }</span>
              <button
                onClick={() => handleRemoveFilter('faerdigmeldt')}
                className="hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.paabud && (
            <Badge variant="warning" className="flex items-center gap-2">
              <span>Påbud: {filters.paabud}</span>
              <button onClick={() => handleRemoveFilter('paabud')} className="hover:text-red-600">
                ×
              </button>
            </Badge>
          )}
          {query.trim() && (
            <Badge variant="default" className="flex items-center gap-2">
              <span>Søgning: {query}</span>
              <button onClick={() => setQuery('')} className="hover:text-red-600">
                ×
              </button>
            </Badge>
          )}
          {(filters.oprettet_fra || filters.oprettet_til) && (
            <Badge variant="default" className="flex items-center gap-2">
              <span>
                Dato: {filters.oprettet_fra || '...'} - {filters.oprettet_til || '...'}
              </span>
              <button
                onClick={() => {
                  handleRemoveFilter('oprettet_fra');
                  handleRemoveFilter('oprettet_til');
                }}
                className="hover:text-red-600"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Controls (Collapsible) */}
      {isExpanded && (
        <div className="space-y-6 p-6 rounded-xl border-2 shadow-inner" style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-light)'
        }}>
          {/* Projekttype Filter with clickable badges */}
          <div>
            <label className="block text-sm font-bold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>📁 Projekttype</label>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleFilterChange('projekttype_navn', undefined)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  !filters.projekttype_navn
                    ? 'bg-primary-600 text-white shadow-md scale-105'
                    : 'border-2 hover:scale-105'
                }`}
                style={!filters.projekttype_navn ? {} : {
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--border-medium)',
                  color: 'var(--text-primary)'
                }}
              >
                Alle typer
              </button>
              <button
                onClick={() => handleFilterChange('projekttype_navn', 'Separering')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  filters.projekttype_navn === 'Separering'
                    ? 'bg-blue-600 text-white shadow-md scale-105'
                    : 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-400 hover:scale-105'
                }`}
              >
                🔵 Separering
              </button>
              <button
                onClick={() => handleFilterChange('projekttype_navn', 'Åben Land')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  filters.projekttype_navn === 'Åben Land'
                    ? 'bg-green-600 text-white shadow-md scale-105'
                    : 'bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 hover:border-green-400 hover:scale-105'
                }`}
              >
                🟢 Åben Land
              </button>
              <button
                onClick={() => handleFilterChange('projekttype_navn', 'Dispensationssag')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  filters.projekttype_navn === 'Dispensationssag'
                    ? 'bg-amber-600 text-white shadow-md scale-105'
                    : 'bg-amber-50 text-amber-700 border-2 border-amber-200 hover:bg-amber-100 hover:border-amber-400 hover:scale-105'
                }`}
              >
                🟡 Dispensationssag
              </button>
              <button
                onClick={() => handleFilterChange('projekttype_navn', 'Nedsivningstilladelse')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  filters.projekttype_navn === 'Nedsivningstilladelse'
                    ? 'bg-cyan-600 text-white shadow-md scale-105'
                    : 'bg-cyan-50 text-cyan-700 border-2 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-400 hover:scale-105'
                }`}
              >
                💧 Nedsivningstilladelse
              </button>
            </div>
          </div>

          {/* Projekt Filter - Only shown when projekttype is selected */}
          {filters.projekttype_navn && (
            <div>
              <label htmlFor="filter-projekt" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>
                📂 Projekt ({filters.projekttype_navn})
              </label>
              <select
                id="filter-projekt"
                aria-label="Filtrer efter projekt"
                value={filters.projekt_navn || ''}
                onChange={(e) => handleFilterChange('projekt_navn', e.target.value)}
                className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                disabled={availableProjects.length === 0}
              >
                <option value="">Alle projekter</option>
                {availableProjects.map((projekt) => (
                  <option key={projekt} value={projekt}>
                    {projekt}
                  </option>
                ))}
              </select>
              {availableProjects.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">Ingen projekter fundet for denne projekttype</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Færdigmeldt Status Filter */}
          <div>
            <label htmlFor="filter-status" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>📊 Status</label>
            <select
              id="filter-status"
              aria-label="Filtrer efter status"
              value={filters.faerdigmeldt !== undefined ? String(filters.faerdigmeldt) : ''}
              onChange={(e) =>
                handleFilterChange('faerdigmeldt', e.target.value === '' ? undefined : Number(e.target.value))
              }
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="">Alle sager</option>
              <option value="0">Aktive sager</option>
              <option value="-1">Afsluttede sager</option>
            </select>
          </div>

          {/* Påbud Filter */}
          <div>
            <label htmlFor="filter-paabud" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>⚠️ Påbud</label>
            <select
              id="filter-paabud"
              aria-label="Filtrer efter påbud"
              value={filters.paabud || ''}
              onChange={(e) => handleFilterChange('paabud', e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            >
              <option value="">Alle</option>
              <option value="Ja">Med påbud</option>
              <option value="Nej">Uden påbud</option>
            </select>
          </div>

          {/* Date Range Filter - From */}
          <div>
            <label htmlFor="filter-date-from" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>📅 Fra Dato</label>
            <input
              id="filter-date-from"
              type="date"
              aria-label="Filtrer fra dato"
              value={filters.oprettet_fra || ''}
              onChange={(e) => handleFilterChange('oprettet_fra', e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Date Range Filter - To */}
          <div>
            <label htmlFor="filter-date-to" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>📅 Til Dato</label>
            <input
              id="filter-date-to"
              type="date"
              aria-label="Filtrer til dato"
              value={filters.oprettet_til || ''}
              onChange={(e) => handleFilterChange('oprettet_til', e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Enhanced Search with Autocomplete */}
          <div className="relative">
            <label htmlFor="filter-search" className="block text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-primary)' }}>🔎 Søg</label>
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5" style={{ color: 'var(--text-tertiary)' }} />
              <input
                ref={inputRef}
                id="filter-search"
                type="text"
                aria-label="Søg i sager"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDownWithSelection}
                placeholder="Søg i sager..."
                className="w-full pl-10 pr-10 py-3 border-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-expanded={isOpen}
              />
              {query && (
                <button
                  className="absolute right-3 top-3 p-0.5 hover:bg-gray-100 rounded"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Ryd søgning"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isSearchLoading && (
                <div className="absolute right-3 top-3.5">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {(showResults || showSuggestions) && (
              <div
                ref={dropdownRef}
                id="search-results"
                className="absolute top-full left-0 right-0 mt-2 max-h-96 bg-white border-2 border-gray-200 rounded-lg shadow-lg overflow-y-auto z-50"
                role="listbox"
              >
                {/* Autocomplete Suggestions */}
                {showSuggestions && (
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-600 uppercase">
                      <Sparkles className="w-4 h-4" />
                      <span>Forslag</span>
                    </div>
                    <div className="space-y-1">
                      {suggestions.map((suggestion) => (
                        <button
                          key={`${suggestion.type}-${suggestion.entity_id}`}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 rounded transition-colors"
                          onClick={() => {
                            setQuery(suggestion.text);
                            inputRef.current?.focus();
                          }}
                        >
                          <div className="font-medium text-sm">{suggestion.text}</div>
                          {suggestion.description && (
                            <div className="text-xs text-gray-500">{suggestion.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {showResults && (
                  <>
                    {results.length > 0 ? (
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-600 uppercase">
                          {totalResults} resultat{totalResults !== 1 ? 'er' : ''}
                        </div>
                        <div className="space-y-1">
                          {results.map((result, index) => (
                            <button
                              key={result.id}
                              className={`w-full px-3 py-2 text-left rounded transition-colors ${
                                selectedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleSelectResult(result.id)}
                              onMouseEnter={() => setSelectedIndex(index)}
                              role="option"
                              aria-selected={selectedIndex === index}
                            >
                              <div className="font-medium text-sm">{result.title}</div>
                              {result.subtitle && (
                                <div className="text-xs text-gray-500 mt-0.5">{result.subtitle}</div>
                              )}
                              {result.highlight && (
                                <div
                                  className="text-xs text-gray-600 mt-1"
                                  dangerouslySetInnerHTML={{ __html: result.highlight }}
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">Ingen resultater fundet for "{query}"</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          </div>

          {/* Apply Filters Button */}
          <div className="flex justify-end gap-3 pt-4 border-t-2" style={{ borderColor: 'var(--border-light)' }}>
            <Button variant="ghost" onClick={handleClearFilters} className="hover:bg-red-50">
              Ryd alle
            </Button>
            <Button variant="primary" onClick={handleApplyFilters} disabled={isLoading} className="px-6 py-3 shadow-md">
              {isLoading ? '⏳ Anvender...' : '🔍 Anvend filtre'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
