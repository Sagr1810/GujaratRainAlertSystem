const axios = require('axios');

const GRANITE_MODEL = process.env.IBM_GRANITE_MODEL_ID || 'ibm/granite-13b-instruct-v2';
const WATSON_URL = process.env.IBM_WATSON_URL || 'https://us-south.ml.cloud.ibm.com';
const PROJECT_ID = process.env.IBM_WATSON_PROJECT_ID;
const API_KEY = process.env.IBM_WATSON_API_KEY;

let cachedToken = null;
let tokenExpiry = 0;

const getIAMToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  if (!API_KEY || API_KEY === 'your_ibm_watsonx_api_key') return null;
  try {
    const response = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      new URLSearchParams({ grant_type: 'urn:ibm:params:oauth:grant-type:apikey', apikey: API_KEY }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );
    cachedToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (e) {
    return null;
  }
};

const SYSTEM_PROMPT = `You are GujaratRainBot, an intelligent AI assistant specialized in weather, rainfall, floods, and natural disaster management for Gujarat state of India.

You have deep knowledge about:
- All 6 regions of Gujarat: North (Ahmedabad, Gandhinagar, Mehsana), South (Surat, Bharuch, Navsari), East (Vadodara, Anand, Dahod), West (Kutch/Bhuj, Porbandar, Dwarka), Central (Nadiad, Kheda, Cambay), Saurashtra (Rajkot, Junagadh, Bhavnagar, Jamnagar)
- IMD (India Meteorological Department) alert levels: Yellow (35.5-64.4mm), Orange (64.5-115.5mm), Red (115.6-204.4mm), Dark Red (>204.4mm)
- Historical flood events: Cyclone Tauktae (2021), Saurashtra floods (2022), Cyclone Biparjoy (2023), Vadodara mega floods (2024)
- Crop advisory for Gujarat farmers: groundnut, cotton, wheat, sugarcane, castor, vegetables
- Flood evacuation and safety guidelines
- Reservoir water levels and dam safety
- Disease risks after flooding: leptospirosis, malaria, dengue
- Gujarat geography, rivers (Sabarmati, Tapi, Narmada, Mahi, Banas, Bhadar, Vishwamitri, Rupen)

Always respond in the language the user writes in (English, Hindi, or Gujarati).
Be concise, helpful, and safety-focused. For emergencies, always recommend calling 112.
When discussing rainfall, use IMD standard thresholds and terminology.`;

