/**
 * Filter Chips Component
 * Displays active filters as removable chips
 *
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import { X, Calendar, Tag, FileText } from 'lucide-react';
import { SearchFilters } from './SearchFilterModal';
import './FilterChips.css';

interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (filterKey: keyof SearchFilters) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  const chips: Array<{
    key: keyof SearchFilters;
    label: string;
    value: string;
    icon: React.ReactNode;
  }> = [];

  // Entity Type chip
  if (filters.entityType && filters.entityType !== 'all') {
    const typeLabels = {
      project: 'Projekter',
      case: 'Sager',
      event: 'Hændelser',
    };
    chips.push({
      key: 'entityType',
      label: 'Type',
      value: typeLabels[filters.entityType],
      icon: <Tag className="w-3 h-3" />,
    });
  }

  // Date range chips
  if (filters.dateFrom) {
    chips.push({
      key: 'dateFrom',
      label: 'Fra',
      value: new Date(filters.dateFrom).toLocaleDateString('da-DK'),
      icon: <Calendar className="w-3 h-3" />,
    });
  }

  if (filters.dateTo) {
    chips.push({
      key: 'dateTo',
      label: 'Til',
      value: new Date(filters.dateTo).toLocaleDateString('da-DK'),
      icon: <Calendar className="w-3 h-3" />,
    });
  }

  // Status chip
  if (filters.status) {
    chips.push({
      key: 'status',
      label: 'Status',
      value: filters.status,
      icon: <FileText className="w-3 h-3" />,
    });
  }

  // Project type chip
  if (filters.projectType) {
    chips.push({
      key: 'projectType',
      label: 'Projekttype',
      value: filters.projectType,
      icon: <Tag className="w-3 h-3" />,
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="filter-chips-container">
      <div className="filter-chips-list">
        {chips.map((chip) => (
          <div key={chip.key} className="filter-chip">
            <div className="filter-chip-icon">{chip.icon}</div>
            <span className="filter-chip-label">{chip.label}:</span>
            <span className="filter-chip-value">{chip.value}</span>
            <button
              className="filter-chip-remove"
              onClick={() => onRemoveFilter(chip.key)}
              aria-label={`Fjern ${chip.label} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {chips.length > 1 && (
        <button className="filter-chips-clear-all" onClick={onClearAll}>
          Ryd alle
        </button>
      )}
    </div>
  );
};
