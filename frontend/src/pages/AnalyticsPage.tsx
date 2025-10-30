import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ThemeToggle';
import { 
  TrendingUp, 
  BarChart3, 
  Wrench, 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  Clock 
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface AnalyticsData {
  monthly_overview: {
    created_cases: number;
    completed_cases: number;
    active_cases: number;
    completion_rate: number;
  };
  projekttype_distribution: {
    separering: number;
    aabenland: number;
    other: number;
  };
  processing_times: {
    average_days: number;
    by_projekttype: Array<{
      name: string;
      average_days: number;
    }>;
  };
  paabud_statistics: {
    total_paabud: number;
    active_paabud: number;
    overdue_paabud: number;
    completion_rate: number;
  };
  monthly_trends: Array<{
    month: string;
    created: number;
    completed: number;
  }>;
  forecasts?: {
    monthly_forecast: any;
    capacity_forecast: any;
    seasonal_analysis: any;
  };
}

// Long-term Forecast Component
function LongTermForecastSection({ currentData, monthlyTrends, selectedProjekttype, dashboardStats }: { 
  currentData: any, 
  monthlyTrends: any[],
  selectedProjekttype: string,
  dashboardStats: any
}) {
  const [forecastYears, setForecastYears] = useState(10);
  const [showDetails, setShowDetails] = useState(false);

  // Get projekttype-specific title and description
  const getProjectTypeInfo = () => {
    switch (selectedProjekttype) {
      case 'separering':
        return {
          title: 'Separering Sager - Langsigtet Prognose',
          description: 'Prognose for færdigmeldte og oprettede separering sager'
        };
      case 'aabenland':
        return {
          title: 'Åben Land Sager - Langsigtet Prognose',
          description: 'Prognose for færdigmeldte og oprettede åbentland sager'
        };
      default:
        return {
          title: 'Alle Sager - Langsigtet Prognose',
          description: 'Prognose for færdigmeldte og oprettede sager (alle typer)'
        };
    }
  };

  // Calculate trend from historical data
  const calculateTrend = () => {
    if (!monthlyTrends || monthlyTrends.length < 2) {
      // Default growth rates based on projekttype
      const defaults = {
        'separering': { completedGrowth: 0.025, createdGrowth: 0.018 }, // Separering har typisk højere vækst
        'aabenland': { completedGrowth: 0.015, createdGrowth: 0.012 }, // Åben Land mere stabil
        'alle': { completedGrowth: 0.02, createdGrowth: 0.015 }
      };
      return defaults[selectedProjekttype as keyof typeof defaults] || defaults.alle;
    }
    
    const recentMonths = monthlyTrends.slice(-6); // Last 6 months
    const avgCompleted = recentMonths.reduce((sum, m) => sum + m.completed, 0) / recentMonths.length;
    const avgCreated = recentMonths.reduce((sum, m) => sum + m.created, 0) / recentMonths.length;
    
    // Projekttype-specific growth estimates
    let completedGrowth, createdGrowth;
    
    if (selectedProjekttype === 'separering') {
      // Separering sager har typisk højere vækstrate
      completedGrowth = Math.max(0.015, Math.min(0.06, avgCompleted / 800)); // 1.5-6% årlig vækst
      createdGrowth = Math.max(0.01, Math.min(0.04, avgCreated / 800)); // 1-4% årlig vækst
    } else if (selectedProjekttype === 'aabenland') {
      // Åben Land sager mere stabile
      completedGrowth = Math.max(0.008, Math.min(0.03, avgCompleted / 1200)); // 0.8-3% årlig vækst
      createdGrowth = Math.max(0.005, Math.min(0.02, avgCreated / 1200)); // 0.5-2% årlig vækst
    } else {
      // Alle sager samlet
      completedGrowth = Math.max(0.01, Math.min(0.05, avgCompleted / 1000)); // 1-5% årlig vækst
      createdGrowth = Math.max(0.005, Math.min(0.03, avgCreated / 1000)); // 0.5-3% årlig vækst
    }
    
    return { completedGrowth, createdGrowth };
  };

  const { completedGrowth, createdGrowth } = calculateTrend();
  const { title, description } = getProjectTypeInfo();
  
  // Get current total based on projekttype
  const getCurrentTotal = () => {
    // Use actual dashboard stats if available
    if (dashboardStats) {
      return dashboardStats.total_projekttyper || 0;
    }
    
    // Fallback values
    switch (selectedProjekttype) {
      case 'separering':
        return 7977; // Fallback
      case 'aabenland':
        return 1687; // Fallback
      default:
        return 9664; // Fallback
    }
  };
  
  // Generate forecast data
  const generateForecast = () => {
    const currentYear = new Date().getFullYear();
    const baseCompleted = currentData?.completed_cases || 0;
    const baseCreated = currentData?.created_cases || 0;
    
    const currentTotalCompleted = getCurrentTotal();
    
    const forecastData = [];
    let cumulativeCompleted = currentTotalCompleted;
    
    for (let i = 0; i <= forecastYears; i += 5) {
      const year = currentYear + i;
      const annualCompletedForecast = Math.round(baseCompleted * Math.pow(1 + completedGrowth, i));
      const annualCreatedForecast = Math.round(baseCreated * Math.pow(1 + createdGrowth, i));
      
      // Beregn akkumuleret total over 5 år
      if (i > 0) {
        // Tilføj 5 års værdi af afsluttede sager
        const fiveYearCompleted = annualCompletedForecast * 5;
        cumulativeCompleted += fiveYearCompleted;
      }
      
      forecastData.push({
        year,
        annualCompleted: annualCompletedForecast,
        annualCreated: annualCreatedForecast,
        totalCompleted: Math.round(cumulativeCompleted),
        efficiency: Math.round((annualCompletedForecast / Math.max(annualCreatedForecast, 1)) * 100)
      });
    }
    
    return forecastData;
  };

  const forecastData = generateForecast();

  return (
    <div>
      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Prognose periode:
          </label>
          <select
            value={forecastYears}
            onChange={(e) => setForecastYears(Number(e.target.value))}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '14px'
            }}
          >
            <option value={5}>5 år</option>
            <option value={10}>10 år</option>
            <option value={15}>15 år</option>
            <option value={20}>20 år</option>
            <option value={25}>25 år</option>
            <option value={30}>30 år</option>
          </select>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-light)',
            background: showDetails ? 'var(--primary)' : 'var(--bg-primary)',
            color: showDetails ? 'white' : 'var(--text-primary)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          {showDetails ? 'Skjul detaljer' : 'Vis detaljer'}
        </button>
      </div>

      {/* Forecast Chart */}
      <div style={{ height: '400px', marginBottom: '24px' }}>
        <Line
          data={{
            labels: forecastData.map(d => d.year.toString()),
            datasets: [
              {
                label: `Årlige færdigmeldte ${selectedProjekttype === 'alle' ? 'sager' : selectedProjekttype + ' sager'}`,
                data: forecastData.map(d => d.annualCompleted),
                borderColor: 'var(--success)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.1,
                fill: false
              },
              {
                label: `Årlige oprettede ${selectedProjekttype === 'alle' ? 'sager' : selectedProjekttype + ' sager'}`,
                data: forecastData.map(d => d.annualCreated),
                borderColor: 'var(--primary)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1,
                fill: false
              },
              {
                label: `Total akkumulerede færdigmeldte sager`,
                data: forecastData.map(d => d.totalCompleted),
                borderColor: 'var(--accent)',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.1,
                fill: false,
                yAxisID: 'y1'
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: `${title} (${forecastYears} år frem)`
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Årlige sager'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Total akkumulerede sager'
                },
                grid: {
                  drawOnChartArea: false,
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'År'
                }
              }
            }
          }}
        />
      </div>

      {/* Key Insight - Total Accumulated */}
      <div style={{ 
        marginBottom: '24px',
        padding: '24px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
        borderRadius: '12px',
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          🎯 Nøgletal: Total Færdigmeldte Sager
        </div>
        <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
          {forecastData.find(d => d.year === new Date().getFullYear() + 10)?.totalCompleted.toLocaleString() || 'N/A'}
        </div>
        <div style={{ fontSize: '18px', opacity: 0.9 }}>
          Forventet total om 10 år (2035)
        </div>
        <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '8px' }}>
          Fra nuværende {getCurrentTotal().toLocaleString()} til {forecastData.find(d => d.year === new Date().getFullYear() + 10)?.totalCompleted.toLocaleString() || 'N/A'} sager
        </div>
      </div>

      {/* Forecast Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '16px'
      }}>
        {forecastData.map((item) => (
          <div key={item.year} style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              {item.year}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Årlige færdigmeldte: <strong style={{ color: 'var(--success)' }}>{item.annualCompleted.toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Årlige oprettede: <strong style={{ color: 'var(--primary)' }}>{item.annualCreated.toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px', fontWeight: 'bold' }}>
              Total færdigmeldte: <strong style={{ color: 'var(--accent)' }}>{item.totalCompleted.toLocaleString()}</strong>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Effektivitet: <strong style={{ color: 'var(--warning)' }}>{item.efficiency}%</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Details */}
      {showDetails && (
        <div style={{
          padding: '16px',
          background: 'var(--bg-secondary)',
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Prognose Metodologi:
          </h4>
          <p style={{ marginBottom: '12px', fontStyle: 'italic' }}>{description}</p>
          <ul style={{ paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>Vækstrate færdigmeldte:</strong> {(completedGrowth * 100).toFixed(1)}% årligt</li>
            <li><strong>Vækstrate oprettede:</strong> {(createdGrowth * 100).toFixed(1)}% årligt</li>
            <li><strong>Baseret på:</strong> Seneste 6 måneders data og historiske trends</li>
            <li><strong>Antagelser:</strong> Konstant vækstrate, ingen større strukturelle ændringer</li>
            <li><strong>Usikkerhed:</strong> Prognosen bliver mindre præcis jo længere ud i fremtiden</li>
          </ul>
          
          <div style={{ marginTop: '12px', padding: '8px', background: 'var(--warning-bg)', borderRadius: '4px' }}>
            <strong style={{ display: 'flex', alignItems: 'center' }}>
              <AlertTriangle className="w-4 h-4 mr-1" />
              Bemærk:
            </strong> Dette er en matematisk projektion baseret på historiske data. 
            Faktiske resultater kan variere betydeligt på grund af policy ændringer, ressource allokering, 
            og eksterne faktorer.
          </div>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjekttype, setSelectedProjekttype] = useState<'alle' | 'separering' | 'aabenland'>('alle');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0], // Last year
    to: new Date().toISOString().split('T')[0] // Today
  });

  const fetchDashboardStats = async () => {
    try {
      let statsUrl = '/api/dashboard/stats'; // Default
      
      if (selectedProjekttype === 'separering') {
        statsUrl = '/api/dashboard/separering/stats';
      } else if (selectedProjekttype === 'aabenland') {
        statsUrl = '/api/dashboard/aabenland/stats';
      }
      
      const response = await fetch(statsUrl);
      if (response.ok) {
        const result = await response.json();
        setDashboardStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Build API URLs with projekttype filter
      // Map frontend values to database values
      const projekttypeMapping: Record<string, string> = {
        'separering': 'separering',
        'aabenland': 'åben'  // Map to "åben" to match "Åben Land" in database
      };
      
      const projekttypeValue = selectedProjekttype !== 'alle' ? projekttypeMapping[selectedProjekttype] || selectedProjekttype : '';
      const projekttypeParam = projekttypeValue ? `&projekttype_navn=${projekttypeValue}` : '';
      
      // Build URLs with cache busting timestamp and no-cache headers
      const timestamp = Date.now();
      const cacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      const monthlyUrl = `/api/reports/monthly?year=${currentYear}&month=${currentMonth}${projekttypeParam}&_t=${timestamp}`;
      const projekttypeUrl = `/api/reports/projekttyper?from=${dateRange.from}&to=${dateRange.to}${projekttypeParam}&_t=${timestamp}`;
      const timesUrl = `/api/reports/sagsbehandlingstider${projekttypeValue ? `?projekttype_navn=${projekttypeValue}&_t=${timestamp}` : `?_t=${timestamp}`}`;
      const paabudUrl = `/api/reports/paabud?from=${dateRange.from}&to=${dateRange.to}${projekttypeParam}&_t=${timestamp}`;
      const trendsUrl = `/api/reports/monthly-trends?year=${currentYear}${projekttypeParam}&_t=${timestamp}`;
      
      // Build forecast URLs
      const monthlyForecastUrl = `/api/forecasts/monthly-cases${projekttypeValue ? `?projekttype_navn=${projekttypeValue}&_t=${timestamp}` : `?_t=${timestamp}`}`;
      const capacityForecastUrl = `/api/forecasts/capacity-planning${projekttypeValue ? `?projekttype_navn=${projekttypeValue}&_t=${timestamp}` : `?_t=${timestamp}`}`;
      const seasonalAnalysisUrl = `/api/forecasts/seasonal-analysis${projekttypeValue ? `?projekttype_navn=${projekttypeValue}&_t=${timestamp}` : `?_t=${timestamp}`}`;

      console.log('API URLs:', {
        monthlyUrl,
        projekttypeUrl,
        timesUrl,
        paabudUrl,
        trendsUrl
      });
      
      // Fetch all data in parallel with no-cache headers
      const [monthlyRes, projekttypeRes, timesRes, paabudRes, trendsRes, forecastMonthlyRes, forecastCapacityRes, forecastSeasonalRes] = await Promise.all([
        fetch(monthlyUrl, { headers: cacheHeaders }),
        fetch(projekttypeUrl, { headers: cacheHeaders }),
        fetch(timesUrl, { headers: cacheHeaders }),
        fetch(paabudUrl, { headers: cacheHeaders }),
        fetch(trendsUrl, { headers: cacheHeaders }),
        fetch(monthlyForecastUrl, { headers: cacheHeaders }),
        fetch(capacityForecastUrl, { headers: cacheHeaders }),
        fetch(seasonalAnalysisUrl, { headers: cacheHeaders })
      ]);

      const [monthly, projekttype, times, paabud, trends, forecastMonthly, forecastCapacity, forecastSeasonal] = await Promise.all([
        monthlyRes.json(),
        projekttypeRes.json(),
        timesRes.json(),
        paabudRes.json(),
        trendsRes.json(),
        forecastMonthlyRes.json(),
        forecastCapacityRes.json(),
        forecastSeasonalRes.json()
      ]);

      // Debug logging
      console.log('API Responses:', {
        monthly: monthly.data,
        projekttype: projekttype.data,
        times: times.data,
        paabud: paabud.data,
        trends: trends.data
      });

      // Transform API data to component format
      const transformedData: AnalyticsData = {
        monthly_overview: {
          created_cases: monthly.data?.created_cases || 0,
          completed_cases: monthly.data?.completed_cases || 0,
          active_cases: monthly.data?.active_cases || 0,
          completion_rate: monthly.data?.completion_rate || 0
        },
        projekttype_distribution: {
          separering: projekttype.data?.distribution?.find((d: any) => 
            d.projekttype?.toLowerCase().includes('separering')
          )?.count || 0,
          aabenland: projekttype.data?.distribution?.find((d: any) => 
            d.projekttype?.toLowerCase().includes('åben') || 
            d.projekttype?.toLowerCase().includes('åbentland')
          )?.count || 0,
          other: projekttype.data?.distribution?.filter((d: any) => 
            !d.projekttype?.toLowerCase().includes('separering') && 
            !d.projekttype?.toLowerCase().includes('åben') &&
            !d.projekttype?.toLowerCase().includes('åbentland')
          ).reduce((sum: number, d: any) => sum + d.count, 0) || 0
        },
        processing_times: {
          average_days: times.data?.overall_average_days || 0,
          by_projekttype: times.data?.by_projekttype?.map((item: any) => ({
            name: item.projekttype,
            average_days: item.average_days
          })) || []
        },
        paabud_statistics: {
          total_paabud: paabud.data?.total_paabud || 0,
          active_paabud: paabud.data?.active_paabud || 0,
          overdue_paabud: paabud.data?.overdue_paabud || 0,
          completion_rate: paabud.data?.completion_rate || 0
        },
        monthly_trends: trends.data?.monthly_trends?.map((item: any) => ({
          month: item.month_name,
          created: item.created,
          completed: item.completed
        })) || [],
        forecasts: {
          monthly_forecast: forecastMonthly.data || null,
          capacity_forecast: forecastCapacity.data || null,
          seasonal_analysis: forecastSeasonal.data || null
        }
      };

      console.log('Transformed Data:', transformedData);
      setData(transformedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      // Fallback to mock data on error
      setData({
        monthly_overview: { created_cases: 0, completed_cases: 0, active_cases: 0, completion_rate: 0 },
        projekttype_distribution: { separering: 0, aabenland: 0, other: 0 },
        processing_times: { average_days: 0, by_projekttype: [] },
        paabud_statistics: { total_paabud: 0, active_paabud: 0, overdue_paabud: 0, completion_rate: 0 },
        monthly_trends: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalyticsData();
  }, [dateRange, selectedProjekttype]);

  const exportToExcel = async (type: string) => {
    try {
      const response = await fetch(
        `/api/reports/export/excel?type=${type}&from=${dateRange.from}&to=${dateRange.to}`
      );
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div>Indlæser analytics data...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <div>Ingen data tilgængelig</div>
        </div>
      </div>
    );
  }

  // Chart data preparation
  const projekttypeChartData = {
    labels: ['Separering', 'Åben Land', 'Andre'],
    datasets: [
      {
        data: [
          data.projekttype_distribution.separering,
          data.projekttype_distribution.aabenland,
          data.projekttype_distribution.other
        ],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
        borderWidth: 1,
      },
    ],
  };

  const monthlyTrendsData = {
    labels: data.monthly_trends.map(item => item.month),
    datasets: [
      {
        label: 'Oprettede',
        data: data.monthly_trends.map(item => item.created),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'Afsluttede',
        data: data.monthly_trends.map(item => item.completed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  };

  const processingTimesData = {
    labels: data.processing_times.by_projekttype.map(item => item.name),
    datasets: [
      {
        label: 'Gennemsnitlige dage',
        data: data.processing_times.by_projekttype.map(item => item.average_days),
        backgroundColor: '#f59e0b',
        borderColor: '#d97706',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="dashboard">
      {/* Analytics Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            <TrendingUp className="inline-block w-6 h-6 mr-2" />
            Analytics & Rapporter
          </h1>
          <p className="dashboard-subtitle">
            Komplet oversigt over sagsbehandling og performance
            <span style={{ 
              marginLeft: '8px', 
              fontSize: '12px', 
              color: 'var(--text-tertiary)',
              fontWeight: 'normal'
            }}>
              ({dateRange.from} til {dateRange.to})
            </span>
          </p>
        </div>
        <div className="dashboard-actions">
          <ThemeToggle />
          
          {/* Date Range Picker */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px', 
            padding: '8px' 
          }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Fra:</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Til:</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              style={{
                padding: '4px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            />
            
            {/* Quick Date Presets */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setDateRange({
                  from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0]
                })}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                30d
              </button>
              <button
                onClick={() => setDateRange({
                  from: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0]
                })}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                90d
              </button>
              <button
                onClick={() => setDateRange({
                  from: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
                  to: new Date().toISOString().split('T')[0]
                })}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                1år
              </button>
            </div>
          </div>
          
          {/* Projekttype Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            alignItems: 'center', 
            background: 'var(--bg-secondary)', 
            borderRadius: '8px', 
            padding: '4px' 
          }}>
            <button
              onClick={() => setSelectedProjekttype('alle')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: selectedProjekttype === 'alle' ? 'var(--primary)' : 'transparent',
                color: selectedProjekttype === 'alle' ? 'white' : 'var(--text-secondary)',
                fontWeight: selectedProjekttype === 'alle' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Alle
            </button>
            <button
              onClick={() => setSelectedProjekttype('separering')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: selectedProjekttype === 'separering' ? 'var(--primary)' : 'transparent',
                color: selectedProjekttype === 'separering' ? 'white' : 'var(--text-secondary)',
                fontWeight: selectedProjekttype === 'separering' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Separering
            </button>
            <button
              onClick={() => setSelectedProjekttype('aabenland')}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: selectedProjekttype === 'aabenland' ? 'var(--primary)' : 'transparent',
                color: selectedProjekttype === 'aabenland' ? 'white' : 'var(--text-secondary)',
                fontWeight: selectedProjekttype === 'aabenland' ? 'bold' : 'normal',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Åben Land
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>
              {data.monthly_overview.created_cases}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Sager Oprettet</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '8px' }}>
              {data.monthly_overview.completed_cases}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Sager Afsluttet</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--warning)', marginBottom: '8px' }}>
              {data.monthly_overview.active_cases}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Aktive Sager</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '8px' }}>
              {data.monthly_overview.completion_rate}%
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Afslutningsrate</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Projekttype Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>
              <Wrench className="inline-block w-5 h-5 mr-2" />
              Projekttype Fordeling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Pie 
                data={projekttypeChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom' as const,
                    },
                    title: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>
              <TrendingUp className="inline-block w-5 h-5 mr-2" />
              Månedlige Tendenser
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Line 
                data={monthlyTrendsData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Processing Times */}
        <Card>
          <CardHeader>
            <CardTitle>⏱️ Sagsbehandlingstider</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: '300px' }}>
              <Bar 
                data={processingTimesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    },
                    title: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Dage'
                      }
                    }
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Påbud Statistics - Only show for "Alle" */}
      {selectedProjekttype === 'alle' && (
        <div style={{ marginBottom: '32px' }}>
          <Card>
            <CardHeader>
              <CardTitle>
                <AlertTriangle className="inline-block w-5 h-5 mr-2" />
                Påbud Statistik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>
                    {data.paabud_statistics.total_paabud}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total Påbud</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--warning)' }}>
                    {data.paabud_statistics.active_paabud}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Aktive Påbud</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>
                    {data.paabud_statistics.overdue_paabud}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Overskredet</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                    {data.paabud_statistics.completion_rate}%
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Afslutningsrate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Forecast Analytics Section */}
      {data.forecasts && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
            <TrendingUp className="w-6 h-6 mr-2" />
            Forecast & Prognose Analyser
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Monthly Forecast */}
            {data.forecasts.monthly_forecast && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <TrendingUp className="inline-block w-5 h-5 mr-2" />
                    Månedlig Sags Prognose
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                      {data.forecasts.monthly_forecast.summary?.forecasted_total || 0}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Forventede sager næste 6 måneder
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {data.forecasts.monthly_forecast.trend_analysis?.direction === 'increasing' ? (
                          <TrendingUp className="w-5 h-5 mr-1" />
                        ) : data.forecasts.monthly_forecast.trend_analysis?.direction === 'decreasing' ? (
                          <TrendingDown className="w-5 h-5 mr-1" />
                        ) : (
                          <ArrowRight className="w-5 h-5 mr-1" />
                        )}
                        {data.forecasts.monthly_forecast.trend_analysis?.direction === 'increasing' ? ' Stigende' :
                         data.forecasts.monthly_forecast.trend_analysis?.direction === 'decreasing' ? ' Faldende' : ' Stabil'}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Trend retning</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {Math.round(data.forecasts.monthly_forecast.trend_analysis?.confidence || 0)}%
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Prognose sikkerhed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Capacity Forecast */}
            {data.forecasts.capacity_forecast && (
              <Card>
                <CardHeader>
                  <CardTitle>⚖️ Kapacitetsplanlægning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 
                      data.forecasts.capacity_forecast.recommendations?.status === 'overloaded' ? 'var(--error)' :
                      data.forecasts.capacity_forecast.recommendations?.status === 'near_capacity' ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {Math.round(data.forecasts.capacity_forecast.current_metrics?.capacity_utilization || 0)}%
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Kapacitetsudnyttelse
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        {Math.round(data.forecasts.capacity_forecast.current_metrics?.avg_processing_days || 0)} dage
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Gennemsnitlig behandlingstid</div>
                    </div>
                  </div>

                  {data.forecasts.capacity_forecast.recommendations?.priority_actions && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '8px' }}>Anbefalinger:</div>
                      {data.forecasts.capacity_forecast.recommendations.priority_actions.map((action: string, index: number) => (
                        <div key={index} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          • {action}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Seasonal Analysis */}
            {data.forecasts.seasonal_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>🌍 Sæsonanalyse</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
                      Peak måneder:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {data.forecasts.seasonal_analysis.insights?.peak_months?.map((month: string, index: number) => (
                        <span key={index} style={{ 
                          padding: '4px 8px', 
                          background: 'var(--warning-bg)', 
                          color: 'var(--warning-text)', 
                          borderRadius: '4px', 
                          fontSize: '0.875rem' 
                        }}>
                          {month}
                        </span>
                      )) || <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ingen tydelige peaks</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>
                      Lave måneder:
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {data.forecasts.seasonal_analysis.insights?.low_months?.map((month: string, index: number) => (
                        <span key={index} style={{ 
                          padding: '4px 8px', 
                          background: 'var(--primary-bg)', 
                          color: 'var(--primary-text)', 
                          borderRadius: '4px', 
                          fontSize: '0.875rem' 
                        }}>
                          {month}
                        </span>
                      )) || <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Ingen tydelige lavperioder</span>}
                    </div>
                  </div>

                  {data.forecasts.seasonal_analysis.recommendations && (
                    <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '8px' }}>Sæson anbefalinger:</div>
                      {data.forecasts.seasonal_analysis.recommendations.map((rec: string, index: number) => (
                        <div key={index} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          • {rec}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Long-term Forecast */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Card>
                <CardHeader>
                  <CardTitle>🔮 Langsigtet Prognose - Færdigmeldte & Afsluttede Sager</CardTitle>
                </CardHeader>
                <CardContent>
                  <LongTermForecastSection 
                    currentData={data.monthly_overview}
                    monthlyTrends={data.monthly_trends}
                    selectedProjekttype={selectedProjekttype}
                    dashboardStats={dashboardStats}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div style={{ marginBottom: '24px' }}>
        <Card>
          <CardHeader>
            <CardTitle>
              <BarChart3 className="inline-block w-5 h-5 mr-2" />
              Eksporter Rapporter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Button onClick={() => exportToExcel('monthly')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Månedlig Rapport (Excel)
              </Button>
              <Button onClick={() => exportToExcel('projekttyper')}>
                <Wrench className="w-4 h-4 mr-2" />
                Projekttype Analyse (Excel)
              </Button>
              <Button onClick={() => exportToExcel('tider')}>
                <Clock className="w-4 h-4 mr-2" />
                Sagsbehandlingstider (Excel)
              </Button>
              <Button onClick={() => exportToExcel('paabud')}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Påbud Rapport (Excel)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
