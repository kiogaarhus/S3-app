/**
 * Global Search Bar Component
 * Features:
 * - Debounced search input
 * - Autocomplete suggestions
 * - Recent searches
 * - Keyboard navigation (arrows, enter, escape)
 * - Categorized results (projects, cases, events)
 * - Click to navigate
 *
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, FileText, Folder, Calendar, Sparkles, Filter, Save } from 'lucide-react';
import { useSearch, useRecentSearches, useSuggestions, SearchResult } from '../hooks/useSearch';
import { useSearchFilters, useSavedSearches } from '../hooks/useSearchFilters';
import { SearchFilterModal, SearchFilters as FilterType } from './SearchFilterModal';
import { FilterChips } from './FilterChips';
import './GlobalSearchBar.css';

interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  className = '',
  placeholder = 'Søg i projekter, sager og hændelser...',
}) => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { filters, applyFilters, clearFilters, hasActiveFilters, activeFilterCount } =
    useSearchFilters();

  // Saved searches
  const { saveSearch } = useSavedSearches();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');

  const {
    query,
    setQuery,
    results,
    isLoading,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    totalResults,
  } = useSearch({
    debounceMs: 300,
    minQueryLength: 2,
    limit: 10,
  });

  const { recentSearches, addRecentSearch, clearRecentSearches } =
    useRecentSearches();

  // Get autocomplete suggestions (for queries with 1 character)
  const { suggestions } = useSuggestions(query, {
    debounceMs: 200,
    minQueryLength: 1,
  });

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

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    addRecentSearch(query);
    setQuery('');
    setIsOpen(false);

    // Navigate based on result type
    switch (result.type) {
      case 'project':
        // TODO: Add project detail route when available
        navigate(`/projekter/${result.id}`);
        break;
      case 'case':
        navigate(`/sager/${result.id}`);
        break;
      case 'event':
        // TODO: Add event detail route when available
        navigate(`/haendelser/${result.id}`);
        break;
    }
  };

  // Handle keyboard navigation
  const handleKeyDownWithSelection = (e: React.KeyboardEvent) => {
    const selectedResult = handleKeyDown(e);
    if (selectedResult && e.key === 'Enter') {
      handleSelectResult(selectedResult);
    }
  };

  // Handle recent search click
  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);
    inputRef.current?.focus();
  };

  // Get icon for result type
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return <Folder className="w-4 h-4" />;
      case 'case':
        return <FileText className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
    }
  };

  // Get label for result type
  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'project':
        return 'Projekt';
      case 'case':
        return 'Sag';
      case 'event':
        return 'Hændelse';
    }
  };

  // Show different content based on query length
  const showRecentSearches =
    isOpen && query.length === 0 && recentSearches.length > 0;
  const showSuggestions = isOpen && query.length === 1 && suggestions.length > 0;
  const showResults = isOpen && query.length >= 2;

  // Handle save search
  const handleSaveSearch = () => {
    if (searchName.trim() && query.trim()) {
      saveSearch(searchName.trim(), query, filters);
      setSearchName('');
      setShowSaveDialog(false);
    }
  };

  // Remove individual filter
  const handleRemoveFilter = (filterKey: keyof FilterType) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    applyFilters(newFilters);
  };

  return (
    <div className={`global-search-container ${className}`}>
      <div className="search-toolbar">
        <div className="search-input-wrapper">
        <Search className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDownWithSelection}
          aria-label="Global søgning"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Ryd søgning"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isLoading && (
          <div className="search-loading">
            <div className="spinner" />
          </div>
        )}
      </div>

      {/* Toolbar Actions */}
      <div className="search-actions">
        <button
          className={`search-action-btn ${hasActiveFilters ? 'active' : ''}`}
          onClick={() => setIsFilterModalOpen(true)}
          aria-label="Filtre"
        >
          <Filter className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="filter-badge">{activeFilterCount}</span>
          )}
        </button>

        {query && (
          <button
            className="search-action-btn"
            onClick={() => setShowSaveDialog(true)}
            aria-label="Gem søgning"
          >
            <Save className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <FilterChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={clearFilters}
        />
      )}

      {/* Filter Modal */}
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={filters}
        onApplyFilters={(newFilters) => {
          applyFilters(newFilters);
          setIsFilterModalOpen(false);
        }}
        onClearFilters={clearFilters}
      />

      {/* Save Search Dialog (Simple) */}
      {showSaveDialog && (
        <div className="save-search-dialog">
          <div className="save-search-content">
            <h3>Gem Søgning</h3>
            <input
              type="text"
              placeholder="Navn på søgning..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSearch()}
              autoFocus
            />
            <div className="save-search-actions">
              <button onClick={() => setShowSaveDialog(false)}>Annuller</button>
              <button onClick={handleSaveSearch} disabled={!searchName.trim()}>
                Gem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Dropdown */}
      {(showResults || showRecentSearches || showSuggestions) && (
        <div
          ref={dropdownRef}
          id="search-results"
          className="search-dropdown"
          role="listbox"
        >
          {/* Autocomplete Suggestions */}
          {showSuggestions && (
            <div className="search-section">
              <div className="search-section-header">
                <div className="search-section-title">
                  <Sparkles className="w-4 h-4" />
                  <span>Forslag</span>
                </div>
              </div>
              <div className="search-results-list">
                {suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.type}-${suggestion.entity_id}`}
                    className="search-result-item suggestion-item"
                    onClick={() => {
                      setQuery(suggestion.text);
                      inputRef.current?.focus();
                    }}
                  >
                    <div className="result-icon-wrapper">
                      {suggestion.type === 'project' && <Folder className="w-4 h-4" />}
                      {suggestion.type === 'case' && <FileText className="w-4 h-4" />}
                      {suggestion.type === 'event' && <Calendar className="w-4 h-4" />}
                    </div>
                    <div className="result-content">
                      <div className="result-title">{suggestion.text}</div>
                      {suggestion.description && (
                        <div className="result-subtitle">{suggestion.description}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {showRecentSearches && (
            <div className="search-section">
              <div className="search-section-header">
                <div className="search-section-title">
                  <Clock className="w-4 h-4" />
                  <span>Seneste søgninger</span>
                </div>
                <button
                  className="search-clear-all-btn"
                  onClick={clearRecentSearches}
                >
                  Ryd alle
                </button>
              </div>
              <div className="search-results-list">
                {recentSearches.map((searchQuery, index) => (
                  <button
                    key={index}
                    className="search-result-item recent-search-item"
                    onClick={() => handleRecentSearchClick(searchQuery)}
                  >
                    <Clock className="result-icon" />
                    <span className="result-title">{searchQuery}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {showResults && (
            <>
              {results.length > 0 ? (
                <div className="search-section">
                  <div className="search-section-header">
                    <span className="search-section-title">
                      {totalResults} resultat{totalResults !== 1 ? 'er' : ''}
                    </span>
                  </div>
                  <div className="search-results-list">
                    {results.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        className={`search-result-item ${
                          selectedIndex === index ? 'selected' : ''
                        }`}
                        onClick={() => handleSelectResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        role="option"
                        aria-selected={selectedIndex === index}
                      >
                        <div className="result-icon-wrapper">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="result-content">
                          <div className="result-title-row">
                            <span className="result-title">{result.title}</span>
                            <span className="result-type-badge">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.subtitle && (
                            <div className="result-subtitle">
                              {result.subtitle}
                            </div>
                          )}
                          {result.highlight && (
                            <div
                              className="result-highlight"
                              dangerouslySetInnerHTML={{
                                __html: result.highlight,
                              }}
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="search-empty">
                  <Search className="w-8 h-8 opacity-30" />
                  <p>Ingen resultater fundet for "{query}"</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
