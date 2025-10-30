/**
 * Advanced Export Modal
 * Allows selecting specific columns and export options for CSV/Excel export
 *
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import { useState, useEffect } from 'react';
import { X, Download, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from './ui/Button';
import { useTheme } from '@/hooks/useTheme';
import './ExportModal.css';

export interface ExportColumn {
  key: string;
  label: string;
  included: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'excel';
  columns: ExportColumn[];
  includeHeaders: boolean;
  filename?: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  isLoading?: boolean;
  defaultFormat?: 'csv' | 'excel';
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: 'id', label: 'ID', included: true },
  { key: 'projekt_navn', label: 'Projekt', included: true },
  { key: 'projekttype_navn', label: 'Projekttype', included: true },
  { key: 'adresse', label: 'Adresse', included: true },
  { key: 'oprettet_dato', label: 'Oprettet Dato', included: true },
  { key: 'faerdigmelding_dato', label: 'Færdigmeldt Dato', included: false },
  { key: 'faerdigmeldt', label: 'Status', included: true },
  { key: 'påbud', label: 'Påbud', included: true },
  { key: 'bemærkning', label: 'Bemærkning', included: false },
  { key: 'ejer_felt', label: 'Ejer', included: false },
  { key: 'matrnr', label: 'Matrikel Nr', included: false },
  { key: 'ejendomsnummer', label: 'Ejendoms Nr', included: false },
  { key: 'postnummer', label: 'Postnummer', included: false },
  { key: 'påbudsfrist', label: 'Påbudsfrist', included: false },
  { key: 'case_age', label: 'Sagens Alder', included: true },

  // Task 13.8: Hændelser kolonner
  { key: 'haendelser_antal', label: 'Antal hændelser', included: false },
  { key: 'seneste_haendelse_dato', label: 'Seneste hændelse dato', included: false },
  { key: 'seneste_haendelse_type', label: 'Seneste hændelse type', included: false },
  { key: 'haendelser_oversigt', label: 'Hændelser oversigt', included: false },

  // BBR kolonner
  { key: 'bbr_afløbsforhold', label: 'BBR Afløbsforhold', included: false },
  { key: 'bbr_vandforsyning', label: 'BBR Vandforsyning', included: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isLoading = false,
  defaultFormat = 'csv',
}) => {
  const { theme } = useTheme();
  const [options, setOptions] = useState<ExportOptions>({
    format: defaultFormat,
    columns: DEFAULT_COLUMNS,
    includeHeaders: true,
    filename: '',
  });

  // Reset options when modal opens
  useEffect(() => {
    if (isOpen) {
      setOptions({
        format: defaultFormat,
        columns: DEFAULT_COLUMNS,
        includeHeaders: true,
        filename: '',
      });
    }
  }, [isOpen, defaultFormat]);

  if (!isOpen) return null;

  const handleColumnToggle = (columnKey: string) => {
    setOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col =>
        col.key === columnKey ? { ...col, included: !col.included } : col
      ),
    }));
  };

  const handleSelectAll = () => {
    setOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({ ...col, included: true })),
    }));
  };

  const handleSelectNone = () => {
    setOptions(prev => ({
      ...prev,
      columns: prev.columns.map(col => ({ ...col, included: false })),
    }));
  };

  const handleExport = () => {
    // Generate default filename if not provided
    const filename = options.filename ||
      `sager_export_${new Date().toISOString().split('T')[0]}.${options.format}`;

    onExport({
      ...options,
      filename,
    });
  };

  const includedColumns = options.columns.filter(col => col.included);
  const canExport = includedColumns.length > 0 && !isLoading;

  return (
    <div className="modal-overlay">
      <div className="modal-container export-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-content">
            <Download className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="modal-title">Avanceret Eksport</h2>
          </div>
          <div className="modal-header-actions">
            <button
              onClick={() => {
                // Toggle theme - using the same logic as ThemeToggle component
                const html = document.documentElement;
                const currentTheme = html.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                html.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
              }}
              className="theme-toggle-btn"
              disabled={isLoading}
              title={`Skift til ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button
              onClick={onClose}
              className="modal-close-button"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          {/* Format Selection */}
          <div className="form-group">
            <label className="form-label">Eksport Format</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={options.format === 'csv'}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'excel'
                  }))}
                  disabled={isLoading}
                />
                <Download className="w-4 h-4 mr-2" />
                CSV (Kommasepareret)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={options.format === 'excel'}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'excel'
                  }))}
                  disabled={isLoading}
                />
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </label>
            </div>
          </div>

          {/* Filename */}
          <div className="form-group">
            <label className="form-label">Filnavn (valgfrit)</label>
            <input
              type="text"
              className="form-input"
              placeholder={`sager_export_${new Date().toISOString().split('T')[0]}.${options.format}`}
              value={options.filename}
              onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          {/* Column Selection */}
          <div className="form-group">
            <div className="flex justify-between items-center mb-3">
              <label className="form-label">Kolonner til Eksport</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700"
                  disabled={isLoading}
                >
                  Vælg alle
                </button>
                <button
                  type="button"
                  onClick={handleSelectNone}
                  className="text-sm text-primary-600 hover:text-primary-700"
                  disabled={isLoading}
                >
                  Vælg ingen
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              <div className="space-y-2">
                {options.columns.map((column) => (
                  <label
                    key={column.key}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.included}
                      onChange={() => handleColumnToggle(column.key)}
                      className="mr-3"
                      disabled={isLoading}
                    />
                    <span className={`flex-1 ${column.included ? 'font-medium' : 'text-gray-500'}`}>
                      {column.label}
                    </span>
                    {column.included && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-2 text-sm text-gray-600">
              {includedColumns.length} kolonne{includedColumns.length !== 1 ? 'r' : ''} valgt
            </div>
          </div>

          {/* Include Headers Option */}
          <div className="form-group">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={options.includeHeaders}
                onChange={(e) => setOptions(prev => ({
                  ...prev,
                  includeHeaders: e.target.checked
                }))}
                className="mr-3"
                disabled={isLoading}
              />
              <span className="form-label mb-0">Inkluder kolonneoverskrifter</span>
            </label>
          </div>

          {/* Preview */}
          {includedColumns.length > 0 && (
            <div className="form-group">
              <label className="form-label">Preview</label>
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="text-sm text-gray-600 mb-2">
                  Følgende kolonner vil blive eksporteret:
                </div>
                <div className="flex flex-wrap gap-2">
                  {includedColumns.map((column) => (
                    <span
                      key={column.key}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-700"
                    >
                      {column.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Annuller
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={!canExport}
            loading={isLoading}
          >
            {isLoading ? 'Eksporterer...' : `Eksporter ${options.format.toUpperCase()}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;