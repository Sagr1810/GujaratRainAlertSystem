import React, { useEffect, useState, useCallback } from 'react';
import { historyAPI } from '../services/api';
import { T } from '../utils/constants';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';

// ─── colours per year ──────────────────────────────────────────────────
const YEAR_COLORS = {
  2021: '#f59e0b', 2022: '#ef4444', 2023: '#8b5cf6',
  2024: '#2563eb', 2025: '#0891b2', 2026: '#16a34a',
};

// ─── sub-components ────────────────────────────────────────────────────
const YearBadge = ({ year }) => (
  <span style={{
    background: YEAR_COLORS[year] + '18',
    color: YEAR_COLORS[year],
    border: `1px solid ${YEAR_COLORS[year]}50`,
    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700,
  }}>{year}</span>
);

const TypeBadge = ({ type }) => {
  const map = {
    cyclone:    { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3', label: '🌀 Cyclone' },
    flood:      { bg: '#eff6ff', color: '#1e40af', border: '#bfdbfe', label: '🌊 Flood'   },
    heavy_rain: { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0', label: '🌧️ Heavy Rain' },
  };
  const s = map[type] || map.flood;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {s.label}
    </span>
  );
};

const VerifiedBadge = ({ verified, is_ongoing }) => {
  if (is_ongoing) return <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>🔴 LIVE</span>;
  if (verified)   return <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>✅ Verified</span>;
  return <span style={{ background: '#fefce8', color: '#854d0e', border: '1px solid #fde68a', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>⚠️ Pending</span>;
};

const SyncBadge = ({ syncStatus }) => {
  if (!syncStatus) return null;
  const { status, last_sync } = syncStatus;
  const timeAgo = last_sync ? new Date(last_sync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '--';
  const color = status === 'success' ? '#16a34a' : status === 'running' ? '#2563eb' : status === 'error' ? '#dc2626' : '#6b7280';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: color + '10', border: `1px solid ${color}30`, borderRadius: 20, padding: '4px 12px', fontSize: 11, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', animation: status === 'running' ? 'pulse 1s infinite' : 'none' }} />
      {status === 'running' ? 'Syncing govt data...' : status === 'success' ? `Govt sync OK · ${timeAgo}` : status === 'never' ? 'Govt sync pending' : `Sync error`}
    </div>
  );
};

const StatCard = ({ label, value, color, sub }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: '16px 18px', boxShadow: T.shadow, borderTop: `3px solid ${color}` }}>
    <div style={{ color: T.textMute, fontSize: 12 }}>{label}</div>
    <div style={{ color, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ color: T.textMute, fontSize: 11, marginTop: 2 }}>{sub}</div>}
  </div>
);

const ImpactCard = ({ e, onSource }) => (
  <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden', borderLeft: `4px solid ${YEAR_COLORS[e.year] || '#6b7280'}` }}>
    {/* header */}
    <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <TypeBadge type={e.event_type} />
        <YearBadge year={e.year} />
        <VerifiedBadge verified={e.verified} is_ongoing={e.is_ongoing} />
      </div>
      <span style={{ color: T.textMute, fontSize: 12 }}>📍 {e.Region?.name || 'Gujarat'}</span>
    </div>
    {/* body */}
    <div style={{ padding: '12px 14px' }}>
      <div style={{ color: T.text, fontWeight: 800, fontSize: 15, marginBottom: 8 }}>{e.event_name}</div>
      {/* stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
        {[
          ['💔 Deaths',     (e.deaths || 0).toLocaleString(),                                '#dc2626'],
          ['🏃 Displaced',  `${((e.displaced || 0) / 1000).toFixed(0)}K`,                    '#ea580c'],
          ['🌾 Crops Ha',   `${((e.crops_damaged_ha || 0) / 1000).toFixed(0)}K`,             '#16a34a'],
          ['🏗️ Loss ₹Cr',   (e.infrastructure_loss_cr || 0).toLocaleString(),                '#7c3aed'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: T.surface2, borderRadius: 8, padding: '7px 10px', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMute, fontSize: 9 }}>{l}</div>
            <div style={{ color: c, fontWeight: 800, fontSize: 15 }}>{v}</div>
          </div>
        ))}
      </div>
      {e.max_rainfall_mm > 0 && (
        <div style={{ color: '#0891b2', fontSize: 12, marginBottom: 6, fontWeight: 600 }}>
          🌧️ Peak rainfall: <strong>{e.max_rainfall_mm}mm</strong>
        </div>
      )}
      <div style={{ color: T.textMid, fontSize: 12, lineHeight: 1.6, borderTop: `1px solid ${T.border}`, paddingTop: 8, marginBottom: 8 }}>
        {e.description}
      </div>
      {/* source */}
      {e.source && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: T.textMute, fontSize: 10, borderTop: `1px solid ${T.border}`, paddingTop: 6 }}>
          <span>📋 Source:</span>
          <span style={{ color: '#2563eb', fontStyle: 'italic' }}>{e.source}</span>
          {e.auto_synced && <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 10, padding: '1px 6px', fontSize: 9 }}>AUTO-SYNCED</span>}
        </div>
      )}
    </div>
  </div>
);

