import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WeatherProvider, useWeather } from './context/WeatherContext';
import Dashboard from './pages/Dashboard';
import Regions from './pages/Regions';
import Alerts from './pages/Alerts';
import History from './pages/History';
import Agent from './pages/Agent';
import Reservoirs from './pages/Reservoirs';
import Features from './pages/Features';
import ErrorBoundary from './components/ErrorBoundary';
import { miscAPI } from './services/api';
import { T } from './utils/constants';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard',  icon: '🌦️', exact: true },
  { to: '/regions',    label: 'Regions',   icon: '🗺️' },
  { to: '/alerts',     label: 'Alerts',    icon: '🚨' },
  { to: '/history',    label: 'History',   icon: '📊' },
  { to: '/reservoirs', label: 'Dams',      icon: '💧' },
  { to: '/features',   label: 'Features',  icon: '🛡️' },
  { to: '/agent',      label: 'AI Agent',  icon: '🤖', highlight: true },
];

const StatusBar = () => {
  const { connected, lastUpdate } = useWeather();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    miscAPI.getStats().then(r => setStats(r.data.data)).catch(() => {});
    const i = setInterval(() => miscAPI.getStats().then(r => setStats(r.data.data)).catch(() => {}), 60000);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{ background: connected ? '#f0fdf4' : '#fff7ed', borderBottom: `1px solid ${connected ? '#bbf7d0' : '#fed7aa'}`, padding: '5px 24px', display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#4a5568' }}>
      <span style={{ color: connected ? '#16a34a' : '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#16a34a' : '#d97706', display: 'inline-block' }} />
        {connected ? 'LIVE' : 'Reconnecting...'}
      </span>
      {stats && <span>🏙️ {stats.total_cities} cities</span>}
      {stats && <span style={{ color: stats.active_alerts > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>⚠️ {stats.active_alerts} active alerts</span>}
      {lastUpdate && <span>🕐 {new Date(lastUpdate).toLocaleTimeString('en-IN')}</span>}
      <span style={{ marginLeft: 'auto', color: '#2563eb', fontWeight: 600 }}>📡 IMD via Open-Meteo · Refreshes every 10 min</span>
    </div>
  );
};

const NavBar = () => {
  const { alerts } = useWeather();
  const redAlerts = alerts.filter(a => a.alert_type === 'red' || a.alert_type === 'dark_red').length;
  return (
    <nav style={{ background: '#fff', borderBottom: '2px solid #e2e8f0', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌧️</div>
        <div>
          <div style={{ color: '#1a202c', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Gujarat Rain Alert</div>
          <div style={{ color: '#7c3aed', fontSize: 10, fontWeight: 600 }}>Powered by IBM Granite · IMD Data</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
        {NAV_ITEMS.map(({ to, label, icon, exact, highlight }) => (
          <NavLink key={to} to={to} end={exact}
            style={({ isActive }) => ({
              color: isActive ? '#2563eb' : '#4a5568',
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              background: isActive ? '#eff6ff' : highlight ? '#f5f3ff' : 'transparent',
              border: isActive ? '1px solid #bfdbfe' : highlight ? '1px solid #ddd6fe' : '1px solid transparent',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.15s',
              position: 'relative',
            })}>
            {icon} {label}
            {label === 'Alerts' && redAlerts > 0 && (
              <span style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{redAlerts}</span>
            )}
          </NavLink>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#718096' }}>🇮🇳 Gujarat, India</div>
    </nav>
  );
};

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text }}>
      <StatusBar />
      <NavBar />
      <ErrorBoundary>
        <Routes>
          <Route path="/"           element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/regions"    element={<ErrorBoundary><Regions /></ErrorBoundary>} />
          <Route path="/alerts"     element={<ErrorBoundary><Alerts /></ErrorBoundary>} />
          <Route path="/history"    element={<ErrorBoundary><History /></ErrorBoundary>} />
          <Route path="/reservoirs" element={<ErrorBoundary><Reservoirs /></ErrorBoundary>} />
          <Route path="/features"   element={<ErrorBoundary><Features /></ErrorBoundary>} />
          <Route path="/agent"      element={<ErrorBoundary><Agent /></ErrorBoundary>} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <WeatherProvider>
        <Toaster position="top-right" toastOptions={{ style: { fontSize: 13, maxWidth: 380 } }} />
        <AppContent />
      </WeatherProvider>
    </Router>
  );
}
