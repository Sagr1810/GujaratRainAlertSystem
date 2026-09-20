/**
 * In-memory demo data store — used when MySQL is not available.
 * All routes check isDemoMode() and fall back to this data.
 */
const { REGIONS, CITIES, HISTORICAL_IMPACTS, RESERVOIRS } = require('./seedData');

let dbAvailable = false;
let demoWeather = {};           // city_id → weather reading
let demoAlerts = [];            // active alerts list
let demoReservoirs = [];        // reservoir list with levels
let demoConversations = [];     // chat history in memory
let extraHistoryEvents = [];    // runtime events added by govSync

const initDemoData = () => {
  // Generate weather for each city
  CITIES.forEach((city, idx) => {
    const rainfall24h = parseFloat((Math.random() * 80).toFixed(2));
    let alert_level = 'normal';
    if (rainfall24h >= 204.5) alert_level = 'dark_red';
    else if (rainfall24h >= 115.6) alert_level = 'red';
    else if (rainfall24h >= 64.5) alert_level = 'orange';
    else if (rainfall24h >= 35.5) alert_level = 'yellow';

    demoWeather[idx + 1] = {
      id: idx + 1,
      city_id: idx + 1,
      region_id: city.region_id,
      rainfall_mm: parseFloat((Math.random() * 10).toFixed(2)),
      rainfall_1h: parseFloat((Math.random() * 10).toFixed(2)),
      rainfall_3h: parseFloat((Math.random() * 30).toFixed(2)),
      rainfall_24h: rainfall24h,
      temperature: parseFloat((22 + Math.random() * 12).toFixed(1)),
      humidity: Math.round(55 + Math.random() * 40),
      wind_speed: parseFloat((3 + Math.random() * 25).toFixed(1)),
      wind_direction: Math.round(Math.random() * 360),
      pressure: parseFloat((1000 + Math.random() * 20).toFixed(1)),
      visibility_km: parseFloat((4 + Math.random() * 6).toFixed(1)),
      cloud_cover: Math.round(40 + Math.random() * 60),
      weather_desc: rainfall24h > 64 ? 'heavy rain' : rainfall24h > 35 ? 'moderate rain' : 'partly cloudy',
      weather_icon: rainfall24h > 64 ? '09d' : rainfall24h > 35 ? '10d' : '02d',
      alert_level,
      recorded_at: new Date().toISOString(),
      source: 'demo',
    };
  });

  // Generate some demo alerts
  const alertCities = CITIES.filter((_, i) => [2, 6, 12, 18, 24].includes(i)); // a few cities
  alertCities.forEach((city, idx) => {
    const types = ['orange', 'red', 'yellow'];
    const type = types[idx % types.length];
    demoAlerts.push({
      id: idx + 1,
      city_id: idx + 1,
      region_id: city.region_id,
      alert_type: type,
      title: `${type.toUpperCase()} Alert — ${city.name}`,
      message: type === 'red'
        ? 'Very heavy rainfall. Stay indoors. Flooding possible in low-lying areas.'
        : type === 'orange'
        ? 'Heavy rainfall warning. Avoid waterlogged roads and low-lying areas.'
        : 'Moderate to heavy rainfall expected. Stay alert.',
      rainfall_mm: type === 'red' ? 145 : type === 'orange' ? 85 : 48,
      is_active: true,
      issued_at: new Date(Date.now() - Math.random() * 3600000 * 5).toISOString(),
      expires_at: new Date(Date.now() + 3600000 * 12).toISOString(),
      source: 'demo',
      City: { id: idx + 1, name: city.name, district: city.district },
    });
  });

  // Generate reservoir levels
  demoReservoirs = RESERVOIRS.map((r, idx) => ({
    id: idx + 1,
    ...r,
    current_percent: parseFloat((30 + Math.random() * 65).toFixed(2)),
    current_level_mcm: 0,
    updated_at: new Date().toISOString(),
    Region: REGIONS.find((reg) => reg.id === r.region_id) || null,
  }));
  demoReservoirs.forEach((r) => {
    r.current_level_mcm = parseFloat(((r.current_percent / 100) * r.capacity_mcm).toFixed(2));
  });
};

// Build CITIES with IDs and region info attached
const CITIES_WITH_IDS = CITIES.map((c, i) => ({
  id: i + 1,
  ...c,
  Region: REGIONS.find((r) => r.id === c.region_id) || null,
}));

