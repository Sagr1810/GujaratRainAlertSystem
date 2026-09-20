const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const store = require('../utils/demoStore');

let Alert, City;
try { const m = require('../models'); Alert = m.Alert; City = m.City; } catch (e) {}

// GET /api/alerts
router.get('/', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoAlerts(req.query), count: store.getDemoAlerts(req.query).length, mode: 'demo' });
  }
  try {
    const { region_id, type, limit = 50 } = req.query;
    const where = { is_active: true };
    if (region_id) where.region_id = region_id;
    if (type) where.alert_type = type;
    const alerts = await Alert.findAll({ where, include: [{ model: City, required: false }], order: [['issued_at', 'DESC']], limit: parseInt(limit) });
    res.json({ success: true, data: alerts, count: alerts.length });
  } catch (err) {
    const data = store.getDemoAlerts(req.query);
    res.json({ success: true, data, count: data.length, mode: 'demo' });
  }
});

// GET /api/alerts/history
router.get('/history', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoAlerts(), mode: 'demo' });
  }
  try {
    const { days = 7, region_id } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));
    const where = { issued_at: { [Op.gte]: since } };
    if (region_id) where.region_id = region_id;
    const alerts = await Alert.findAll({ where, include: [{ model: City, required: false }], order: [['issued_at', 'DESC']], limit: 200 });
    res.json({ success: true, data: alerts });
  } catch (err) {
    res.json({ success: true, data: store.getDemoAlerts(), mode: 'demo' });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: { ...req.body, id: Date.now(), is_active: true, issued_at: new Date().toISOString() }, mode: 'demo' });
  }
  try {
    const { city_id, region_id, alert_type, title, message, rainfall_mm, expires_hours } = req.body;
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + (expires_hours || 24));
    const alert = await Alert.create({ city_id, region_id, alert_type, title, message, rainfall_mm, expires_at, source: 'manual' });
    res.json({ success: true, data: alert });
  } catch (err) {
    res.json({ success: true, data: { ...req.body, id: Date.now(), is_active: true }, mode: 'demo' });
  }
});

// PUT /api/alerts/:id/deactivate
router.put('/:id/deactivate', async (req, res) => {
  if (store.isDemoMode()) return res.json({ success: true, message: 'Alert deactivated (demo)' });
  try {
    await Alert.update({ is_active: false }, { where: { id: req.params.id } });
    res.json({ success: true, message: 'Alert deactivated' });
  } catch (err) {
    res.json({ success: true, message: 'Alert deactivated (demo)' });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  if (store.isDemoMode()) return res.json({ success: true, message: 'Alert deleted (demo)' });
  try {
    await Alert.destroy({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (err) {
    res.json({ success: true, message: 'Alert deleted (demo)' });
  }
});

module.exports = router;
