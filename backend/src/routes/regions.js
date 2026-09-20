const express = require('express');
const router = express.Router();
const store = require('../utils/demoStore');

let Region, City, Reservoir;
try { const m = require('../models'); Region = m.Region; City = m.City; Reservoir = m.Reservoir; } catch (e) {}

// GET /api/regions
router.get('/', async (req, res) => {
  if (store.isDemoMode()) {
    const regions = store.REGIONS_WITH_IDS.map((r) => ({
      ...r,
      Cities: store.CITIES_WITH_IDS.filter((c) => c.region_id === r.id),
    }));
    return res.json({ success: true, data: regions, mode: 'demo' });
  }
  try {
    const regions = await Region.findAll({ include: [City], order: [['name', 'ASC']] });
    res.json({ success: true, data: regions });
  } catch (err) {
    const regions = store.REGIONS_WITH_IDS.map((r) => ({
      ...r, Cities: store.CITIES_WITH_IDS.filter((c) => c.region_id === r.id),
    }));
    res.json({ success: true, data: regions, mode: 'demo' });
  }
});

// GET /api/regions/:code
router.get('/:code', async (req, res) => {
  if (store.isDemoMode()) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    return res.json({ success: true, data: { ...result.region, Cities: result.cities }, mode: 'demo' });
  }
  try {
    const region = await Region.findOne({ where: { code: req.params.code.toUpperCase() }, include: [City, Reservoir] });
    if (!region) return res.status(404).json({ success: false, error: 'Region not found' });
    res.json({ success: true, data: region });
  } catch (err) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    res.json({ success: true, data: { ...result.region, Cities: result.cities }, mode: 'demo' });
  }
});

// GET /api/regions/:code/cities
router.get('/:code/cities', async (req, res) => {
  if (store.isDemoMode()) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    return res.json({ success: true, data: result.cities, mode: 'demo' });
  }
  try {
    const region = await Region.findOne({ where: { code: req.params.code.toUpperCase() } });
    if (!region) return res.status(404).json({ success: false, error: 'Region not found' });
    const cities = await City.findAll({ where: { region_id: region.id }, order: [['is_major', 'DESC'], ['name', 'ASC']] });
    res.json({ success: true, data: cities });
  } catch (err) {
    const result = store.getDemoRegion(req.params.code);
    if (!result) return res.status(404).json({ success: false, error: 'Region not found' });
    res.json({ success: true, data: result.cities, mode: 'demo' });
  }
});

module.exports = router;
