import React, { useEffect, useState } from 'react';
import { regionAPI, weatherAPI } from '../services/api';
import { ALERT_COLORS, REGION_INFO, REGION_COLORS, T } from '../utils/constants';

const Badge = ({ level }) => { const c = ALERT_COLORS[level] || ALERT_COLORS.normal; return <span style={{ background: c.light, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{c.icon} {c.label}</span>; };

const RegionCard = ({ region, summary, onClick, active }) => {
  const code = region.code;
  const info = REGION_INFO[code] || {};
  const color = REGION_COLORS[code] || '#2563eb';
  const alertLevel = summary?.alert_level || 'normal';
  return (
    <div onClick={() => onClick(code)} style={{ background: active ? '#eff6ff' : T.surface, borderRadius: 14, padding: 20, border: `2px solid ${active ? color : T.border}`, boxShadow: active ? `0 4px 14px ${color}30` : T.shadow, cursor: 'pointer', transition: 'all 0.2s', borderTop: `4px solid ${color}` }}
      onMouseEnter={e => !active && (e.currentTarget.style.boxShadow = T.shadowMd)}
      onMouseLeave={e => !active && (e.currentTarget.style.boxShadow = T.shadow)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>{info.emoji || '🌧️'}</span>
          <div>
            <div style={{ color: T.text, fontWeight: 800, fontSize: 16 }}>{region.name}</div>
            <div style={{ color: T.textMute, fontSize: 11, marginTop: 1 }}>{info.description}</div>
          </div>
        </div>
        <Badge level={alertLevel} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
          <div style={{ color: T.textMute, fontSize: 10 }}>MAX RAIN/24H</div>
          <div style={{ color: '#2563eb', fontWeight: 800, fontSize: 20 }}>{summary?.max_rainfall_24h || 0}<span style={{ fontSize: 11 }}>mm</span></div>
        </div>
        <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
          <div style={{ color: T.textMute, fontSize: 10 }}>AVG RAIN/24H</div>
          <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: 20 }}>{summary?.avg_rainfall_24h || 0}<span style={{ fontSize: 11 }}>mm</span></div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textMute, borderTop: `1px solid ${T.border}`, paddingTop: 8, lineHeight: 1.6 }}>
        ⚠️ <span style={{ color: '#ea580c' }}>{info.risk}</span><br />
        🌊 <span style={{ color: '#0891b2' }}>{info.rivers?.join(', ')}</span>
      </div>
    </div>
  );
};

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [summary, setSummary] = useState({});
  const [selected, setSelected] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([regionAPI.getAll(), weatherAPI.getSummary()]).then(([rr, sr]) => {
      if (rr.status === 'fulfilled') setRegions(rr.value.data.data || []);
      if (sr.status === 'fulfilled') {
        const m = {}; (sr.value.data.data || []).forEach(s => { if (s.region) m[s.region.code] = s; }); setSummary(m);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleClick = async (code) => {
    if (selected === code) { setSelected(null); setCities([]); return; }
    setSelected(code);
    try { const r = await weatherAPI.getRegion(code); setCities(r.data.data || []); } catch { setCities([]); }
  };

  if (loading) return <div style={{ textAlign: 'center', color: '#2563eb', padding: 60, background: T.bg }}>🗺️ Loading regions...</div>;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800 }}>🗺️ Gujarat — Regional Rain Monitor</h1>
        <p style={{ color: T.textMute, fontSize: 13 }}>6 regions · 33 districts — click any region for city breakdown</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(310px,1fr))', gap: 16, marginBottom: 24 }}>
        {regions.map(r => <RegionCard key={r.id} region={r} summary={summary[r.code]} onClick={handleClick} active={selected === r.code} />)}
      </div>

      {selected && (
        <div style={{ background: T.surface, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, overflow: 'hidden' }}>
          <div style={{ background: '#eff6ff', borderBottom: `1px solid #bfdbfe`, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ color: T.text, fontSize: 16, fontWeight: 800 }}>{REGION_INFO[selected]?.emoji} {REGION_INFO[selected]?.name} — City Details</h2>
            <button onClick={() => { setSelected(null); setCities([]); }} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 600 }}>✕ Close</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: T.surface2 }}>
                {['City','District','Rain 24h','Temp','Humidity','Wind','Condition','Alert'].map(h => <th key={h} style={{ padding: '10px 14px', color: T.textMute, fontSize: 11, textAlign: 'left', fontWeight: 700, textTransform: 'uppercase', borderBottom: `1px solid ${T.border}` }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {cities.map((c, i) => {
                  const w = c.weather; const ac = ALERT_COLORS[w?.alert_level || 'normal'];
                  return <tr key={c.id} style={{ background: i % 2 === 0 ? T.surface : T.surface2, borderBottom: `1px solid ${T.border}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{c.name}</td>
                    <td style={{ padding: '10px 14px', color: T.textMute, fontSize: 12 }}>{c.district}</td>
                    <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 700 }}>{w?.rainfall_24h || 0}mm</td>
                    <td style={{ padding: '10px 14px', color: '#ea580c', fontWeight: 600 }}>{w?.temperature || '--'}°C</td>
                    <td style={{ padding: '10px 14px', color: '#0891b2' }}>{w?.humidity || '--'}%</td>
                    <td style={{ padding: '10px 14px', color: '#7c3aed' }}>{w?.wind_speed || '--'} m/s</td>
                    <td style={{ padding: '10px 14px', color: T.textMid, fontSize: 12 }}>{w?.weather_desc || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ background: ac.light, color: ac.text, border: `1px solid ${ac.border}`, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{ac.icon} {ac.label}</span></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