const REGIONS_WITH_IDS = REGIONS.map((r) => ({ ...r }));

// Refresh live weather via Open-Meteo for all cities (in demo mode too)
const refreshLiveWeather = async () => {
  const { fetchCurrentWeather } = require('../services/weatherService');
  for (let idx = 0; idx < CITIES.length; idx++) {
    const city = CITIES[idx];
    try {
      const weather = await fetchCurrentWeather(city.lat, city.lng);
      demoWeather[idx + 1] = {
        id: idx + 1,
        city_id: idx + 1,
        region_id: city.region_id,
        ...weather,
        recorded_at: new Date().toISOString(),
      };
    } catch (e) {
      // keep existing data on individual city failure
    }
  }
  console.log(`[INFO] Live weather refreshed for ${CITIES.length} Gujarat cities via IMD/Open-Meteo`);
};

initDemoData();

// Fetch real live data immediately on startup, then every 10 min
refreshLiveWeather().catch(() => {});
setInterval(() => refreshLiveWeather().catch(() => {}), 10 * 60 * 1000);

const setDbAvailable = (val) => { dbAvailable = val; };
const isDemoMode = () => !dbAvailable;

const getDemoLiveWeather = (region_id) => {
  return CITIES_WITH_IDS
    .filter((c) => !region_id || c.region_id === parseInt(region_id))
    .map((c) => ({ ...c, weather: demoWeather[c.id] || null }));
};

const getDemoRegion = (code) => {
  const region = REGIONS_WITH_IDS.find((r) => r.code === code.toUpperCase());
  if (!region) return null;
  const cities = CITIES_WITH_IDS.filter((c) => c.region_id === region.id)
    .map((c) => ({ ...c, weather: demoWeather[c.id] || null }));
  return { region, cities };
};

const getDemoSummary = () => {
  return REGIONS_WITH_IDS.map((region) => {
    const cities = CITIES_WITH_IDS.filter((c) => c.region_id === region.id);
    const readings = cities.map((c) => demoWeather[c.id]).filter(Boolean);
    const avgRain = readings.length
      ? readings.reduce((s, r) => s + parseFloat(r.rainfall_24h || 0), 0) / readings.length : 0;
    const maxRain = readings.length
      ? Math.max(...readings.map((r) => parseFloat(r.rainfall_24h || 0))) : 0;
    const order = ['normal', 'yellow', 'orange', 'red', 'dark_red'];
    const highestAlert = readings.reduce((h, r) =>
      order.indexOf(r.alert_level) > order.indexOf(h) ? r.alert_level : h, 'normal');
    return {
      region,
      avg_rainfall_24h: parseFloat(avgRain.toFixed(2)),
      max_rainfall_24h: parseFloat(maxRain.toFixed(2)),
      alert_level: highestAlert,
      cities_count: cities.length,
    };
  });
};

const getDemoAlerts = (params = {}) => {
  let list = [...demoAlerts];
  if (params.region_id) list = list.filter((a) => a.region_id === parseInt(params.region_id));
  if (params.type) list = list.filter((a) => a.alert_type === params.type);
  return list.filter((a) => a.is_active);
};

const getDemoHistory = (params = {}) => {
  const enriched = HISTORICAL_IMPACTS.map((imp, idx) => ({
    id: idx + 1,
    ...imp,
    Region: REGIONS.find((r) => r.id === imp.region_id) || null,
  }));
  let list = enriched;
  if (params.year) list = list.filter((i) => i.year === parseInt(params.year));
  if (params.region_id) list = list.filter((i) => i.region_id === parseInt(params.region_id));
  if (params.event_type) list = list.filter((i) => i.event_type === params.event_type);
  return list;
};

const getDemoHistorySummary = () => {
  // Include both seed data and any runtime-added extra events
  const base = HISTORICAL_IMPACTS.map((imp, idx) => ({
    id: idx + 1, ...imp,
    Region: REGIONS.find((r) => r.id === imp.region_id) || null,
  }));
  const all = [...base, ...extraHistoryEvents];
  const summary = {};
  all.forEach((imp) => {
    const y = imp.year;
    if (!summary[y]) summary[y] = { year: y, total_deaths: 0, total_displaced: 0, total_crops_ha: 0, total_loss_cr: 0, events: [] };
    summary[y].total_deaths += imp.deaths || 0;
    summary[y].total_displaced += imp.displaced || 0;
    summary[y].total_crops_ha += parseFloat(imp.crops_damaged_ha || 0);
    summary[y].total_loss_cr += parseFloat(imp.infrastructure_loss_cr || 0);
    summary[y].events.push({ event_name: imp.event_name, region: imp.Region?.name, event_type: imp.event_type, max_rainfall_mm: imp.max_rainfall_mm, source: imp.source, verified: imp.verified, is_ongoing: imp.is_ongoing });
  });
  return Object.values(summary).sort((a, b) => a.year - b.year);
};

