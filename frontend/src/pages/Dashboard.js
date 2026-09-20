import React, { useEffect, useState, useCallback, useRef } from 'react';
import { weatherAPI, miscAPI } from '../services/api';
import { ALERT_COLORS, T } from '../utils/constants';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line, Area, Legend,
} from 'recharts';

const AC = ALERT_COLORS;
const REFRESH_MS = 10 * 60 * 1000; // 10 minutes

// ── Shared sub-components ──────────────────────────────────────────────
const Badge = ({ level }) => {
  const c = AC[level] || AC.normal;
  return <span style={{ background: c.light, color: c.text, border: `1px solid ${c.border}`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{c.icon} {c.label}</span>;
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px', boxShadow: T.shadow, borderTop: `3px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ color: T.textMute, fontSize: 12, marginBottom: 4 }}>{label}</div>
        <div style={{ color: T.text, fontSize: 26, fontWeight: 800 }}>{value}</div>
        {sub && <div style={{ color, fontSize: 12, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 32, opacity: 0.85 }}>{icon}</div>
    </div>
  </div>
);

const WMO_ICONS = { '01d':'☀️','02d':'⛅','03d':'🌥️','04d':'☁️','09d':'🌧️','10d':'🌦️','11d':'⛈️','13d':'❄️','50d':'🌫️' };
const wxEmoji = (icon) => WMO_ICONS[icon] || '🌤️';

const alertGrad = {
  dark_red: 'linear-gradient(135deg,#7f1d1d,#991b1b)',
  red:      'linear-gradient(135deg,#dc2626,#b91c1c)',
  orange:   'linear-gradient(135deg,#ea580c,#c2410c)',
  yellow:   'linear-gradient(135deg,#d97706,#b45309)',
  normal:   'linear-gradient(135deg,#16a34a,#15803d)',
};

const uvLabel = (v) => v >= 11 ? '🔴 Extreme' : v >= 8 ? '🟠 Very High' : v >= 6 ? '🟡 High' : v >= 3 ? '🟢 Moderate' : '🟢 Low';

// ── City Detail Panel (full-page overlay) ─────────────────────────────
function CityDetailModal({ city, onClose }) {
  const [weather,    setWeather]    = useState(city.weather || null);
  const [daily,      setDaily]      = useState([]);
  const [hourly,     setHourly]     = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('today'); // 'today' | 'week'
  const timerRef = useRef(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [cityRes, fRes] = await Promise.allSettled([
        weatherAPI.getCity(city.id),
        miscAPI.getForecast(city.id),
      ]);
      if (cityRes.status === 'fulfilled') {
        const readings = cityRes.value.data.data?.readings || [];
        if (readings.length) setWeather(readings[0]);
      }
      if (fRes.status === 'fulfilled') {
        const payload = fRes.value.data.data || {};
        // handle both old array shape and new { daily, hourly } shape
        if (Array.isArray(payload)) {
          setDaily(payload);
        } else {
          setDaily(payload.daily || []);
          setHourly(payload.hourly || []);
        }
      }
      setLastUpdate(new Date());
    } catch (_) {}
    finally { if (manual) setRefreshing(false); }
  }, [city.id]);

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, [load]);

  // Escape to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const level = weather?.alert_level || 'normal';
  const c = AC[level] || AC.normal;
  const today = daily[0] || null;

  // Chart data — hourly heat & rain (today)
  const hourlyChart = hourly.map(h => ({
    t: h.time_label || `${String(h.hour).padStart(2,'0')}:00`,
    '🌡️ Temp (°C)':    h.temp,
    '🌡️ Feels (°C)':   h.feels_like,
    '🌧️ Rain (mm)':    h.rain,
    '☂️ Chance (%)':   h.pop,
  }));

  // Chart data — 7-day heat prediction
  const heatChart = daily.map(d => {
    const dt = new Date(d.forecast_time);
    return {
      day: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      Max: d.temp_max,
      Min: d.temp_min,
      'Feels Max': d.feels_max,
    };
  });

  // Chart data — 7-day rain prediction
  const rainChart = daily.map(d => {
    const dt = new Date(d.forecast_time);
    return {
      day: dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      'Rain (mm)': d.rainfall_mm,
      'Chance (%)': d.pop,
    };
  });

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '16px', overflowY: 'auto' }}>

      <div style={{ background: T.surface, borderRadius: 18, width: '100%', maxWidth: 760, marginTop: 8, marginBottom: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.35)' }}>

        {/* ── Coloured hero header ── */}
        <div style={{ background: alertGrad[level] || alertGrad.normal, borderRadius: '18px 18px 0 0', padding: '22px 24px', color: '#fff', position: 'relative' }}>
          <button onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 18, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 17, cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* left */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{city.name}</div>
              <div style={{ fontSize: 13, opacity: 0.82, marginTop: 3 }}>📍 {city.Region?.name || city.district} · {city.district}</div>
              <div style={{ marginTop: 10, display: 'inline-block', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
                {c.icon} {c.label}
              </div>
            </div>
            {/* right — big numbers */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>24H RAIN</div>
                <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1 }}>{weather?.rainfall_24h ?? '--'}<span style={{ fontSize: 16 }}>mm</span></div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>TEMP NOW</div>
                <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1 }}>{weather?.temperature ?? '--'}<span style={{ fontSize: 16 }}>°C</span></div>
              </div>
              {today && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: 1 }}>TODAY HIGH</div>
                  <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, color: '#fbbf24' }}>{today.temp_max}<span style={{ fontSize: 16 }}>°C</span></div>
                </div>
              )}
            </div>
          </div>

          {/* status bar */}
          <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, opacity: 0.85 }}>
            <span>💧 Humidity: {weather?.humidity ?? '--'}%</span>
            <span>🌬️ Wind: {weather?.wind_speed ?? '--'} m/s</span>
            <span>🔵 Pressure: {weather?.pressure ?? '--'} hPa</span>
            <span>👁️ Visibility: {weather?.visibility_km ?? '--'} km</span>
            {today && <span>🌞 UV: {uvLabel(today.uv_index)}</span>}
          </div>

          {/* live + update */}
          <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>
              🟢 Live · auto-refresh 10 min
            </span>
            {lastUpdate && <span style={{ fontSize: 11, opacity: 0.7 }}>Updated {lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            <button onClick={() => load(true)} disabled={refreshing}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, padding: '4px 12px', color: '#fff', fontSize: 11, fontWeight: 600, cursor: refreshing ? 'default' : 'pointer' }}>
              {refreshing ? '⏳' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
          {[['today','📅 Today\'s Weather'],['week','📊 7-Day Prediction']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ flex: 1, padding: '12px 0', border: 'none', borderBottom: tab === key ? '3px solid #2563eb' : '3px solid transparent', background: 'transparent', color: tab === key ? '#2563eb' : T.textMute, fontWeight: tab === key ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══════════ TODAY TAB ══════════ */}
          {tab === 'today' && (
            <>
              {/* Current conditions 8-tile grid */}
              <div>
                <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10 }}>⚡ Current Conditions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                  {[
                    ['🌧️ Rain 1H',    `${weather?.rainfall_1h ?? '--'} mm`,    '#2563eb'],
                    ['🌧️ Rain 3H',    `${weather?.rainfall_3h ?? '--'} mm`,    '#1d4ed8'],
                    ['🌧️ Rain 24H',   `${weather?.rainfall_24h ?? '--'} mm`,   '#1e40af'],
                    ['🌡️ Feels Like', `${weather?.temperature != null ? (parseFloat(weather.temperature)+2).toFixed(1) : '--'}°C`, '#ea580c'],
                    ['💧 Humidity',   `${weather?.humidity ?? '--'}%`,          '#0891b2'],
                    ['🌬️ Wind',       `${weather?.wind_speed ?? '--'} m/s`,     '#7c3aed'],
                    ['🔵 Pressure',   `${weather?.pressure ?? '--'} hPa`,       '#6b7280'],
                    ['☁️ Cloud',      `${weather?.cloud_cover ?? '--'}%`,       '#94a3b8'],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ background: T.surface2, borderRadius: 10, padding: '10px 8px', border: `1px solid ${T.border}`, textAlign: 'center' }}>
                      <div style={{ color: T.textMute, fontSize: 10 }}>{lbl}</div>
                      <div style={{ color: col, fontWeight: 800, fontSize: 16, marginTop: 3 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today summary from daily[0] */}
              {today && (
                <div style={{ background: c.light, border: `1px solid ${c.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, color: c.text, fontSize: 13, marginBottom: 10 }}>📋 Today's Full Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {[
                      ['🌡️ Max Temp',   `${today.temp_max}°C`,          '#ef4444'],
                      ['🌡️ Min Temp',   `${today.temp_min}°C`,          '#3b82f6'],
                      ['🌡️ Feels Max',  `${today.feels_max}°C`,         '#f97316'],
                      ['🌡️ Feels Min',  `${today.feels_min}°C`,         '#60a5fa'],
                      ['🌧️ Total Rain', `${today.rainfall_mm} mm`,      '#2563eb'],
                      ['☂️ Rain Chance', `${today.pop}%`,                '#0891b2'],
                      ['🌬️ Max Wind',   `${today.wind_speed} m/s`,      '#7c3aed'],
                      ['🌞 UV Index',   `${today.uv_index} — ${uvLabel(today.uv_index)}`, '#f59e0b'],
                    ].map(([lbl, val, col]) => (
                      <div key={lbl} style={{ background: T.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
                        <div style={{ color: T.textMute, fontSize: 10 }}>{lbl}</div>
                        <div style={{ color: col, fontWeight: 700, fontSize: 13, marginTop: 2 }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hourly heat chart */}
              {hourlyChart.length > 0 && (
                <div style={{ background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 10px' }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10, paddingLeft: 4 }}>🌡️ Hourly Temperature Today</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={hourlyChart} margin={{ top: 4, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#718096' }} interval={2} />
                      <YAxis tick={{ fontSize: 10, fill: '#718096' }} unit="°" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="🌡️ Temp (°C)" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey="🌡️ Feels (°C)" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Hourly rain chart */}
              {hourlyChart.length > 0 && (
                <div style={{ background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 10px' }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10, paddingLeft: 4 }}>🌧️ Hourly Rain Prediction Today</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={hourlyChart} margin={{ top: 4, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#718096' }} interval={2} />
                      <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#2563eb' }} unit="mm" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#0891b2' }} unit="%" />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="🌧️ Rain (mm)" fill="#2563eb" radius={[3,3,0,0]} />
                      <Line yAxisId="right" type="monotone" dataKey="☂️ Chance (%)" stroke="#0891b2" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* IMD alert box */}
              <div style={{ background: c.light, border: `1px solid ${c.border}`, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, color: c.text, fontSize: 13, marginBottom: 8 }}>⚠️ IMD Alert Status</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['Alert Level',    `${c.icon} ${c.label}`],
                    ['24H Rainfall',   `${weather?.rainfall_24h ?? '--'} mm`],
                    ['IMD Threshold',  level === 'normal' ? '< 35.5 mm' : level === 'yellow' ? '35.5 – 64.4 mm' : level === 'orange' ? '64.5 – 115.5 mm' : level === 'red' ? '115.6 – 204.4 mm' : '≥ 204.5 mm'],
                    ['Recommended Action', level === 'normal' ? 'No action needed' : level === 'yellow' ? 'Stay alert' : level === 'orange' ? 'Avoid waterlogged roads' : 'Stay indoors · evacuate low areas'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: T.surface, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
                      <div style={{ color: T.textMute, fontSize: 10 }}>{k}</div>
                      <div style={{ color: c.text, fontWeight: 700, fontSize: 12, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ══════════ WEEK TAB ══════════ */}
          {tab === 'week' && (
            <>
              {/* 7-day forecast cards */}
              {daily.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10 }}>📅 7-Day Forecast</div>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {daily.map((d, i) => {
                      const dc = AC[d.alert_level] || AC.normal;
                      const dt = new Date(d.forecast_time);
                      return (
                        <div key={i} style={{ background: T.surface2, border: `1px solid ${dc.border}`, borderRadius: 12, padding: '10px 12px', minWidth: 90, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                          <div style={{ color: T.textMute, fontSize: 10, fontWeight: 600 }}>{i === 0 ? 'Today' : dt.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                          <div style={{ color: T.textMute, fontSize: 9 }}>{dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                          <div style={{ fontSize: 24, margin: '2px 0' }}>{wxEmoji(d.weather_icon)}</div>
                          <div style={{ color: '#ef4444', fontWeight: 800, fontSize: 14 }}>{d.temp_max}°</div>
                          <div style={{ color: '#3b82f6', fontSize: 12 }}>{d.temp_min}°</div>
                          <div style={{ color: '#2563eb', fontSize: 11, fontWeight: 700 }}>{d.rainfall_mm}<span style={{ fontSize: 9 }}>mm</span></div>
                          <div style={{ color: '#0891b2', fontSize: 10 }}>☂️{d.pop}%</div>
                          <span style={{ background: dc.light, color: dc.text, border: `1px solid ${dc.border}`, borderRadius: 8, padding: '1px 6px', fontSize: 9, fontWeight: 700, marginTop: 2 }}>{dc.icon}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7-day heat prediction chart */}
              {heatChart.length > 0 && (
                <div style={{ background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 10px' }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10, paddingLeft: 4 }}>🌡️ 7-Day Heat Prediction</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={heatChart} margin={{ top: 4, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#718096' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#718096' }} unit="°" domain={['auto','auto']} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Max" fill="#fef2f2" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                      <Area type="monotone" dataKey="Min" fill="#eff6ff" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                      <Line type="monotone" dataKey="Feels Max" stroke="#f97316" strokeWidth={1.5} dot={false} strokeDasharray="5 3" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* 7-day rain prediction chart */}
              {rainChart.length > 0 && (
                <div style={{ background: T.surface2, borderRadius: 12, border: `1px solid ${T.border}`, padding: '14px 10px' }}>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: 13, marginBottom: 10, paddingLeft: 4 }}>🌧️ 7-Day Rain Prediction</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={rainChart} margin={{ top: 4, right: 10, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#718096' }} />
                      <YAxis yAxisId="left"  tick={{ fontSize: 10, fill: '#2563eb' }} unit="mm" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#0891b2' }} unit="%" domain={[0,100]} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar yAxisId="left" dataKey="Rain (mm)" fill="#2563eb" radius={[4,4,0,0]} />
                      <Line yAxisId="right" type="monotone" dataKey="Chance (%)" stroke="#0891b2" strokeWidth={2.5} dot={{ r: 4, fill: '#0891b2' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* summary table */}
              {daily.length > 0 && (
                <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                  <div style={{ background: T.surface2, borderBottom: `1px solid ${T.border}`, padding: '10px 14px', fontWeight: 700, color: T.text, fontSize: 12 }}>📋 Full 7-Day Table</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.surface2 }}>
                          {['Day','','Max','Min','Rain','Chance','Wind','UV','Alert'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: T.textMute, fontWeight: 600, whiteSpace: 'nowrap', borderBottom: `1px solid ${T.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {daily.map((d, i) => {
                          const dc = AC[d.alert_level] || AC.normal;
                          const dt = new Date(d.forecast_time);
                          return (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                              <td style={{ padding: '7px 10px', color: T.text, fontWeight: i === 0 ? 700 : 400 }}>{i === 0 ? 'Today' : dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                              <td style={{ padding: '7px 10px' }}>{wxEmoji(d.weather_icon)}</td>
                              <td style={{ padding: '7px 10px', color: '#ef4444', fontWeight: 700 }}>{d.temp_max}°C</td>
                              <td style={{ padding: '7px 10px', color: '#3b82f6' }}>{d.temp_min}°C</td>
                              <td style={{ padding: '7px 10px', color: '#2563eb', fontWeight: 700 }}>{d.rainfall_mm}mm</td>
                              <td style={{ padding: '7px 10px', color: '#0891b2' }}>{d.pop}%</td>
                              <td style={{ padding: '7px 10px', color: '#7c3aed' }}>{d.wind_speed} m/s</td>
                              <td style={{ padding: '7px 10px', color: '#f59e0b' }}>{d.uv_index ?? '--'}</td>
                              <td style={{ padding: '7px 10px' }}><span style={{ background: dc.light, color: dc.text, border: `1px solid ${dc.border}`, borderRadius: 10, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{dc.icon} {dc.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── City Card ──────────────────────────────────────────────────────────
const CityCard = ({ city, onClick }) => {
  const w = city.weather;
  const level = w?.alert_level || 'normal';
  const c = AC[level];
  return (
    <div onClick={onClick}
      style={{ background: T.surface, borderRadius: 12, border: `1px solid ${c.border}`, boxShadow: T.shadow, overflow: 'hidden', transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = T.shadow; }}>
      <div style={{ background: c.light, padding: '10px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>{city.name}</div>
          <div style={{ color: T.textMute, fontSize: 11 }}>{city.Region?.name || city.district}</div>
        </div>
        <Badge level={level} />
      </div>
      {w ? (
        <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMute, fontSize: 10 }}>🌧️ RAIN 24H</div>
            <div style={{ color: '#2563eb', fontWeight: 800, fontSize: 20 }}>{w.rainfall_24h || 0}<span style={{ fontSize: 12 }}>mm</span></div>
          </div>
          <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMute, fontSize: 10 }}>🌡️ TEMP</div>
            <div style={{ color: '#ea580c', fontWeight: 800, fontSize: 20 }}>{w.temperature || '--'}<span style={{ fontSize: 12 }}>°C</span></div>
          </div>
          <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMute, fontSize: 10 }}>💧 HUMIDITY</div>
            <div style={{ color: '#0891b2', fontWeight: 700, fontSize: 16 }}>{w.humidity || '--'}%</div>
          </div>
          <div style={{ background: T.surface2, borderRadius: 8, padding: '8px 10px', border: `1px solid ${T.border}` }}>
            <div style={{ color: T.textMute, fontSize: 10 }}>🌬️ WIND</div>
            <div style={{ color: '#7c3aed', fontWeight: 700, fontSize: 16 }}>{w.wind_speed || '--'}<span style={{ fontSize: 11 }}> m/s</span></div>
          </div>
        </div>
      ) : (
        <div style={{ padding: 16, color: T.textMute, fontSize: 13, textAlign: 'center' }}>Fetching live data...</div>
      )}
      <div style={{ padding: '6px 14px 10px', background: T.surface2, borderTop: `1px solid ${T.border}`, fontSize: 11, color: T.textMute, display: 'flex', justifyContent: 'space-between' }}>
        <span>📡 {w?.source === 'imd_openmeteo' ? 'IMD Live' : w?.source === 'demo' ? 'Demo' : 'Cached'} · {w?.weather_desc || ''}</span>
        <span style={{ color: '#2563eb', fontWeight: 600 }}>Tap for details →</span>
      </div>
    </div>
  );
};

// ── Main Dashboard ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [cities, setCities]       = useState([]);
  const [stats, setStats]         = useState(null);
  const [summary, setSummary]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [offline, setOffline]     = useState(false);
  const [filter, setFilter]       = useState('all');
  const [lastFetch, setLastFetch] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const fetchData = useCallback(async () => {
    const [citiesRes, statsRes, summaryRes] = await Promise.allSettled([
      weatherAPI.getLive(), miscAPI.getStats(), weatherAPI.getSummary(),
    ]);
    if (citiesRes.status === 'fulfilled') setCities(citiesRes.value.data.data || []);
    if (statsRes.status === 'fulfilled')  setStats(statsRes.value.data.data);
    if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data || []);
    setOffline([citiesRes, statsRes, summaryRes].every(r => r.status === 'rejected'));
    setLastFetch(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(i);
  }, [fetchData]);

  const alertCounts = cities.reduce((acc, c) => {
    const l = c.weather?.alert_level || 'normal';
    acc[l] = (acc[l] || 0) + 1;
    return acc;
  }, {});

  const filtered = filter === 'all' ? cities : cities.filter(c => (c.weather?.alert_level || 'normal') === filter);
  const chartData = summary.map(s => ({
    name: s.region?.name?.replace(' Gujarat','')?.replace('Saurashtra','Saur.') || '',
    rain: s.max_rainfall_24h || 0,
    avg:  s.avg_rainfall_24h || 0,
  }));

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: '#2563eb' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌧️</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Loading live IMD data...</div>
      </div>
    </div>
  );

  if (offline) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: 24 }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: '40px 32px', maxWidth: 480, textAlign: 'center', border: `1px solid ${T.border}`, boxShadow: T.shadowMd }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔌</div>
        <div style={{ color: T.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Backend Not Running</div>
        <div style={{ color: T.textMid, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Run <code style={{ background: T.surface2, padding: '2px 6px', borderRadius: 4, color: '#16a34a', fontWeight: 700 }}>start.bat</code> to start both servers, then refresh.
        </div>
        <button onClick={() => window.location.reload()} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>🔄 Retry</button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

      {selectedCity && <CityDetailModal city={selectedCity} onClose={() => setSelectedCity(null)} />}

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: T.text, fontSize: 22, fontWeight: 800 }}>🌦️ Gujarat Rain Alert Dashboard</h1>
          <p style={{ color: T.textMute, fontSize: 13, marginTop: 2 }}>
            IMD live monitoring · {cities.length} cities · 6 regions · {lastFetch && `Updated ${lastFetch.toLocaleTimeString('en-IN')}`}
            <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>· 🔄 auto-refresh every 10 min</span>
          </p>
        </div>
        <button onClick={fetchData} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>🔄 Refresh</button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="Cities Monitored" value={stats?.total_cities || cities.length} icon="🏙️" color="#2563eb" />
        <StatCard label="Active Alerts"    value={stats?.active_alerts || 0}             icon="🚨" color="#dc2626" />
        <StatCard label="Extreme/Red"      value={(alertCounts.red||0)+(alertCounts.dark_red||0)} icon="🔴" color="#dc2626" sub="Need action" />
        <StatCard label="Orange Alert"     value={alertCounts.orange||0}                 icon="🟠" color="#ea580c" />
        <StatCard label="Yellow Alert"     value={alertCounts.yellow||0}                 icon="🟡" color="#d97706" />
        <StatCard label="Normal"           value={alertCounts.normal||0}                 icon="🟢" color="#16a34a" />
      </div>

      {/* ── Charts + Region summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📊 Rainfall by Region (mm/24h)</h3>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#718096' }} />
              <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="rain" name="Max Rain" fill="#2563eb" radius={[4,4,0,0]} />
              <Bar dataKey="avg"  name="Avg Rain" fill="#93c5fd" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: T.surface, borderRadius: 12, padding: 16, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <h3 style={{ color: T.text, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>📍 Region Alert Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {summary.map(s => {
              const rc = AC[s.alert_level] || AC.normal;
              return (
                <div key={s.region?.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: rc.light, borderRadius: 8, border: `1px solid ${rc.border}` }}>
                  <span style={{ color: T.text, fontWeight: 600, fontSize: 13 }}>{s.region?.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: '#2563eb', fontWeight: 700 }}>{s.max_rainfall_24h}mm</span>
                    <Badge level={s.alert_level} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── IMD legend ── */}
      <div style={{ background: T.surface, borderRadius: 12, padding: '12px 16px', border: `1px solid ${T.border}`, marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: T.textMute, fontSize: 12, fontWeight: 600 }}>IMD THRESHOLDS:</span>
        {[['🟢 Normal','<35.5mm'],['🟡 Yellow','35.5–64.4mm'],['🟠 Orange','64.5–115.5mm'],['🔴 Red','115.6–204.4mm'],['🚨 Extreme','>204.5mm']].map(([l,v]) => (
          <span key={l} style={{ fontSize: 12, color: T.textMid }}><strong>{l}</strong> {v}</span>
        ))}
      </div>

      {/* ── Filter buttons ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['all','All Cities',cities.length],['dark_red','Extreme',alertCounts.dark_red||0],['red','Red',alertCounts.red||0],['orange','Orange',alertCounts.orange||0],['yellow','Yellow',alertCounts.yellow||0],['normal','Normal',alertCounts.normal||0]].map(([f,l,n]) => {
          const fc = AC[f] || { bg: '#2563eb', light: '#eff6ff', border: '#bfdbfe' };
          return (
            <button key={f} onClick={() => setFilter(f)}
              style={{ background: filter===f ? (f==='all'?'#2563eb':fc.bg) : T.surface, color: filter===f ? '#fff' : T.textMid, border: `1px solid ${filter===f?(f==='all'?'#2563eb':fc.bg):T.border}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
              {l} ({n})
            </button>
          );
        })}
      </div>

      {/* ── City grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
        {filtered.map(city => <CityCard key={city.id} city={city} onClick={() => setSelectedCity(city)} />)}
        {filtered.length === 0 && <div style={{ gridColumn:'1/-1', textAlign:'center', color:T.textMute, padding:40 }}>No cities match this filter.</div>}
      </div>
    </div>
  );
}
