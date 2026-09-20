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
  { to: '/',           label: 'Dashboard', icon: '🌦️', exact: true },
  { to: '/regions',    label: 'Regions',   icon: '🗺️' },
  { to: '/alerts',     label: 'Alerts',    icon: '🚨' },
  { to: '/history',    label: 'History',   icon: '📊' },
  { to: '/reservoirs', label: 'Dams',      icon: '💧' },
  { to: '/features',   label: 'Features',  icon: '🛡️' },
  { to: '/agent',      label: 'AI Agent',  icon: '🤖', highlight: true },
];

// ── responsive hook ───────────────────────────────────────────────────
const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return mobile;
};

// ── Status bar (desktop only) ─────────────────────────────────────────
const StatusBar = () => {
  const { connected, lastUpdate } = useWeather();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState(null);
  useEffect(() => {
    miscAPI.getStats().then(r => setStats(r.data.data)).catch(() => {});
    const i = setInterval(() => miscAPI.getStats().then(r => setStats(r.data.data)).catch(() => {}), 60000);
    return () => clearInterval(i);
  }, []);
  if (isMobile) return null;
  return (
    <div style={{ background: connected ? '#f0fdf4' : '#fff7ed', borderBottom: `1px solid ${connected ? '#bbf7d0' : '#fed7aa'}`, padding: '5px 24px', display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#4a5568' }}>
      <span style={{ color: connected ? '#16a34a' : '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#16a34a' : '#d97706', display: 'inline-block' }} />
        {connected ? 'LIVE' : 'Reconnecting...'}
      </span>
      {stats && <span>🏙️ {stats.total_cities} cities</span>}
      {stats && <span style={{ color: stats.active_alerts > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>⚠️ {stats.active_alerts} active alerts</span>}
      {lastUpdate && <span>🕐 {new Date(lastUpdate).toLocaleTimeString('en-IN')}</span>}
      <span style={{ marginLeft: 'auto', color: '#2563eb', fontWeight: 600 }}>📡 IMD · Refreshes every 10 min</span>
    </div>
  );
};

// ── Desktop top navbar ────────────────────────────────────────────────
const DesktopNav = ({ redAlerts }) => (
  <nav style={{ background: '#fff', borderBottom: '2px solid #e2e8f0', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 100 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 28, flexShrink: 0 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🌧️</div>
      <div>
        <div style={{ color: '#1a202c', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Gujarat Rain Alert</div>
        <div style={{ color: '#7c3aed', fontSize: 10, fontWeight: 600 }}>Powered by IBM Granite · IMD Data</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 2, flex: 1 }}>
      {NAV_ITEMS.map(({ to, label, icon, exact, highlight }) => (
        <NavLink key={to} to={to} end={exact}
          style={({ isActive }) => ({
            color: isActive ? '#2563eb' : '#4a5568',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: isActive ? 700 : 500,
            background: isActive ? '#eff6ff' : highlight ? '#f5f3ff' : 'transparent',
            border: isActive ? '1px solid #bfdbfe' : highlight ? '1px solid #ddd6fe' : '1px solid transparent',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s',
            position: 'relative',
            whiteSpace: 'nowrap',
          })}>
          {icon} {label}
          {label === 'Alerts' && redAlerts > 0 && (
            <span style={{ background: '#dc2626', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{redAlerts}</span>
          )}
        </NavLink>
      ))}
    </div>
    <div style={{ fontSize: 12, color: '#718096', flexShrink: 0 }}>🇮🇳 Gujarat</div>
  </nav>
);

// ── Mobile top header (just logo + live badge) ────────────────────────
const MobileHeader = ({ connected }) => (
  <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌧️</div>
      <div>
        <div style={{ color: '#1a202c', fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>Gujarat Rain Alert</div>
        <div style={{ color: '#7c3aed', fontSize: 9, fontWeight: 600 }}>IBM Granite · IMD Live</div>
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: connected ? '#f0fdf4' : '#fff7ed', border: `1px solid ${connected ? '#bbf7d0' : '#fed7aa'}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, color: connected ? '#16a34a' : '#d97706', fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#16a34a' : '#d97706', display: 'inline-block' }} />
      {connected ? 'LIVE' : 'Offline'}
    </div>
  </div>
);

// ── Mobile bottom tab bar ─────────────────────────────────────────────
const MobileBottomNav = ({ redAlerts }) => (
  <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', zIndex: 200, boxShadow: '0 -2px 10px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
    {NAV_ITEMS.map(({ to, label, icon, exact }) => (
      <NavLink key={to} to={to} end={exact}
        style={({ isActive }) => ({
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 2px 4px',
          textDecoration: 'none',
          color: isActive ? '#2563eb' : '#94a3b8',
          borderTop: isActive ? '2px solid #2563eb' : '2px solid transparent',
          background: isActive ? '#f0f7ff' : 'transparent',
          position: 'relative',
          minWidth: 0,
        })}>
        <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 600, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', textAlign: 'center' }}>{label}</span>
        {label === 'Alerts' && redAlerts > 0 && (
          <span style={{ position: 'absolute', top: 4, right: '50%', transform: 'translateX(10px)', background: '#dc2626', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{redAlerts}</span>
        )}
      </NavLink>
    ))}
  </nav>
);

function AppContent() {
  const isMobile = useIsMobile();
  const { alerts, connected } = useWeather();
  const redAlerts = alerts.filter(a => a.alert_type === 'red' || a.alert_type === 'dark_red').length;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, paddingBottom: isMobile ? 64 : 0 }}>
      {isMobile ? (
        <MobileHeader connected={connected} />
      ) : (
        <>
          <StatusBar />
          <DesktopNav redAlerts={redAlerts} />
        </>
      )}
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
      {isMobile && <MobileBottomNav redAlerts={redAlerts} />}
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