const getDemoReservoirs = (params = {}) => {
  let list = [...demoReservoirs];
  if (params.region_id) list = list.filter((r) => r.region_id === parseInt(params.region_id));
  return list;
};

const getDemoStats = () => ({
  total_cities: CITIES.length,
  active_alerts: demoAlerts.filter((a) => a.is_active).length,
  readings_today: CITIES.length,
  last_update: new Date().toISOString(),
  regions: 6,
  monitoring_since: '2021',
  mode: 'demo',
});

const getDemoCities = (params = {}) => {
  let list = [...CITIES_WITH_IDS];
  if (params.region_id) list = list.filter((c) => c.region_id === parseInt(params.region_id));
  if (params.is_major !== undefined) list = list.filter((c) => c.is_major === (params.is_major === 'true' || params.is_major === true));
  return list;
};

const saveDemoConversation = (data) => {
  demoConversations.push({ id: demoConversations.length + 1, ...data, createdAt: new Date().toISOString() });
};

const getDemoConversations = (session_id) => demoConversations.filter((c) => c.session_id === session_id);

// ─── Govt Sync helpers ────────────────────────────────────────────────

const addDemoHistoryEvents = (events) => {
  events.forEach((evt) => {
    const id = HISTORICAL_IMPACTS.length + extraHistoryEvents.length + 1;
    extraHistoryEvents.push({ id, ...evt, Region: REGIONS.find((r) => r.id === evt.region_id) || null });
  });
};

const enrichDemoHistoryEvent = (id, patch) => {
  // Try in extra events first, then seed
  const idx = extraHistoryEvents.findIndex((e) => e.id === id);
  if (idx >= 0) { extraHistoryEvents[idx] = { ...extraHistoryEvents[idx], ...patch }; return; }
  // seed events are read-only but we can patch via overrides map
  if (!enrichDemoHistoryEvent._overrides) enrichDemoHistoryEvent._overrides = {};
  enrichDemoHistoryEvent._overrides[id] = { ...(enrichDemoHistoryEvent._overrides[id] || {}), ...patch };
};

const updateDemoWeather = (cityId, weather) => {
  if (!demoWeather[cityId]) return;
  demoWeather[cityId] = { ...demoWeather[cityId], ...weather, recorded_at: new Date().toISOString() };
};

// Override getDemoHistory to include extraHistoryEvents
const _getDemoHistoryBase = getDemoHistory;
const getDemoHistoryFull = (params = {}) => {
  const overrides = enrichDemoHistoryEvent._overrides || {};
  const base = _getDemoHistoryBase(params).map((e) => overrides[e.id] ? { ...e, ...overrides[e.id] } : e);
  let extra = extraHistoryEvents.map((e) => overrides[e.id] ? { ...e, ...overrides[e.id] } : e);
  if (params.year) extra = extra.filter((i) => i.year === parseInt(params.year));
  if (params.region_id) extra = extra.filter((i) => i.region_id === parseInt(params.region_id));
  if (params.event_type) extra = extra.filter((i) => i.event_type === params.event_type);
  return [...base, ...extra].sort((a, b) => b.year - a.year || b.deaths - a.deaths);
};

module.exports = {
  setDbAvailable,
  isDemoMode,
  getDemoLiveWeather,
  getDemoRegion,
  getDemoSummary,
  getDemoAlerts,
  getDemoHistory: getDemoHistoryFull,
  getDemoHistorySummary,
  getDemoReservoirs,
  getDemoStats,
  getDemoCities,
  saveDemoConversation,
  getDemoConversations,
  addDemoHistoryEvents,
  enrichDemoHistoryEvent,
  updateDemoWeather,
  CITIES_WITH_IDS,
  REGIONS_WITH_IDS,
  demoWeather,
};
