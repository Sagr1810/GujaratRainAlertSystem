import React, { useEffect, useState } from 'react';
import { reservoirAPI } from '../services/api';
import { T } from '../utils/constants';

const getLevel = p => {
  if (p >= 90) return { color:'#dc2626', bg:'#fef2f2', border:'#fecaca', label:'Critical — Overflow Risk', icon:'🔴' };
  if (p >= 75) return { color:'#ea580c', bg:'#fff7ed', border:'#fed7aa', label:'High', icon:'🟠' };
  if (p >= 50) return { color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', label:'Good', icon:'🟢' };
  if (p >= 25) return { color:'#d97706', bg:'#fffbeb', border:'#fde68a', label:'Moderate', icon:'🟡' };
  return { color:'#64748b', bg:'#f8fafc', border:'#e2e8f0', label:'Low', icon:'⚪' };
};

const ReservoirCard = ({ r }) => {
  const p = parseFloat(r.current_percent || 0);
  const lv = getLevel(p);
  return (
    <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${lv.border}`, boxShadow: T.shadow, overflow: 'hidden' }}>
      <div style={{ background: lv.bg, padding: '12px 16px', borderBottom: `1px solid ${lv.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>💧 {r.name}</div>
          <div style={{ color: T.textMute, fontSize: 11 }}>{r.district} · {r.Region?.name}</div>
        </div>
        <span style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{lv.icon} {lv.label}</span>
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ background: '#e2e8f0', borderRadius: 20, height: 14, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: `${Math.min(100,p)}%`, height: '100%', background: p>=90?'#dc2626':p>=75?'#ea580c':'#2563eb', borderRadius: 20, transition: 'width 0.8s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: lv.color, fontWeight: 800, fontSize: 22 }}>{p.toFixed(1)}%</span>
          <span style={{ color: T.textMute, fontSize: 12, alignSelf: 'center' }}>{parseFloat(r.current_level_mcm||0).toFixed(0)} / {parseFloat(r.capacity_mcm).toFixed(0)} MCM</span>
        </div>
        {p >= 90 && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '7px 12px', color: '#dc2626', fontSize: 12 }}>⚠️ Overflow risk — downstream areas on flood alert</div>}
      </div>
    </div>
  );
};

export default function Reservoirs() {
  const [reservoirs, setReservoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('capacity');

  useEffect(() => {
    reservoirAPI.getAll().then(r => setReservoirs(r.data.data || [])).finally(() => setLoading(false));
    const i = setInterval(() => reservoirAPI.getAll().then(r => setReservoirs(r.data.data || [])), 60000);
    return () => clearInterval(i);
  }, []);

  const sorted = [...reservoirs].sort((a,b) => sort==='level' ? parseFloat(b.current_percent)-parseFloat(a.current_percent) : parseFloat(b.capacity_mcm)-parseFloat(a.capacity_mcm));
  const critical = reservoirs.filter(r => parseFloat(r.current_percent) >= 90).length;
  const total = reservoirs.reduce((s,r) => s+parseFloat(r.capacity_mcm||0), 0);
  const avg = reservoirs.length ? reservoirs.reduce((s,r)=>s+parseFloat(r.current_percent||0),0)/reservoirs.length : 0;

  if (loading) return <div style={{ textAlign: 'center', color: '#2563eb', padding: 60 }}>💧 Loading reservoir data...</div>;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800 }}>💧 Gujarat Reservoir & Dam Monitor</h1>
        <p style={{ color: T.textMute, fontSize: 13 }}>Live water levels — overflow triggers downstream flood alerts</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[['Total Dams', reservoirs.length, '#2563eb'],['Critical (>90%)', critical, '#dc2626'],['Total Capacity (MCM)', Math.round(total).toLocaleString(), '#16a34a'],['Avg Fill Level', `${avg.toFixed(1)}%`, '#7c3aed']].map(([l,v,c]) => (
          <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px 18px', boxShadow: T.shadow, borderTop: `3px solid ${c}` }}>
            <div style={{ color: T.textMute, fontSize: 12 }}>{l}</div>
            <div style={{ color: c, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['capacity','By Capacity'],['level','By Fill Level']].map(([v,l]) => (
          <button key={v} onClick={()=>setSort(v)} style={{ background: sort===v?'#2563eb':T.surface, color: sort===v?'#fff':T.textMid, border: `1px solid ${sort===v?'#2563eb':T.border}`, borderRadius: 20, padding: '5px 16px', fontSize: 12, fontWeight: 600 }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 14 }}>
        {sorted.map(r => <ReservoirCard key={r.id} r={r} />)}
      </div>
    </div>
  );
}
