/**
 * Nedsivningstilladelse Dashboard Page Component
 * Dedicated dashboard for Nedsivningstilladelse project cases
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, StatCard, Button, Badge } from '@/components/ui';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Droplets,
  RefreshCw,
  CheckCircle,
  Clock,
  Calendar,
  AlertTriangle,
  BarChart3,
  Search,
  Map,
  Eye
} from 'lucide-react';
import './Dashboard.css';

interface NedsivningstilladelseStats {
  total_projekttyper: number;  // Afsluttede Nedsivningstilladelse sager
  active_projekter: number;    // Aktive Nedsivningstilladelse sager
  total_projekter: number;     // Nedsivningstilladelse sager oprettet seneste år
  total_haendelser: number;    // Nedsivningstilladelse sager med påbud (total)
  active_haendelser?: number;  // Nedsivningstilladelse sager med påbud (aktive)
}

interface NedsivningstilladelseActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  projekt_navn?: string;
  fuld_adresse?: string;
  beliggenhed?: string;
  projekttype_navn?: string;
  OprettetDato?: string;
  FærdigmeldtInt?: number;
  AfsluttetInt?: number;
  Påbud?: string;
  metadata?: {
    case_id: number;
    project: string;
    status: string;
  };
}

export function NedsivningstilladelseDashboard() {
  const [stats, setStats] = useState<NedsivningstilladelseStats | null>(null);
  const [activities, setActivities] = useState<NedsivningstilladelseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNedsivningstilladelseData = async () => {
    try {
      setLoading(true);
      console.log('[NEDSIVNINGSTILLADELSE] Starting data fetch...');

      // Fetch Nedsivningstilladelse stats
      const statsResponse = await fetch('/api/dashboard/nedsivningstilladelse/stats');
      if (!statsResponse.ok) throw new Error(`Stats API error: ${statsResponse.status}`);
      const statsData = await statsResponse.json();
      console.log('[NEDSIVNINGSTILLADELSE] Stats data:', statsData);
      setStats(statsData.data);

      // Fetch Nedsivningstilladelse recent activity
      const activityResponse = await fetch('/api/dashboard/nedsivningstilladelse/recent-activity?page=1&per_page=20');
      if (!activityResponse.ok) throw new Error(`Activity API error: ${activityResponse.status}`);
      const activityData = await activityResponse.json();
      console.log('[NEDSIVNINGSTILLADELSE] Activity data:', activityData);

      // Ensure activities is always an array
      const activities = Array.isArray(activityData.data) ? activityData.data : [];
      setActivities(activities);

      setError(null);
      console.log('[NEDSIVNINGSTILLADELSE] Data fetch completed successfully');
    } catch (err) {
      console.error('[NEDSIVNINGSTILLADELSE] Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActivities([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNedsivningstilladelseData();
  }, []);

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="skeleton" style={{ width: '100%', height: '200px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="error-card">
        <CardContent>
          <h2>Error loading Nedsivningstilladelse dashboard</h2>
          <p>{error}</p>
          <Button onClick={fetchNedsivningstilladelseData} variant="primary">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="dashboard">
      {/* Nedsivningstilladelse Dashboard Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <Droplets className="inline-block w-6 h-6 mr-2" />
            Nedsivningstilladelse Dashboard
          </h1>
          <p className="dashboard-subtitle">Oversigt over nedsivningstilladelser</p>
        </div>
        <div className="dashboard-actions">
          <ThemeToggle />
          <Button variant="ghost" onClick={fetchNedsivningstilladelseData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Opdaterer...' : 'Opdater'}
          </Button>
        </div>
      </div>

      {/* Nedsivningstilladelse Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Afsluttede Nedsivningstilladelser"
          value={stats?.total_projekttyper || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          change="+12%"
          trend="up"
        />

        <StatCard
          title="Aktive Nedsivningstilladelser"
          value={stats?.active_projekter || 0}
          icon={<Clock className="w-5 h-5" />}
          change="+8%"
          trend="up"
        />

        <StatCard
          title="Nedsivningstilladelser Seneste År"
          value={stats?.total_projekter || 0}
          icon={<Calendar className="w-5 h-5" />}
          change="+15%"
          trend="up"
        />

        <Card className="stat-card">
          <CardContent className="paabud-stat-content">
            <div className="stat-header">
              <div className="stat-icon-title">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="stat-title">Nedsivningstilladelser Med Påbud</h3>
              </div>
            </div>
            <div className="paabud-stats">
              <div className="paabud-stat-row">
                <span className="paabud-label">Aktive:</span>
                <span className="paabud-value active">
                  {stats?.active_haendelser || 0}
                </span>
              </div>
              <div className="paabud-stat-row">
                <span className="paabud-label">Total:</span>
                <span className="paabud-value total">
                  {stats?.total_haendelser || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="content-grid">
        {/* Recent Nedsivningstilladelse Cases Card */}
        <Card className="activity-card">
          <CardHeader>
            <CardTitle>Seneste Nedsivningstilladelser</CardTitle>
            <Badge variant="info">{activities?.length || 0} sager</Badge>
          </CardHeader>
          <CardContent>
            {loading && !activities ? (
              <div className="activity-loading">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton activity-skeleton"></div>
                ))}
              </div>
            ) : activities && activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b-2 bg-tertiary border-light">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        Projekt
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        Adresse
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        Oprettet
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-primary" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                        Handlinger
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-surface border-light">
                    {activities.map((activity) => {
                      try {
                        return (
                          <tr key={activity.id} className="transition-colors duration-150 hover:bg-gray-50" style={{ backgroundColor: 'var(--surface)' }}>
                            <td className="px-4 py-3 text-sm font-semibold text-primary">{activity.id}</td>
                            <td className="px-4 py-3 text-sm text-primary">
                              {activity.projekt_navn || activity.description?.split(' | ')[0] || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-secondary">
                              {activity.fuld_adresse || activity.beliggenhed ||
                               (activity.description?.includes('Adresse:') ?
                                activity.description.split(' | ').find(d => d.includes('Adresse:'))?.replace('Adresse:', '').trim() : '-')}
                            </td>
                            <td className="px-4 py-3 text-sm text-secondary">
                              {activity.timestamp ? new Date(activity.timestamp).toLocaleDateString('da-DK') : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="success">
                                <Droplets className="w-3 h-3 mr-1" />
                                Nedsivningstilladelse
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.location.href = `/sager/${activity.id}`}
                                  title="Se detaljer"
                                  className="hover:bg-blue-100"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      } catch (renderError) {
                        console.error('[NEDSIVNINGSTILLADELSE] Error rendering activity:', renderError, activity);
                        return (
                          <tr key={activity.id || Math.random()}>
                            <td colSpan={6} className="px-4 py-3 text-sm text-red-500 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Fejl ved visning af sag #{activity.id || 'N/A'}
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Droplets className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p>Ingen Nedsivningstilladelser endnu</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Nedsivningstilladelse Quick Actions Card */}
        <Card className="quick-actions-card">
          <CardHeader>
            <CardTitle>Nedsivningstilladelse Handlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="quick-actions-list">
              <button className="quick-action-item">
                <BarChart3 className="w-5 h-5 text-green-500" />
                <div className="action-content">
                  <div className="action-title">Nedsivningstilladelse rapport</div>
                  <div className="action-subtitle">Månedlig oversigt</div>
                </div>
              </button>

              <button className="quick-action-item">
                <Search className="w-5 h-5 text-purple-500" />
                <div className="action-content">
                  <div className="action-title">Søg Nedsivningstilladelser</div>
                  <div className="action-subtitle">Find tidligere tilladelser</div>
                </div>
              </button>

              <button className="quick-action-item">
                <Map className="w-5 h-5 text-orange-500" />
                <div className="action-content">
                  <div className="action-title">Nedsivningstilladelse kort</div>
                  <div className="action-subtitle">Se tilladelser på kort</div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default NedsivningstilladelseDashboard;
