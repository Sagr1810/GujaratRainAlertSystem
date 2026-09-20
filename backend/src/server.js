require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const store = require('./utils/demoStore');

// Routes
const weatherRoutes = require('./routes/weather');
const alertRoutes = require('./routes/alerts');
const historyRoutes = require('./routes/history');
const agentRoutes = require('./routes/agent');
const regionRoutes = require('./routes/regions');
const reservoirRoutes = require('./routes/reservoirs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// Routes
app.use('/api/weather', weatherRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/reservoirs', reservoirRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Gujarat Rain Alert System',
    mode: store.isDemoMode() ? 'demo' : 'live',
    database: store.isDemoMode() ? 'demo-mode' : 'mysql-connected',
  });
});

// Cities endpoint
app.get('/api/cities', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoCities(req.query), mode: 'demo' });
  }
  try {
    const { sequelize, City, Region } = require('./models');
    const { region_id, is_major } = req.query;
    const where = {};
    if (region_id) where.region_id = region_id;
    if (is_major !== undefined) where.is_major = is_major === 'true';
    const cities = await City.findAll({ where, include: [Region], order: [['is_major', 'DESC'], ['name', 'ASC']] });
    res.json({ success: true, data: cities });
  } catch (err) {
    res.json({ success: true, data: store.getDemoCities(req.query), mode: 'demo' });
  }
});

// Forecast endpoint
app.get('/api/forecast/:cityId', async (req, res) => {
  try {
    const { fetchForecast } = require('./services/weatherService');
    if (!store.isDemoMode()) {
      const { City } = require('./models');
      const city = await City.findByPk(req.params.cityId);
      if (!city) return res.status(404).json({ success: false, error: 'City not found' });
      const forecast = await fetchForecast(city.lat, city.lng);
      return res.json({ success: true, city: city.name, data: forecast });
    }
    // Demo mode: find city and use mock forecast
    const city = store.CITIES_WITH_IDS.find((c) => c.id === parseInt(req.params.cityId));
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });
    const forecast = await fetchForecast(city.lat, city.lng);
    res.json({ success: true, city: city.name, data: forecast });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoStats() });
  }
  try {
    const { City, Alert, RainReading, sequelize } = require('./models');
    const { Op } = require('sequelize');
    const totalCities = await City.count();
    const activeAlerts = await Alert.count({ where: { is_active: true } });
    const todayReadings = await RainReading.count({
      where: { recorded_at: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    res.json({
      success: true,
      data: { total_cities: totalCities, active_alerts: activeAlerts, readings_today: todayReadings, last_update: new Date().toISOString(), regions: 6, monitoring_since: '2021' },
    });
  } catch (err) {
    res.json({ success: true, data: store.getDemoStats() });
  }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);
  socket.on('subscribe_region', (regionCode) => socket.join(`region_${regionCode}`));
  socket.on('subscribe_city', (cityId) => socket.join(`city_${cityId}`));
  socket.on('disconnect', () => console.log(`[WS] Client disconnected: ${socket.id}`));
});

// Demo mode weather broadcasting (every 30s)
const broadcastDemoWeather = () => {
  if (!store.isDemoMode()) return;
  const cities = store.CITIES_WITH_IDS;
  const randomCity = cities[Math.floor(Math.random() * cities.length)];
  if (randomCity) {
    const weather = store.demoWeather[randomCity.id];
    if (weather) {
      io.emit('weather_update', { city_id: randomCity.id, reading: weather });
      io.to(`region_${randomCity.region_id}`).emit('region_update', {
        city_id: randomCity.id, city_name: randomCity.name, reading: { alert_level: weather.alert_level, rainfall_24h: weather.rainfall_24h },
      });
    }
  }
  io.emit('data_refreshed', { timestamp: new Date().toISOString(), cities_updated: cities.length, mode: 'demo' });
};

