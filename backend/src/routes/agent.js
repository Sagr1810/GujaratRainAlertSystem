const express = require('express');
const router = express.Router();
const { generateGraniteResponse } = require('../services/graniteService');
const store = require('../utils/demoStore');
const { randomUUID } = require('crypto');
const uuidv4 = () => (randomUUID ? randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

let AgentConversation, RainReading, City, Alert;
try { const m = require('../models'); AgentConversation = m.AgentConversation; RainReading = m.RainReading; City = m.City; Alert = m.Alert; } catch (e) {}

// POST /api/agent/chat
router.post('/chat', async (req, res) => {
  try {
    const { message, session_id, city_id, language = 'en' } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const sid = session_id || uuidv4();

    // Build context — try DB first, fall back to demo store
    let contextData = {};
    try {
      if (city_id && !store.isDemoMode() && City && RainReading) {
        const city = await City.findByPk(city_id);
        const reading = await RainReading.findOne({ where: { city_id }, order: [['recorded_at', 'DESC']] });
        if (city) contextData.city = city.name;
        if (reading) {
          contextData.rainfall_24h = parseFloat(reading.rainfall_24h || 0);
          contextData.rainfall_1h = parseFloat(reading.rainfall_1h || 0);
          contextData.temperature = parseFloat(reading.temperature || 0);
          contextData.humidity = reading.humidity;
          contextData.alert_level = reading.alert_level;
          contextData.weather_desc = reading.weather_desc;
        }
      } else if (city_id) {
        // Use demo store data
        const cityIdNum = parseInt(city_id);
        const demoCity = store.CITIES_WITH_IDS.find((c) => c.id === cityIdNum);
        const demoW = store.demoWeather[cityIdNum];
        if (demoCity) contextData.city = demoCity.name;
        if (demoW) {
          contextData.rainfall_24h = demoW.rainfall_24h;
          contextData.alert_level = demoW.alert_level;
          contextData.temperature = demoW.temperature;
          contextData.humidity = demoW.humidity;
        }
      }
    } catch (ctxErr) {
      // context building failed — continue without it
    }

    // Get active alerts for context
    try {
      let activeAlerts = [];
      if (!store.isDemoMode() && Alert) {
        activeAlerts = await Alert.findAll({ where: { is_active: true }, limit: 3 });
      } else {
        activeAlerts = store.getDemoAlerts().slice(0, 3);
      }
      if (activeAlerts.length > 0) {
        contextData.active_alerts = activeAlerts.map((a) => `${(a.alert_type || '').toUpperCase()}: ${a.title}`);
      }
    } catch (alertErr) {
      // ignore — alerts context is optional
    }

    // Generate AI response — this MUST succeed
    const result = await generateGraniteResponse(message, contextData);

    // Save conversation — optional, don't fail if DB unavailable
    try {
      if (!store.isDemoMode() && AgentConversation) {
        await AgentConversation.create({
          session_id: sid,
          user_message: message,
          agent_response: result.response,
          context_data: contextData,
          response_time_ms: result.response_time_ms,
          language,
        });
      } else {
        store.saveDemoConversation({
          session_id: sid,
          user_message: message,
          agent_response: result.response,
          context_data: contextData,
          response_time_ms: result.response_time_ms,
          language,
        });
      }
    } catch (saveErr) {
      // DB save failed — ignore, still return response
    }

    res.json({
      success: true,
      session_id: sid,
      response: result.response,
      source: result.source,
      response_time_ms: result.response_time_ms,
    });

  } catch (err) {
    // Absolute last resort — return a friendly message instead of 500
    console.error('[AGENT] Unexpected error:', err.message);
    res.json({
      success: true,
      session_id: req.body.session_id || uuidv4(),
      response: `🤖 **GujaratRainBot**: I'm here to help!\n\nI encountered a temporary issue but I'm still operational. Please try asking your question again.\n\n**Quick help:**\n• Current rain alerts for Gujarat\n• Flood safety information\n• Farmer crop advisories\n• Emergency contacts: 112\n\n*Powered by IBM Granite LLM*`,
      source: 'fallback',
      response_time_ms: 50,
    });
  }
});

// GET /api/agent/history/:session_id
router.get('/history/:session_id', async (req, res) => {
  if (store.isDemoMode()) {
    return res.json({ success: true, data: store.getDemoConversations(req.params.session_id) });
  }
  try {
    const conversations = await AgentConversation.findAll({
      where: { session_id: req.params.session_id },
      order: [['createdAt', 'ASC']],
      limit: 50,
    });
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.json({ success: true, data: store.getDemoConversations(req.params.session_id) });
  }
});

// POST /api/agent/rate
router.post('/rate', async (req, res) => {
  if (store.isDemoMode()) return res.json({ success: true });
  try {
    const { conversation_id, rating } = req.body;
    if (AgentConversation) await AgentConversation.update({ rating }, { where: { id: conversation_id } });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

module.exports = router;