// ─── Main History page ─────────────────────────────────────────────────
export default function History() {
  const [impacts, setImpacts] = useState([]);
  const [summary, setSummary] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [year, setYear] = useState('all');
  const [region, setRegion] = useState('all');
  const [eventType, setEventType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = useCallback(() => {
    Promise.allSettled([historyAPI.getAll(), historyAPI.getSummary()])
      .then(([ir, sr]) => {
        if (ir.status === 'fulfilled') {
          setImpacts(ir.value.data.data || []);
          setSyncStatus(ir.value.data.sync_status || null);
        }
        if (sr.status === 'fulfilled') setSummary(sr.value.data.data || []);
        setLastRefresh(new Date());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    // Auto-refresh every 5 minutes to pick up govt sync updates
    const timer = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  // Listen for Socket.io govt sync broadcast
  useEffect(() => {
    // If WeatherContext exposes socket, use it; otherwise poll
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    try {
      // dynamic import to avoid SSR issues
      import('socket.io-client').then(({ io }) => {
        const sock = io(socketUrl, { transports: ['websocket', 'polling'] });
        sock.on('data_synced', (payload) => {
          if (payload.type === 'history_update') {
            load(); // re-fetch data when govt syncs
          }
        });
        return () => sock.disconnect();
      }).catch(() => {});
    } catch (e) {}
  }, [load]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await historyAPI.sync();
      await load();
    } catch (e) { /* silent */ }
    finally { setSyncing(false); }
  };

  // Derive years and regions present in data
  const regions = [...new Set(impacts.map((i) => i.Region?.name).filter(Boolean))].sort();

  const filtered = impacts.filter((i) =>
    (year === 'all' || i.year === parseInt(year)) &&
    (region === 'all' || i.Region?.name === region) &&
    (eventType === 'all' || i.event_type === eventType)
  );

  // Chart data — filtered by selected year when one is chosen
  const chartData = year === 'all'
    ? summary.map((s) => ({
        year: String(s.year),
        Deaths:           s.total_deaths,
        'Displaced(K)':   Math.round(s.total_displaced / 1000),
        'Loss(Cr)':       Math.round(s.total_loss_cr),
        'Crops(K Ha)':    Math.round(s.total_crops_ha / 1000),
      }))
    : filtered.reduce((acc, i) => {
        const existing = acc.find((r) => r.year === String(i.year));
        if (existing) {
          existing.Deaths        += (i.deaths || 0);
          existing['Displaced(K)'] = Math.round((existing['Displaced(K)'] * 1000 + (i.displaced || 0)) / 1000);
          existing['Loss(Cr)']   += Math.round(parseFloat(i.infrastructure_loss_cr || 0));
          existing['Crops(K Ha)'] = Math.round((existing['Crops(K Ha)'] * 1000 + (i.crops_damaged_ha || 0)) / 1000);
        } else {
          acc.push({
            year: String(i.year),
            Deaths:             i.deaths || 0,
            'Displaced(K)':     Math.round((i.displaced || 0) / 1000),
            'Loss(Cr)':         Math.round(parseFloat(i.infrastructure_loss_cr || 0)),
            'Crops(K Ha)':      Math.round((i.crops_damaged_ha || 0) / 1000),
          });
        }
        return acc;
      }, []);

  // Stat-card totals computed from filtered events so they react to year/region/type selection
  const totals = {
    deaths:    filtered.reduce((s, i) => s + (i.deaths || 0), 0),
    displaced: filtered.reduce((s, i) => s + (i.displaced || 0), 0),
    loss:      filtered.reduce((s, i) => s + parseFloat(i.infrastructure_loss_cr || 0), 0),
    events:    filtered.length,
    ongoing:   filtered.filter((i) => i.is_ongoing).length,
  };

  if (loading) return (
    <div style={{ textAlign: 'center', color: '#2563eb', padding: 60, fontWeight: 700 }}>
      📊 Loading historical flood data 2021–2026...
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800, margin: 0 }}>
            📊 Gujarat Flood Impact — 2021 to 2026
          </h1>
          <p style={{ color: T.textMute, fontSize: 13, margin: '4px 0 0' }}>
            Historical analysis · {totals.events} major events · Cyclones, floods, heavy rain · Auto-synced from IMD/SDMA
          </p>
          {lastRefresh && <div style={{ color: T.textMute, fontSize: 11, marginTop: 2 }}>Last page refresh: {lastRefresh.toLocaleTimeString('en-IN')}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <SyncBadge syncStatus={syncStatus} />
          <button
            onClick={handleManualSync}
            disabled={syncing}
            style={{ background: syncing ? '#f1f5f9' : '#2563eb', color: syncing ? T.textMute : '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: syncing ? 'not-allowed' : 'pointer' }}>
            {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
          </button>
        </div>
      </div>

      {/* ── Year timeline tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {[['all', 'All Years', '#6b7280'], ...[2021,2022,2023,2024,2025,2026].map(y => [String(y), String(y), YEAR_COLORS[y]])].map(([v, l, c]) => (
          <button key={v} onClick={() => setYear(v)} style={{
            background: year === v ? c + '18' : T.surface,
            color: year === v ? c : T.textMute,
            border: `2px solid ${year === v ? c : T.border}`,
            borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard label="💔 Total Deaths"    value={totals.deaths.toLocaleString()}                      color="#dc2626" />
        <StatCard label="🏃 Total Displaced" value={`${(totals.displaced / 100000).toFixed(1)} Lakh`}   color="#ea580c" />
        <StatCard label="🏗️ Infrastructure"  value={`₹${(totals.loss / 100).toFixed(0)} Cr`}            color="#7c3aed" />
        <StatCard label="📋 Events Tracked"  value={totals.events}                                       color="#2563eb" sub={`${totals.ongoing} live/ongoing`} />
        <StatCard label="📅 Years Covered"   value="2021–2026"                                           color="#0891b2" sub="Auto-updated" />
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: '16px 14px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>💔 Deaths &amp; Displaced by Year</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Deaths" fill="#dc2626" radius={[4,4,0,0]} />
              <Bar dataKey="Displaced(K)" fill="#f97316" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.surface, borderRadius: 12, padding: '16px 14px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <h3 style={{ color: T.text, fontSize: 13, fontWeight: 700, margin: '0 0 12px' }}>🏗️ Infrastructure Loss &amp; Crop Damage (₹ Crore)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="Loss(Cr)"   stroke="#7c3aed" fill="#7c3aed20" strokeWidth={2} dot={{ r: 4, fill: '#7c3aed' }} />
              <Area type="monotone" dataKey="Crops(K Ha)" stroke="#16a34a" fill="#16a34a15" strokeWidth={2} dot={{ r: 4, fill: '#16a34a' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Year-wise trend summary ── */}
      {summary.length > 0 && (
        <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, boxShadow: T.shadow, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: '10px 16px', fontWeight: 700, color: T.text, fontSize: 13 }}>
            📅 Year-wise Impact Summary (2021–2026)
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
                  {['Year','Events','Deaths','Displaced','Crops(Ha)','Loss(₹Cr)','Status'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: T.textMid, fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => {
                  const ongoing = (s.events || []).some((e) => e.is_ongoing);
                  const color = YEAR_COLORS[s.year] || '#6b7280';
                  return (
                    <tr key={s.year} style={{ borderBottom: `1px solid ${T.border}`, background: year === String(s.year) ? color + '08' : 'transparent' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 800, color }}>{s.year}</td>
                      <td style={{ padding: '8px 12px', color: T.text }}>{(s.events || []).length}</td>
                      <td style={{ padding: '8px 12px', color: '#dc2626', fontWeight: 700 }}>{(s.total_deaths || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: '#ea580c' }}>{((s.total_displaced || 0) / 1000).toFixed(0)}K</td>
                      <td style={{ padding: '8px 12px', color: '#16a34a' }}>{((s.total_crops_ha || 0) / 1000).toFixed(0)}K</td>
                      <td style={{ padding: '8px 12px', color: '#7c3aed', fontWeight: 700 }}>₹{(s.total_loss_cr || 0).toLocaleString()}</td>
                      <td style={{ padding: '8px 12px' }}>
                        {ongoing
                          ? <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>🔴 Live</span>
                          : <span style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>✅ Final</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12 }}>
          <option value="all">All Regions</option>
          {regions.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ background: T.surface, color: T.text, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 14px', fontSize: 12 }}>
          <option value="all">All Types</option>
          <option value="cyclone">🌀 Cyclone</option>
          <option value="flood">🌊 Flood</option>
          <option value="heavy_rain">🌧️ Heavy Rain</option>
        </select>
        <span style={{ color: T.textMute, fontSize: 12, marginLeft: 4 }}>
          Showing <strong style={{ color: T.text }}>{filtered.length}</strong> of {impacts.length} total events
        </span>
        {totals.ongoing > 0 && (
          <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 20, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>
            🔴 {totals.ongoing} live/ongoing event{totals.ongoing > 1 ? 's' : ''} being tracked
          </span>
        )}
      </div>

      {/* ── Event Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 14 }}>
        {filtered.map((imp, i) => <ImpactCard key={imp.id || i} e={imp} />)}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: T.textMute, padding: 50, fontSize: 14 }}>
            No events found for the selected filters.
          </div>
        )}
      </div>

      {/* ── Data source note ── */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 11, color: T.textMute, lineHeight: 1.7 }}>
        <strong style={{ color: T.text }}>📋 Data Sources & Methodology</strong><br />
        2021–2024: Gujarat SDMA Annual Reports, NDRF Situation Reports, IMD Seasonal Summaries. Verified against news archives.<br />
        2025: IMD Ahmedabad seasonal bulletins, Gujarat Revenue Department flood reports, district collector notifications.<br />
        2026: IMD real-time alerts + Open-Meteo archive API (auto-detected when 24h rainfall ≥ 115.6mm at any major city).<br />
        <strong>Auto-sync</strong> runs every 6 hours and broadcasts updates to all connected users via WebSocket. Manual sync available above.
      </div>
    </div>
  );
}
