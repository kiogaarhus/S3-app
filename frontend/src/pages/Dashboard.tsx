/**
 * Dashboard Page Component
 * Using Design System from docs/REACT_DESIGN_SYSTEM.md
 */

import { useDashboardStats, usePaginatedActivity } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, StatCard, Button, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  RefreshCw,
  CheckCircle,
  Clock,
  Calendar,
  HourglassIcon,
  Wrench,
  CalendarDays,
  Scale,
  User,
  BarChart3,
  Download,
  Search,
  Inbox
} from 'lucide-react';
import './Dashboard.css';

export function Dashboard() {
  const { data: stats, loading: statsLoading, error: statsError } = useDashboardStats();

  const {
    data: activities,
    page,
    totalPages,
    loading: activitiesLoading,
    error: activitiesError,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedActivity(1, 10);

  if (statsLoading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
      </div>
    );
  }

  if (statsError) {
    return (
      <Card className="error-card">
        <CardContent>
          <h2>Error loading dashboard</h2>
          <p>{statsError.message}</p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Oversigt over sagsbehandlingssystem</p>
        </div>
        <div className="dashboard-actions">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Opdater
          </Button>
          </div>
      </div>

      {/* Stats Grid - Matches design system StatCard */}
      <div className="stats-grid">
        <StatCard
          title="Afsluttede Sager"
          value={stats?.total_projekttyper || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          change="+12%"
          trend="up"
        />

        <StatCard
          title="Aktive Sager"
          value={stats?.active_projekter || 0}
          icon={<Clock className="w-5 h-5" />}
          change="+8%"
          trend="up"
        />

        <StatCard
          title="Sager Oprettet Seneste År"
          value={stats?.total_projekter || 0}
          icon={<Calendar className="w-5 h-5" />}
          change="+15%"
          trend="up"
        />

        <StatCard
          title="Aktive Sager Med Påbud"
          value={stats?.total_haendelser || 0}
          icon={<HourglassIcon className="w-5 h-5" />}
          trend="neutral"
        />
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Recent Activity Card */}
        <Card className="activity-card">
          <CardHeader>
            <CardTitle>Seneste Aktivitet</CardTitle>
            <Badge variant="info">{activities?.length || 0} aktiviteter</Badge>
          </CardHeader>
          <CardContent>
            {activitiesLoading && !activities ? (
              <div className="activity-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton activity-skeleton"></div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="activity-error">
                <p>Kunne ikke hente aktiviteter</p>
                <p className="text-sm">{activitiesError.message}</p>
              </div>
            ) : activities && activities.length > 0 ? (
              <>
                <div className="activity-list">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-header">
                        <Badge
                          variant={
                            activity.type === 'project'
                              ? 'info'
                              : activity.type === 'event'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {activity.type === 'project' ? (
                            <><Wrench className="w-4 h-4 mr-1" /> Projekt</>
                          ) : activity.type === 'event' ? (
                            <><CalendarDays className="w-4 h-4 mr-1" /> Hændelse</>
                          ) : (
                            <><Scale className="w-4 h-4 mr-1" /> Sag</>
                          )}
                        </Badge>
                        <span className="activity-time">
                          {new Date(activity.timestamp).toLocaleDateString('da-DK', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="activity-description">{activity.description}</div>
                      {activity.user && (
                        <div className="activity-user flex items-center">
                          <User className="w-4 h-4 mr-1 text-gray-500" />
                          {activity.user}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevPage}
                      disabled={!hasPrevPage || activitiesLoading}
                    >
                      ← Forrige
                    </Button>

                    <span className="pagination-info">
                      Side {page} af {totalPages}
                    </span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextPage}
                      disabled={!hasNextPage || activitiesLoading}
                    >
                      Næste →
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <Inbox className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>Ingen aktiviteter endnu</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="quick-actions-card">
          <CardHeader>
            <CardTitle>Hurtige handlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="quick-actions-list">
  
              <button className="quick-action-item">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <div className="action-content">
                  <div className="action-title">Se rapport</div>
                  <div className="action-subtitle">Månedlig oversigt</div>
                </div>
              </button>

              <button className="quick-action-item">
                <Download className="w-5 h-5 text-indigo-500" />
                <div className="action-content">
                  <div className="action-title">Import data</div>
                  <div className="action-subtitle">Fra Excel eller CSV</div>
                </div>
              </button>

              <button className="quick-action-item">
                <Search className="w-5 h-5 text-purple-500" />
                <div className="action-content">
                  <div className="action-title">Søg i arkiv</div>
                  <div className="action-subtitle">Find tidligere sager</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
