/**
 * Sager List View Component
 *
 * Task 2.1: Create Sager list view component
 *
 * IMPLEMENTATION CHECKLIST:
 * -------------------------
 * [ ] DataTable component with columns:
 *     - Id, Projekt Navn, Projekttype (badge), OprettetDato, Færdigmeldt, Påbud, Actions
 * [ ] Pagination controls (page size: 50, 100, 200)
 * [ ] Sorting by column headers
 * [ ] Loading states and skeletons
 * [ ] Empty state when no sager found
 * [ ] Projekttype badges with colors:
 *     - Separering: Blue
 *     - Åben Land: Green
 *     - Other: Gray
 * [ ] Action buttons:
 *     - View details (eye icon)
 *     - Edit (pencil icon)
 *     - Quick status toggle (checkbox)
 *     - Delete (with confirmation)
 * [ ] Integration with useSager hook
 * [ ] URL query params for persistence
 *
 * DEPENDENCIES:
 * - useSager hook from @/hooks/sager/useSager
 * - Badge component from @/components/ui/Badge
 * - Button component from @/components/ui/Button
 * - Card component from @/components/ui/Card
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import {
  useSager,
  useExportSagerCSV,
  useExportSagerExcel,
} from '@/hooks/sager/useSager';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SagerFilters } from './components/SagerFilters';
import { ExportModal, type ExportOptions } from '@/components/ExportModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { SagerFilterParams } from '@/types/sager';
import { getProjekttypeVariant } from '@/types/sager';
import {
  Download,
  FileText,
  Eye,
  ChevronDown
} from 'lucide-react';

export const SagerList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse filters from URL query params
  const filters: SagerFilterParams = {
    page: Number(searchParams.get('page')) || 1,
    per_page: Number(searchParams.get('per_page')) || 50,
    sort: searchParams.get('sort') || 'Id',
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc',
    projekttype_navn: searchParams.get('projekttype_navn') || undefined,
    projekt_navn: searchParams.get('projekt_navn') || undefined,
    faerdigmeldt: searchParams.get('faerdigmeldt')
      ? Number(searchParams.get('faerdigmeldt'))
      : undefined,
    paabud: searchParams.get('paabud') || undefined,
    oprettet_fra: searchParams.get('oprettet_fra') || undefined,
    oprettet_til: searchParams.get('oprettet_til') || undefined,
    search: searchParams.get('search') || undefined,
  };

  // Fetch sager with filters
  const { data, isLoading, error } = useSager(filters);
  const exportCSV = useExportSagerCSV();
  const exportExcel = useExportSagerExcel();

  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [defaultExportFormat, setDefaultExportFormat] = useState<'csv' | 'excel'>('csv');

  // Action handlers
  const handleViewDetails = (id: number) => {
    navigate(`/sager/${id}`);
  };

  const handlePageChange = (page: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: String(page) });
  };

  const handleSort = (column: string) => {
    const currentSort = searchParams.get('sort');
    const currentOrder = searchParams.get('order') || 'desc';

    let newOrder: 'asc' | 'desc' = 'desc';
    if (currentSort === column && currentOrder === 'desc') {
      newOrder = 'asc';
    }

    setSearchParams({
      ...Object.fromEntries(searchParams),
      sort: column,
      order: newOrder,
    });
  };

  // Export handlers
  const handleExportCSV = () => {
    const sagerCount = data?.pagination?.total || 0;
    if (sagerCount === 0) {
      alert('Ingen sager at eksportere');
      return;
    }
    setDefaultExportFormat('csv');
    setShowExportModal(true);
  };

  const handleExportExcel = () => {
    const sagerCount = data?.pagination?.total || 0;
    if (sagerCount === 0) {
      alert('Ingen sager at eksportere');
      return;
    }
    setDefaultExportFormat('excel');
    setShowExportModal(true);
  };

  const handleAdvancedExport = (options: ExportOptions) => {
    const sagerCount = data?.pagination?.total || 0;
    if (sagerCount === 0) {
      alert('Ingen sager at eksportere');
      return;
    }

    // Build filter params for export (exclude pagination)
    const exportFilters: SagerFilterParams = {
      projekttype_navn: filters.projekttype_navn,
      projekt_navn: filters.projekt_navn,
      faerdigmeldt: filters.faerdigmeldt,
      paabud: filters.paabud,
      oprettet_fra: filters.oprettet_fra,
      oprettet_til: filters.oprettet_til,
      search: filters.search,
    };

    // Add column selection to filter params
    const selectedColumns = options.columns
      .filter(col => col.included)
      .map(col => col.key);

    const exportParams = {
      ...exportFilters,
      columns: selectedColumns,
      includeHeaders: options.includeHeaders,
      filename: options.filename,
    };

    // Execute export based on format
    if (options.format === 'csv') {
      exportCSV.mutate(exportParams);
    } else {
      exportExcel.mutate(exportParams);
    }

    setShowExportModal(false);
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-secondary">Henter sager...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6">
        <Card>
          <div className="p-8 text-center text-red-600">
            <p>Fejl ved hentning af sager</p>
            <pre className="mt-2 text-sm text-primary">{JSON.stringify(error, null, 2)}</pre>
          </div>
        </Card>
      </div>
    );
  }

  // Get sort indicator
  const getSortIndicator = (column: string) => {
    if (filters.sort !== column) return null;
    return filters.order === 'asc' ? ' ↑' : ' ↓';
  };

  const sager = data?.data || [];

  return (
    <div className="p-8 space-y-8 max-w-[1800px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-primary">Sagsbehandling</h1>
            <p className="text-lg text-secondary">
              Viser {sager.length} sager
              {data?.pagination && ` af ${data.pagination.total} total`}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex gap-3">
          {/* Export Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={() => setShowExportModal(true)}
              disabled={sager.length === 0}
              title="Eksporter filtrerede sager med avancerede indstillinger"
            >
              <Download className="w-4 h-4 mr-2" />
              Eksporter
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filtering Panel */}
      <Card className="shadow-md">
        <div className="p-6">
          <SagerFilters isLoading={isLoading} />
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-md overflow-hidden">
        {sager.length === 0 ? (
          // Empty state
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl mb-6 text-secondary">Ingen sager fundet</p>
            <p className="text-sm text-secondary">Prøv at justere dine filtre for at finde sager</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b-2 bg-tertiary border-light">
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-primary"
                    onClick={() => handleSort('Id')}
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    ID{getSortIndicator('Id')}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-primary"
                    onClick={() => handleSort('projekt_navn')}
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    Projekt{getSortIndicator('projekt_navn')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    Adresse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    Type
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors text-primary"
                    onClick={() => handleSort('OprettetDato')}
                    style={{ backgroundColor: 'var(--bg-tertiary)' }}
                  >
                    Oprettet{getSortIndicator('OprettetDato')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    Påbud
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y bg-surface border-light">
                {sager.map((sag) => (
                  <tr key={sag.Id} className="transition-colors duration-150" style={{ backgroundColor: 'var(--surface)' }}>
                    <td className="px-6 py-4 text-sm font-semibold text-primary">{sag.Id}</td>
                    <td className="px-6 py-4 text-sm text-primary">{sag.projekt_navn || '-'}</td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {sag.fuld_adresse || sag.beliggenhed || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {sag.projekttype_navn && (
                        <Badge variant={getProjekttypeVariant(sag.projekttype_navn) as any}>
                          {sag.projekttype_navn}
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary">
                      {sag.OprettetDato ? new Date(sag.OprettetDato).toLocaleDateString('da-DK') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          sag.FærdigmeldtInt === 1 ? 'success' :
                          (sag.AfsluttetInt === 1 || sag.AfsluttetInt === -1) ? 'neutral' :
                          'default'
                        }
                      >
                        {sag.FærdigmeldtInt === 1 ? 'Færdigmeldt' :
                         (sag.AfsluttetInt === 1 || sag.AfsluttetInt === -1) ? 'Afsluttet' :
                         'Aktiv'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {sag.Påbud && (
                        <Badge variant="warning">{sag.Påbud}</Badge>
                      )}
                      {!sag.Påbud && <span className="text-tertiary">-</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(sag.Id)}
                          title="Se detaljer"
                          className="hover:bg-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && (
          <div className="px-4 py-3 border-t flex justify-between items-center border-light">
            <p className="text-sm text-secondary">
              Side {data.pagination.page} af {data.pagination.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={data.pagination.page === 1}
                onClick={() => handlePageChange(data.pagination!.page - 1)}
              >
                ← Forrige
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={data.pagination.page === data.pagination.total_pages}
                onClick={() => handlePageChange(data.pagination!.page + 1)}
              >
                Næste →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleAdvancedExport}
        isLoading={exportCSV.isPending || exportExcel.isPending}
        defaultFormat={defaultExportFormat}
      />
    </div>
  );
};
