const express = require('express');
const router = express.Router();
const store = require('../utils/demoStore');

let Reservoir, Region;
try { const m = require('../models'); Reservoir = m.Reservoir; Region = m.Region; } catch (e) {}

// GET /api/reservoirs
router.get('/', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoReservoirs(req.query), mode: 'demo' });
  }
  try {
    const { region_id } = req.query;
    const where = region_id ? { region_id } : {};
    const reservoirs = await Reservoir.findAll({ where, include: [{ model: Region, required: false }], order: [['capacity_mcm', 'DESC']] });
    res.json({ success: true, data: reservoirs });
  } catch (err) {
    res.json({ success: true, data: store.getDemoReservoirs(req.query), mode: 'demo' });
  }
});

// PUT /api/reservoirs/:id
router.put('/:id', async (req, res) => {
  if (store.isDemoMode()) return res.json({ success: true, message: 'Updated (demo mode)' });
  try {
    const { current_level_mcm } = req.body;
    const reservoir = await Reservoir.findByPk(req.params.id);
    if (!reservoir) return res.status(404).json({ success: false, error: 'Not found' });
    const current_percent = parseFloat(((current_level_mcm / reservoir.capacity_mcm) * 100).toFixed(2));
    await reservoir.update({ current_level_mcm, current_percent, updated_at: new Date() });
    res.json({ success: true, data: reservoir });
  } catch (err) {
    res.json({ success: true, message: 'Updated (demo mode)' });
  }
});

module.exports = router;
