import React, { useEffect, useState } from 'react';
import { alertAPI } from '../services/api';
import { ALERT_COLORS, T } from '../utils/constants';
import { format } from 'date-fns';

const Badge = ({ level }) => { const c = ALERT_COLORS[level] || ALERT_COLORS.orange; return <span style={{ background: c.light, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{c.icon} {c.label}</span>; };

const AlertCard = ({ alert, onDeactivate }) => {
  const c = ALERT_COLORS[alert.alert_type] || ALERT_COLORS.orange;
  const expired = alert.expires_at && new Date(alert.expires_at) < new Date();
  return (
    <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${c.border}`, borderLeft: `5px solid ${c.bg}`, boxShadow: T.shadow, padding: '16px 18px', opacity: expired ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <Badge level={alert.alert_type} />
            {!alert.is_active && <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>Inactive</span>}
            {expired && <span style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>Expired</span>}
            <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{alert.source === 'auto' ? '🤖 Auto-detected' : '👤 Manual'}</span>
          </div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{alert.title}</div>
          <div style={{ color: T.textMid, fontSize: 13, lineHeight: 1.6 }}>{alert.message}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, fontSize: 12 }}>
            {alert.City && <span style={{ color: '#2563eb' }}>📍 {alert.City.name}</span>}
            {alert.rainfall_mm && <span style={{ color: '#0891b2' }}>🌧️ {alert.rainfall_mm}mm</span>}
            <span style={{ color: T.textMute }}>🕐 {alert.issued_at ? format(new Date(alert.issued_at), 'dd MMM yyyy, HH:mm') : '—'}</span>
            {alert.expires_at && <span style={{ color: expired ? '#dc2626' : '#16a34a' }}>⏱️ Expires {format(new Date(alert.expires_at), 'dd MMM, HH:mm')}</span>}
          </div>
        </div>
        {alert.is_active && onDeactivate && (
          <button onClick={() => onDeactivate(alert.id)} style={{ background: T.surface2, color: T.textMute, border: `1px solid ${T.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>Deactivate</button>
        )}
      </div>
    </div>
  );
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const load = async () => {
    const [ar, hr] = await Promise.allSettled([alertAPI.getAll(), alertAPI.getHistory({ days: 30 })]);
    if (ar.status === 'fulfilled') setAlerts(ar.value.data.data || []);
    if (hr.status === 'fulfilled') setHistory(hr.value.data.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); const i = setInterval(load, 60000); return () => clearInterval(i); }, []);

  const deactivate = async (id) => { await alertAPI.deactivate(id); setAlerts(prev => prev.filter(a => a.id !== id)); };

  const list = tab === 'active' ? alerts : history;
  const filtered = filterType === 'all' ? list : list.filter(a => a.alert_type === filterType);
  const counts = { red:0, dark_red:0, orange:0, yellow:0 };
  alerts.forEach(a => { if (counts[a.alert_type] !== undefined) counts[a.alert_type]++; });

  if (loading) return <div style={{ textAlign: 'center', color: '#2563eb', padding: 60 }}>⚠️ Loading alerts...</div>;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800 }}>🚨 Rain & Flood Alerts — Gujarat</h1>
        <p style={{ color: T.textMute, fontSize: 13 }}>IMD-standard alerts · auto-generated every 10 minutes</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[['dark_red','Extreme','🚨'],['red','Very Heavy','🔴'],['orange','Heavy','🟠'],['yellow','Moderate','🟡']].map(([type,label,icon]) => {
          const c = ALERT_COLORS[type];
          return <div key={type} style={{ background: counts[type] > 0 ? c.light : T.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 26 }}>{icon}</div>
            <div style={{ color: c.bg, fontWeight: 800, fontSize: 26, marginTop: 4 }}>{counts[type]}</div>
            <div style={{ color: T.textMute, fontSize: 12 }}>{label}</div>
          </div>;
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 0, borderBottom: `2px solid ${T.border}` }}>
        {[['active',`Active (${alerts.length})`],['history',`History (${history.length})`]].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ background: 'transparent', color: tab===k ? '#2563eb' : T.textMute, border: 'none', borderBottom: tab===k ? '2px solid #2563eb' : '2px solid transparent', padding: '8px 20px', fontSize: 13, fontWeight: tab===k ? 700 : 500, marginBottom: -2 }}>{l}</button>
        ))}
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        {['all','dark_red','red','orange','yellow'].map(f => {
          const c = ALERT_COLORS[f] || { light: '#eff6ff', border: '#bfdbfe', text: '#2563eb', bg: '#2563eb' };
          return <button key={f} onClick={() => setFilterType(f)} style={{ background: filterType===f ? c.bg : T.surface, color: filterType===f ? '#fff' : T.textMid, border: `1px solid ${filterType===f ? c.bg : T.border}`, borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 600 }}>{f==='all'?'All':f.replace('_',' ')}</button>;
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 16 }}>No active alerts — Gujarat is safe!</div>
          </div>
        ) : filtered.map(a => <AlertCard key={a.id} alert={a} onDeactivate={tab==='active' ? deactivate : null} />)}
      </div>
    </div>
  );
}
