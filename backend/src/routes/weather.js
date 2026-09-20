const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const store = require('../utils/demoStore');

let Region, City, RainReading, Alert;
try {
  const models = require('../models');
  Region = models.Region; City = models.City; RainReading = models.RainReading; Alert = models.Alert;
} catch (e) {}

// GET /api/weather/live
router.get('/live', async (req, res) => {
  const { region_id } = req.query;
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoLiveWeather(region_id), mode: 'demo' });
  }
  try {
    const where = region_id ? { region_id } : {};
    const cities = await City.findAll({ where, include: [{ model: Region }] });
    const readings = await Promise.all(
      cities.map(async (city) => {
        const latest = await RainReading.findOne({ where: { city_id: city.id }, order: [['recorded_at', 'DESC']] });
        return { ...city.toJSON(), weather: latest ? latest.toJSON() : null };
      })
    );
    res.json({ success: true, data: readings });
  } catch (err) {
    // fallback to demo on any DB error
    res.json({ success: true, data: store.getDemoLiveWeather(region_id), mode: 'demo' });
  }
});

// GET /api/weather/city/:id
router.get('/city/:id', async (req, res) => {
  if (store.isDemoMode()) {
    const city = store.CITIES_WITH_IDS.find((c) => c.id === parseInt(req.params.id));
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });
    const weather = store.demoWeather[city.id];
    return res.json({ success: true, data: { city, readings: weather ? [weather] : [] }, mode: 'demo' });
  }
  try {
    const city = await City.findByPk(req.params.id, { include: [Region] });
    if (!city) return res.status(404).json({ success: false, error: 'City not found' });
    const readings = await RainReading.findAll({ where: { city_id: city.id }, order: [['recorded_at', 'DESC']], limit: 48 });
    res.json({ success: true, data: { city, readings } });
  } catch (err) {
    const city = store.CITIES_WITH_IDS.find((c) => c.id === parseInt(req.params.id));
    res.json({ success: true, data: { city, readings: [] }, mode: 'demo' });
  }
});

// GET /api/weather/region/:code
router.get('/region/:code', async (req, res) => {
  if (store.isDemoMode()) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    return res.json({ success: true, region: result.region, data: result.cities, mode: 'demo' });
  }
  try {
    const region = await Region.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!region) return res.status(404).json({ success: false, error: 'Region not found' });
    const cities = await City.findAll({ where: { region_id: region.id }, include: [Region] });
    const data = await Promise.all(
      cities.map(async (c) => {
        const reading = await RainReading.findOne({ where: { city_id: c.id }, order: [['recorded_at', 'DESC']] });
        return { ...c.toJSON(), weather: reading?.toJSON() || null };
      })
    );
    res.json({ success: true, region, data });
  } catch (err) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    res.json({ success: true, region: result.region, data: result.cities, mode: 'demo' });
  }
});

// GET /api/weather/summary
router.get('/summary', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoSummary(), mode: 'demo' });
  }
  try {
    const regions = await Region.findAll();
    const summary = await Promise.all(
      regions.map(async (r) => {
        const cities = await City.findAll({ where: { region_id: r.id } });
        const latestReadings = await Promise.all(
          cities.map((c) => RainReading.findOne({ where: { city_id: c.id }, order: [['recorded_at', 'DESC']] }))
        );
        const valid = latestReadings.filter(Boolean);
        const avgRain = valid.length ? valid.reduce((s, x) => s + parseFloat(x.rainfall_24h || 0), 0) / valid.length : 0;
        const maxRain = valid.length ? Math.max(...valid.map((x) => parseFloat(x.rainfall_24h || 0))) : 0;
        const order = ['normal', 'yellow', 'orange', 'red', 'dark_red'];
        const highestAlert = valid.reduce((h, x) => order.indexOf(x.alert_level) > order.indexOf(h) ? x.alert_level : h, 'normal');
        return { region: r.toJSON(), avg_rainfall_24h: parseFloat(avgRain.toFixed(2)), max_rainfall_24h: parseFloat(maxRain.toFixed(2)), alert_level: highestAlert, cities_count: cities.length };
      })
    );
    res.json({ success: true, data: summary });
  } catch (err) {
    res.json({ success: true, data: store.getDemoSummary(), mode: 'demo' });
  }
});

// POST /api/weather/refresh
router.post('/refresh', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, message: 'Demo mode — weather data refreshed in memory', updated: store.CITIES_WITH_IDS.length });
  }
  try {
    const { fetchCurrentWeather } = require('../services/weatherService');
    const cities = await City.findAll({ where: { is_major: true } });
    const results = [];
    for (const city of cities) {
      try {
        const weather = await fetchCurrentWeather(city.lat, city.lng);
        await RainReading.create({ city_id: city.id, region_id: city.region_id, ...weather });
        results.push({ city: city.name, status: 'updated' });
      } catch (e) { results.push({ city: city.name, status: 'failed', error: e.message }); }
    }
    res.json({ success: true, updated: results.length, results });
  } catch (err) {
    res.json({ success: true, message: 'Refreshed in demo mode', updated: 0 });
  }
});

module.exports = router;
