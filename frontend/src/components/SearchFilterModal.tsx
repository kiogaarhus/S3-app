/**
 * Advanced Search Filter Modal
 * Allows filtering search results by entity type, date range, status, etc.
 *
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import { useState, useEffect } from 'react';
import { X, Filter, Calendar, Tag, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import './SearchFilterModal.css';

export interface SearchFilters {
  entityType?: 'all' | 'project' | 'case' | 'event';
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  projectType?: string;
}

interface SearchFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (filters: SearchFilters) => void;
  onClearFilters: () => void;
}

export const SearchFilterModal: React.FC<SearchFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApplyFilters,
  onClearFilters,
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="filter-modal-overlay" onClick={handleOverlayClick}>
      <div className="filter-modal">
        {/* Header */}
        <div className="filter-modal-header">
          <div className="filter-modal-title">
            <Filter className="w-5 h-5" />
            <h2>Avancerede Filtre</h2>
          </div>
          <button
            className="filter-modal-close"
            onClick={onClose}
            aria-label="Luk"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="filter-modal-content">
          {/* Entity Type Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <Tag className="w-4 h-4" />
              <span>Type</span>
            </label>
            <div className="filter-options">
              <label className="filter-radio">
                <input
                  type="radio"
                  name="entityType"
                  value="all"
                  checked={!localFilters.entityType || localFilters.entityType === 'all'}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, entityType: e.target.value as any })
                  }
                />
                <span>Alle</span>
              </label>
              <label className="filter-radio">
                <input
                  type="radio"
                  name="entityType"
                  value="project"
                  checked={localFilters.entityType === 'project'}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, entityType: e.target.value as any })
                  }
                />
                <span>Projekter</span>
              </label>
              <label className="filter-radio">
                <input
                  type="radio"
                  name="entityType"
                  value="case"
                  checked={localFilters.entityType === 'case'}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, entityType: e.target.value as any })
                  }
                />
                <span>Sager</span>
              </label>
              <label className="filter-radio">
                <input
                  type="radio"
                  name="entityType"
                  value="event"
                  checked={localFilters.entityType === 'event'}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, entityType: e.target.value as any })
                  }
                />
                <span>Hændelser</span>
              </label>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <Calendar className="w-4 h-4" />
              <span>Dato Range</span>
            </label>
            <div className="filter-date-range">
              <div className="filter-input-group">
                <label htmlFor="dateFrom">Fra</label>
                <input
                  id="dateFrom"
                  type="date"
                  className="filter-input"
                  value={localFilters.dateFrom || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateFrom: e.target.value })
                  }
                />
              </div>
              <div className="filter-input-group">
                <label htmlFor="dateTo">Til</label>
                <input
                  id="dateTo"
                  type="date"
                  className="filter-input"
                  value={localFilters.dateTo || ''}
                  onChange={(e) =>
                    setLocalFilters({ ...localFilters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Status Filter (for cases) */}
          {(!localFilters.entityType || localFilters.entityType === 'all' || localFilters.entityType === 'case') && (
            <div className="filter-group">
              <label className="filter-label">
                <FileText className="w-4 h-4" />
                <span>Status (Sager)</span>
              </label>
              <select
                className="filter-select"
                value={localFilters.status || ''}
                onChange={(e) =>
                  setLocalFilters({ ...localFilters, status: e.target.value })
                }
              >
                <option value="">Alle</option>
                <option value="Ja">Afsluttet</option>
                <option value="">Igangværende</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="filter-modal-footer">
          <Button variant="ghost" onClick={handleClear}>
            Nulstil
          </Button>
          <div className="filter-modal-actions">
            <Button variant="ghost" onClick={onClose}>
              Annuller
            </Button>
            <Button variant="primary" onClick={handleApply}>
              Anvend Filtre
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