// Initialize server
const init = async () => {
  const PORT = process.env.PORT || 5000;

  // Try MySQL first
  try {
    const { sequelize, City, RainReading, Alert, Region, Reservoir } = require('./models');
    const { REGIONS, CITIES, HISTORICAL_IMPACTS, RESERVOIRS } = require('./utils/seedData');
    const { fetchCurrentWeather } = require('./services/weatherService');

    await sequelize.authenticate();
    console.log('[DB] MySQL connected ✓');
    store.setDbAvailable(true);

    await sequelize.sync({ alter: false, force: false });
    console.log('[DB] Tables synced ✓');

    // Seed
    for (const region of REGIONS) {
      await Region.findOrCreate({ where: { code: region.code }, defaults: region });
    }
    for (const city of CITIES) {
      await City.findOrCreate({ where: { name: city.name, region_id: city.region_id }, defaults: city });
    }
    for (const res of RESERVOIRS) {
      await Reservoir.findOrCreate({
        where: { name: res.name },
        defaults: { ...res, current_level_mcm: parseFloat((res.capacity_mcm * (0.4 + Math.random() * 0.5)).toFixed(2)), current_percent: parseFloat((40 + Math.random() * 50).toFixed(2)) },
      });
    }
    const { HistoricalImpact } = require('./models');
    const count = await HistoricalImpact.count();
    if (count === 0) {
      for (const impact of HISTORICAL_IMPACTS) await HistoricalImpact.create(impact);
    }
    console.log('[SEED] Database seeded ✓');

    // Weather cron
    const refreshWeather = async () => {
      try {
        const allCities = await City.findAll();
        for (const city of allCities) {
          try {
            const weather = await fetchCurrentWeather(city.lat, city.lng);
            await RainReading.create({ city_id: city.id, region_id: city.region_id, ...weather });
            if (weather.alert_level !== 'normal') {
              const msgs = { yellow: 'Moderate rainfall. Stay alert.', orange: 'Heavy rain. Avoid low areas.', red: 'Very heavy rain. Stay indoors.', dark_red: 'EXTREME RAIN. Evacuate now. Call 112.' };
              const existing = await Alert.findOne({ where: { city_id: city.id, alert_type: weather.alert_level, is_active: true } });
              if (!existing) {
                const newAlert = await Alert.create({
                  city_id: city.id, region_id: city.region_id, alert_type: weather.alert_level,
                  title: `${weather.alert_level.toUpperCase().replace('_', ' ')} Alert — ${city.name}`,
                  message: msgs[weather.alert_level], rainfall_mm: weather.rainfall_24h,
                  expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), source: 'auto',
                });
                io.emit('new_alert', { alert: newAlert.toJSON(), city: city.toJSON() });
              }
            }
            io.to(`city_${city.id}`).emit('weather_update', { city_id: city.id, reading: weather });
          } catch (e) { /* skip this city */ }
        }
        io.emit('data_refreshed', { timestamp: new Date().toISOString() });
      } catch (e) { console.error('[CRON]', e.message); }
    };
    cron.schedule('*/10 * * * *', refreshWeather); // IMD data refresh every 10 minutes
    setTimeout(refreshWeather, 3000);

  } catch (dbErr) {
    console.log(`[INFO] MySQL not available (${dbErr.message.split('\n')[0]})`);
    console.log('[INFO] Starting in DEMO MODE — all data served from memory');
    store.setDbAvailable(false);

    // Broadcast demo data every 30 seconds
    setInterval(broadcastDemoWeather, 30000);
    setTimeout(broadcastDemoWeather, 2000);
  }

  // ─── Govt data auto-sync — runs every 6 hours regardless of DB mode ──
  const { runSync } = require('./services/govSync');
  // Initial sync after 15 seconds (give weather refresh time to start first)
  setTimeout(() => {
    runSync(io).then((r) => {
      console.log(`[SYNC] Government data sync complete. New events: ${r.new_events || 0}`);
    }).catch((e) => console.log(`[SYNC] Error: ${e.message}`));
  }, 15000);
  // Every 6 hours
  cron.schedule('0 */6 * * *', () => {
    runSync(io).then((r) => {
      console.log(`[SYNC] Auto govt sync. New: ${r.new_events || 0} events, Enriched: ${r.enriched || 0}`);
    }).catch((e) => console.log(`[SYNC] Cron error: ${e.message}`));
  });

  server.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  Gujarat Rain Alert System — Backend v1.0        ║`);
    console.log(`║  Mode:   ${store.isDemoMode() ? 'DEMO (no MySQL required)     ' : 'LIVE (MySQL connected)        '}║`);
    console.log(`║  Server: http://localhost:${PORT}                   ║`);
    console.log(`║  Health: http://localhost:${PORT}/api/health         ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
  });
};

init();
module.exports = { app, io };
