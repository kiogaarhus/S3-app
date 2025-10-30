/**
 * Main App Component with Sidebar Layout
 * Based on docs/REACT_DESIGN_SYSTEM.md
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SepareringDashboard from './pages/SepareringDashboard';
import AabenlandDashboard from './pages/AabenlandDashboard';
import DispensationssagDashboard from './pages/DispensationssagDashboard';
import NedsivningstilladelseDashboard from './pages/NedsivningstilladelseDashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import { SagerList } from './pages/Sager/SagerList';
import { SagDetail } from './pages/Sager/SagDetail';
import { SagForm } from './pages/Sager/SagForm';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import S3Logo from './components/S3Logo';
import { GlobalSearchBar } from './components/GlobalSearchBar';
import { Wrench, Trees, FileText, Droplets, Scale, TrendingUp, Settings, User, LogOut } from 'lucide-react';
import './App.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="app-layout">
                  <Sidebar />
                  <main className="main-content">
                    <Header />
                    <Routes>
                      <Route path="/" element={<SepareringDashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/aabenland" element={<AabenlandDashboard />} />
                      <Route path="/dispensationssag" element={<DispensationssagDashboard />} />
                      <Route path="/nedsivningstilladelse" element={<NedsivningstilladelseDashboard />} />

                      {/* Sager (Sagsbehandling) Routes */}
                      <Route path="/sagsbehandling" element={<SagerList />} />
                      <Route path="/sager" element={<SagerList />} />
                      <Route path="/sager/new" element={<SagForm />} />
                      <Route path="/sager/:id" element={<SagDetail />} />
                      <Route path="/sager/:id/edit" element={<SagForm />} />

                      <Route path="/analytics" element={<AnalyticsPage />} />
                      <Route path="/admin" element={<PlaceholderPage title="Administration" icon={<Settings className="w-12 h-12" />} />} />
                    </Routes>
                  </main>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

// Header Component with Global Search
function Header() {
  return (
    <header className="app-header">
      <div className="header-content">
        <GlobalSearchBar />
      </div>
    </header>
  );
}

// Sidebar Navigation Component
function Sidebar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Separering', icon: <Wrench className="w-5 h-5" /> },
    { path: '/aabenland', label: 'Åbenland', icon: <Trees className="w-5 h-5" /> },
    { path: '/dispensationssag', label: 'Dispensationssag', icon: <FileText className="w-5 h-5" /> },
    { path: '/nedsivningstilladelse', label: 'Nedsivningstilladelse', icon: <Droplets className="w-5 h-5" /> },
    { path: '/sagsbehandling', label: 'Sagsbehandling', icon: <Scale className="w-5 h-5" /> },
    { path: '/analytics', label: 'Analytics', icon: <TrendingUp className="w-5 h-5" /> },
    { path: '/admin', label: 'Administration', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <S3Logo height={64} />
        </div>
      </div>

      <div className="sidebar-menu">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'nav-item-active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="company-logo-section">
        <div className="company-logo-divider"></div>
        <div className="company-logo-container">
          <img 
            src="/logos/aak-logo.png" 
            alt="AAK Logo" 
            className="company-logo-img"
            style={{ height: '28px', width: 'auto', opacity: 0.8 }}
          />
        </div>
      </div>

      <SidebarFooter />
    </nav>
  );
}

// Sidebar Footer with User Info and Logout
function SidebarFooter() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="sidebar-footer">
      <div className="user-info">
        <div className="user-avatar">
          <User className="w-6 h-6" />
        </div>
        <div className="user-details">
          <div className="user-name">{user?.full_name || user?.username}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            padding: '8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Log ud"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Placeholder component for pages under development
function PlaceholderPage({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h1>{title}</h1>
      <p>Denne side er under udvikling...</p>
      <Link to="/" className="back-link">← Tilbage til Dashboard</Link>
    </div>
  );
}

export default App;