const generateGraniteResponse = async (userMessage, contextData = {}) => {
  const startTime = Date.now();
  const token = await getIAMToken();

  if (!token) {
    return {
      response: generateFallbackResponse(userMessage, contextData),
      source: 'fallback',
      response_time_ms: Date.now() - startTime,
    };
  }

  const contextStr = Object.keys(contextData).length > 0
    ? `\n\nCurrent weather context:\n${JSON.stringify(contextData, null, 2)}`
    : '';

  const prompt = `${SYSTEM_PROMPT}${contextStr}\n\nUser: ${userMessage}\nAssistant:`;

  try {
    const response = await axios.post(
      `${WATSON_URL}/ml/v1/text/generation?version=2023-05-29`,
      {
        model_id: GRANITE_MODEL,
        input: prompt,
        parameters: {
          decoding_method: 'greedy',
          max_new_tokens: 500,
          repetition_penalty: 1.1,
          stop_sequences: ['\nUser:', '\nHuman:'],
        },
        project_id: PROJECT_ID,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const text = response.data.results?.[0]?.generated_text?.trim() || 'I could not generate a response. Please try again.';
    return {
      response: text,
      source: 'granite',
      response_time_ms: Date.now() - startTime,
    };
  } catch (err) {
    return {
      response: generateFallbackResponse(userMessage, contextData),
      source: 'fallback',
      response_time_ms: Date.now() - startTime,
    };
  }
};

const generateFallbackResponse = (message, context) => {
  const msg = message.toLowerCase();
  const city = context.city || 'Gujarat';
  const rainfall = context.rainfall_24h || 0;
  const alertLevel = context.alert_level || 'normal';

  if (msg.includes('flood') || msg.includes('floods') || msg.includes('flooding') || msg.includes('પૂર')) {
    return `⚠️ **Flood Safety Advisory for ${city}:**\n\nCurrent rainfall: ${rainfall}mm/24h (${alertLevel.toUpperCase()} alert)\n\n🔴 **Immediate Actions:**\n• Move to higher ground immediately if water is rising\n• Do NOT walk or drive through flooded roads\n• Keep emergency kit ready (water, food, medicines, documents)\n• Follow NDRF/SDRF evacuation orders\n• Emergency helpline: **112** | NDRF: **011-24363260**\n\nStay tuned for updates from IMD and Gujarat government.`;
  }

  if (msg.includes('forecast') || msg.includes('tomorrow') || msg.includes('next') || msg.includes('આવતીકાલ')) {
    return `📅 **5-Day Forecast for ${city}:**\n\nBased on current monsoon patterns and IMD data, expect:\n• Heavy rainfall (${alertLevel !== 'normal' ? '⚠️ Current alert active' : 'Normal conditions'})\n• Monsoon activity typically peaks July-August in Gujarat\n• Saurashtra and South Gujarat receive maximum rainfall\n• North Gujarat (Banaskantha) prone to flash floods\n\nCheck our live forecast chart for detailed day-by-day predictions. 🌧️`;
  }

  if (msg.includes('farm') || msg.includes('crop') || msg.includes('ખેતી') || msg.includes('farmer')) {
    return `🌾 **Farmer Advisory for Gujarat:**\n\nWith current rainfall at ${rainfall}mm:\n\n${rainfall > 115 ? '🔴 **DANGER** - Avoid field work. Secure harvested crops immediately. Drain waterlogged fields.\n• Groundnut: Risk of pod rot\n• Cotton: Flower shedding risk\n• Sugarcane: Lodging possible' : rainfall > 64 ? '🟠 **CAUTION** - Delay sowing operations. Check drainage channels.\n• Good for sugarcane and rice\n• Avoid pesticide spraying in heavy rain' : '🟡 **ADVISORY** - Monitor soil moisture. Ideal time for kharif crop sowing if rain subsides.\n• Groundnut, Cotton, Bajra planting window open'}\n\nContact Krishi Vigyan Kendra: 1800-180-1551`;
  }

  if (msg.includes('alert') || msg.includes('warning') || msg.includes('safe') || msg.includes('danger')) {
    const level = alertLevel === 'dark_red' ? '🔴 EXTREME DANGER - Evacuate immediately!' :
      alertLevel === 'red' ? '🔴 VERY HEAVY RAIN - Stay indoors, avoid travel' :
      alertLevel === 'orange' ? '🟠 HEAVY RAIN - Caution advised, avoid low areas' :
      alertLevel === 'yellow' ? '🟡 MODERATE RAIN - Monitor situation' :
      '🟢 NORMAL - No immediate concern';
    return `🚨 **Current Alert Status for ${city}:**\n\n${level}\n\nRainfall: ${rainfall}mm in 24 hours\n\nEmergency Contacts:\n• State Emergency: **1077**\n• Fire: **101** | Police: **100** | Ambulance: **108**\n• NDRF Control Room: **011-24363260**\n• Gujarat SDMA: **079-23251900**`;
  }

  if (msg.includes('reservoir') || msg.includes('dam') || msg.includes('water level') || msg.includes('ડેમ')) {
    return `💧 **Gujarat Reservoir Status:**\n\nMajor dams monitoring:\n• **Sardar Sarovar** (9,460 MCM) - Nation's largest dam\n• **Ukai Dam** (8,511 MCM) - Tapi river\n• **Kadana Dam** (1,723 MCM) - Mahi river\n• **Dharoi Dam** (811 MCM) - Rupen river\n\nDuring heavy rain, dam discharge increases flood risk downstream. Alert issued when Ukai/Sardar Sarovar reaches 90% capacity.\n\nFor live levels: gujarat.gov.in/waterresources`;
  }

  if (msg.includes('history') || msg.includes('past') || msg.includes('2021') || msg.includes('2022') || msg.includes('2023') || msg.includes('2024')) {
    return `📊 **Gujarat Flood History (2021-2024):**\n\n**2021** - Cyclone Tauktae: 152 deaths, 2.1 lakh displaced, ₹4,200 crore loss\n**2022** - Saurashtra Mega Floods: 196 deaths, 3.7 lakh displaced, Rajkot record 358mm\n**2023** - Cyclone Biparjoy: 9.4 lakh evacuated, Kutch worst hit, ₹5,600 crore damage\n**2024** - Vadodara Mega Floods: 298mm in 24h, city submerged, Air Force rescue\n\nGujarat receives 90% of annual rainfall in 3-4 months (June-Sept). Climate change is intensifying extreme events.`;
  }

  return `👋 **Welcome to GujaratRainBot!**\n\nI'm your AI assistant for Gujarat weather & flood information powered by IBM Granite LLM.\n\n**I can help you with:**\n🌧️ Live rainfall data for all Gujarat cities\n⚠️ Flood alerts and safety guidance\n🌾 Farmer crop advisories\n📊 Historical impact data (2021-2024)\n💧 Reservoir and dam levels\n🗺️ Evacuation route guidance\n🏥 Post-flood health risks\n\n**Try asking:**\n• "Is it safe to travel to Surat today?"\n• "What is the flood risk in Vadodara?"\n• "Farmer advisory for Rajkot"\n• "Show history of Kutch floods"\n\n*Emergency: Call 112*`;
};

module.exports = { generateGraniteResponse };
