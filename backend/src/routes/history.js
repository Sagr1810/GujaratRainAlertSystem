const express = require('express');
const router = express.Router();
const store = require('../utils/demoStore');
const { getSyncStatus } = require('../services/govSync');

let HistoricalImpact, Region;
try { const m = require('../models'); HistoricalImpact = m.HistoricalImpact; Region = m.Region; } catch (e) {}

// ─── helper: build year summary from flat event list ──────────────────
const buildSummary = (impacts) => {
  const summary = {};
  impacts.forEach((imp) => {
    const y = imp.year;
    if (!summary[y]) summary[y] = { year: y, total_deaths: 0, total_displaced: 0, total_crops_ha: 0, total_loss_cr: 0, events: [] };
    summary[y].total_deaths += imp.deaths || 0;
    summary[y].total_displaced += imp.displaced || 0;
    summary[y].total_crops_ha += parseFloat(imp.crops_damaged_ha || 0);
    summary[y].total_loss_cr += parseFloat(imp.infrastructure_loss_cr || 0);
    summary[y].events.push({
      event_name:      imp.event_name,
      region:          imp.Region?.name,
      event_type:      imp.event_type,
      max_rainfall_mm: imp.max_rainfall_mm,
      source:          imp.source,
      verified:        imp.verified,
      is_ongoing:      imp.is_ongoing,
    });
  });
  return Object.values(summary).sort((a, b) => a.year - b.year);
};

// GET /api/history
router.get('/', async (req, res) => {
  if (store.isDemoMode()) {
    const data = store.getDemoHistory(req.query);
    return res.json({ success: true, data, count: data.length, mode: 'demo', sync_status: getSyncStatus() });
  }
  try {
    const { year, region_id, event_type } = req.query;
    const where = {};
    if (year) where.year = year;
    if (region_id) where.region_id = region_id;
    if (event_type) where.event_type = event_type;
    const impacts = await HistoricalImpact.findAll({
      where,
      include: [{ model: Region, required: false }],
      order: [['year', 'DESC'], ['deaths', 'DESC']],
    });
    res.json({ success: true, data: impacts, count: impacts.length, sync_status: getSyncStatus() });
  } catch (err) {
    const data = store.getDemoHistory(req.query);
    res.json({ success: true, data, count: data.length, mode: 'demo', sync_status: getSyncStatus() });
  }
});

// GET /api/history/summary
router.get('/summary', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoHistorySummary(), mode: 'demo', sync_status: getSyncStatus() });
  }
  try {
    const impacts = await HistoricalImpact.findAll({
      include: [{ model: Region, required: false }],
      order: [['year', 'ASC']],
    });
    res.json({ success: true, data: buildSummary(impacts), sync_status: getSyncStatus() });
  } catch (err) {
    res.json({ success: true, data: store.getDemoHistorySummary(), mode: 'demo', sync_status: getSyncStatus() });
  }
});

// GET /api/history/cities
router.get('/cities', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoHistory({}).slice(0, 20), mode: 'demo' });
  }
  try {
    const impacts = await HistoricalImpact.findAll({
      include: [{ model: Region, required: false }],
      order: [['deaths', 'DESC']],
      limit: 20,
    });
    res.json({ success: true, data: impacts });
  } catch (err) {
    res.json({ success: true, data: store.getDemoHistory({}).slice(0, 20), mode: 'demo' });
  }
});

// GET /api/history/sync-status
router.get('/sync-status', (req, res) => {
  res.json({ success: true, ...getSyncStatus() });
});

// POST /api/history/sync  — manual trigger (also called by cron)
router.post('/sync', async (req, res) => {
  try {
    const { runSync } = require('../services/govSync');
    // Get Socket.io instance if attached to app
    const io = req.app.get('io');
    const result = await runSync(io);
    res.json({ success: true, ...result });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

module.exports = router;
