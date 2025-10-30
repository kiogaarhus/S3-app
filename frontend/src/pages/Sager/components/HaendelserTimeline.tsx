/**
 * Hændelser Timeline Component
 *
 * Task 13.4: Display case events in a timeline format
 *
 * Features:
 * - Vertical timeline with events
 * - Event type badges
 * - Formatted dates
 * - Loading skeleton
 * - Empty state
 * - Error handling
 */

import { useHaendelser } from '@/hooks';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Calendar, AlertCircle, Info, Clock } from 'lucide-react';
import type { SagHaendelse } from '@/types';

interface HaendelserTimelineProps {
  sagId: number;
}

export const HaendelserTimeline = ({ sagId }: HaendelserTimelineProps) => {
  const { data, isLoading, error } = useHaendelser(sagId);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full" style={{ backgroundColor: 'var(--gray-200)' }} />
              {i < 3 && <div className="w-0.5 h-20 bg-gray-200 mt-2" style={{ backgroundColor: 'var(--border-light)' }} />}
            </div>
            <div className="flex-1 pb-8">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" style={{ backgroundColor: 'var(--gray-200)' }} />
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-3" style={{ backgroundColor: 'var(--gray-200)' }} />
              <div className="h-16 bg-gray-200 rounded" style={{ backgroundColor: 'var(--gray-200)' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 border-error-500">
        <div className="flex items-start gap-3 text-error-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Fejl ved hentning af hændelser</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {error instanceof Error ? error.message : 'Ukendt fejl'}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Empty state
  if (!data || data.count === 0) {
    return (
      <Card className="p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--text-tertiary)' }} />
        <p className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          Ingen hændelser registreret
        </p>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Der er endnu ikke tilføjet nogen hændelser til denne sag
        </p>
      </Card>
    );
  }

  // Helper function to get icon for event type
  const getEventIcon = (type: string) => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('påbud') || typeLower.includes('varsel')) {
      return <AlertCircle className="w-5 h-5" />;
    }
    if (typeLower.includes('frist') || typeLower.includes('dato')) {
      return <Clock className="w-5 h-5" />;
    }
    return <Info className="w-5 h-5" />;
  };

  // Helper function to get badge variant for event type
  const getBadgeVariant = (type: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'neutral' => {
    const typeLower = type.toLowerCase();
    if (typeLower.includes('påbud')) return 'warning';
    if (typeLower.includes('afslut') || typeLower.includes('færdig')) return 'success';
    if (typeLower.includes('varsel')) return 'danger';
    return 'primary';
  };

  // Helper function to format date
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Ingen dato';

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return 'Ugyldig dato';
    }
  };

  return (
    <div className="space-y-1">
      {data.data.map((haendelse: SagHaendelse, index: number) => (
        <div key={haendelse.id} className="flex gap-4">
          {/* Timeline line and icon */}
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-600)',
              }}
            >
              {getEventIcon(haendelse.haendelsestype)}
            </div>
            {index < data.data.length - 1 && (
              <div
                className="w-0.5 flex-1 min-h-[60px]"
                style={{ backgroundColor: 'var(--border-light)' }}
              />
            )}
          </div>

          {/* Event content */}
          <div className="flex-1 pb-8">
            <Card className="p-4 hover:shadow-md transition-shadow">
              {/* Event type and date */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <Badge variant={getBadgeVariant(haendelse.haendelsestype)} className="font-semibold">
                  {haendelse.haendelsestype}
                </Badge>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(haendelse.dato)}</span>
                </div>
              </div>

              {/* Event description */}
              {haendelse.bemaerkning && (
                <p className="mb-3 whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
                  {haendelse.bemaerkning}
                </p>
              )}

              {/* Event metadata */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t" style={{ borderColor: 'var(--border-light)' }}>
                {haendelse.init && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      Initialer:
                    </span>
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {haendelse.init}
                    </span>
                  </div>
                )}
                {haendelse.link && (
                  <a
                    href={haendelse.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                    style={{ color: 'var(--primary-600)' }}
                  >
                    Se link →
                  </a>
                )}
              </div>
            </Card>
          </div>
        </div>
      ))}
    </div>
  );
};
