# 🌧️ Gujarat Rain Alert System

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/IMD-Live%20Data-0057A8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/IBM-Granite%20LLM-052FAD?style=for-the-badge&logo=ibm&logoColor=white" />
  <img src="https://img.shields.io/badge/Demo%20Mode-No%20DB%20Needed-16a34a?style=for-the-badge" />
</p>

> **Real-time rainfall monitoring for all 6 regions and 30+ cities of Gujarat.**  
> Live IMD data · 7-day forecast · IBM Granite AI agent · Historical impact 2021–2026 · Auto-refreshes every 10 minutes.

---

## 🚀 Quick Start (Windows)

```bash
# 1. Clone the repository
git clone https://github.com/Sagr1810/GujaratRainAlertSystem.git
cd GujaratRainAlertSystem

# 2. Install everything & start
setup.bat        # installs backend + frontend dependencies
start.bat        # starts backend (port 5000) + frontend (port 3000)

# 3. Open browser
http://localhost:3000
```

> **No database required.** The app runs fully in demo mode with live Open-Meteo weather data.  
> MySQL is optional — add credentials to `backend/.env` to enable persistent storage.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌦️ **Live Dashboard** | 30+ Gujarat cities with real-time rain, temperature, humidity, wind |
| 🖱️ **City Detail Panel** | Click any city → full-day hourly charts, 7-day heat & rain prediction |
| 📅 **7-Day Forecast** | Per-city forecast cards + heat prediction line chart + rain bar chart |
| 🌡️ **Hourly Charts** | Hour-by-hour temperature curve & rain prediction for today |
| 🚨 **IMD Alerts** | Yellow / Orange / Red / Extreme based on official IMD thresholds |
| 🗺️ **6 Region Monitor** | North, South, East, West, Central, Saurashtra with drill-down |
| 📊 **Historical Data** | Flood impact 2021–2026 — deaths, displaced, crop loss, infra damage |
| 💧 **Reservoir Tracker** | 10 major Gujarat dams with fill-level and overflow risk |
| 🤖 **IBM Granite AI Agent** | Chat in English / Hindi / Gujarati about weather, floods, evacuation |
| ⚡ **WebSocket Updates** | Real-time push alerts without page refresh |
| 🔄 **Auto-Refresh** | Dashboard and city panels refresh every 10 minutes automatically |

---

## 📸 Pages

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Live city grid — click any city for full details |
| Regions | `/regions` | 6-region overview with comparative rainfall |
| Alerts | `/alerts` | Active IMD alerts with history |
| History | `/history` | Yearly flood impact 2021–2026 with charts |
| Reservoirs | `/reservoirs` | Dam levels with overflow risk indicators |
| Features | `/features` | Farmer advisory, disease risk, evacuation routes |
| AI Agent | `/agent` | IBM Granite LLM chatbot |

---

## 🏗️ Project Structure

```
GujaratRainAlertSystem/
├── .gitignore
├── README.md
├── setup.bat                   ← Install all dependencies
├── start.bat                   ← Start backend + frontend
├── stop.bat                    ← Stop all servers
├── SDLC_PLAN.md                ← Agentic AI SDLC documentation
│
├── backend/                    ← Node.js + Express REST API
│   ├── .env.example            ← Environment variable template
│   ├── package.json
│   └── src/
│       ├── server.js           ← Entry point + forecast endpoint
│       ├── config/
│       │   └── database.js     ← MySQL / Sequelize config
│       ├── models/
│       │   └── index.js        ← DB models (City, Region, RainReading, Alert…)
│       ├── routes/
│       │   ├── weather.js      ← /api/weather/* endpoints
│       │   ├── alerts.js       ← /api/alerts endpoints
│       │   ├── history.js      ← /api/history endpoints
│       │   ├── agent.js        ← /api/agent/chat (IBM Granite)
│       │   ├── regions.js      ← /api/regions endpoints
│       │   └── reservoirs.js   ← /api/reservoirs endpoints
│       ├── services/
│       │   ├── weatherService.js   ← Open-Meteo / IMD live + 7-day forecast
│       │   ├── graniteService.js   ← IBM watsonx.ai Granite LLM
│       │   └── govSync.js          ← SDMA / IMD auto-sync
│       └── utils/
│           ├── seedData.js     ← Gujarat cities, regions, history data
│           └── demoStore.js    ← In-memory demo mode store
│
├── frontend/                   ← React 19 SPA
│   ├── public/
│   │   └── index.html          ← Title: Gujarat Rain Alert System
│   ├── package.json
│   └── src/
│       ├── App.js              ← Router + navigation
│       ├── pages/
│       │   ├── Dashboard.js    ← Live grid + CityDetailModal with charts
│       │   ├── History.js      ← Year-filter charts + impact cards
│       │   ├── Regions.js      ← Region drill-down
│       │   ├── Alerts.js       ← Alert management
│       │   ├── Reservoirs.js   ← Dam tracker
│       │   ├── Features.js     ← Farmer / disease / evacuation
│       │   └── Agent.js        ← AI chatbot UI
│       ├── services/
│       │   └── api.js          ← Axios API client
│       ├── context/
│       │   └── WeatherContext.js ← WebSocket + global state
│       └── utils/
│           └── constants.js    ← Alert colors, region info, IMD thresholds
│
└── database/
    └── schema.sql              ← MySQL schema (optional)
```

---

## 🌍 Gujarat Regions

| Region | Key Cities | Flood Risk |
|--------|-----------|------------|
| 🏜️ North Gujarat | Ahmedabad, Gandhinagar, Mehsana, Patan, Palanpur | Flash floods, Urban flooding |
| 🌊 South Gujarat | Surat, Bharuch, Navsari, Valsad | Tapi/Narmada flooding, Ukai dam |
| 🏔️ East Gujarat | Vadodara, Anand, Dahod, Godhra | Vishwamitri flooding, Tribal floods |
| 🏝️ West Gujarat | Bhuj, Gandhidham, Porbandar, Dwarka | Cyclone-prone, Kutch flash floods |
| 🌾 Central Gujarat | Nadiad, Kheda, Cambay | Mahi river flooding |
| ⛵ Saurashtra | Rajkot, Bhavnagar, Jamnagar, Junagadh | Bhadar/Machhu, Cyclone track |

---

## 🚨 IMD Alert Thresholds

| Alert | 24H Rainfall | Action |
|-------|-------------|--------|
| 🟢 Normal | < 35.5 mm | No action |
| 🟡 Yellow | 35.5 – 64.4 mm | Stay alert |
| 🟠 Orange | 64.5 – 115.5 mm | Avoid waterlogged roads |
| 🔴 Red | 115.6 – 204.4 mm | Stay indoors |
| 🚨 Extreme | > 204.5 mm | Evacuate low-lying areas |

---

## ⚙️ Configuration

Copy `backend/.env.example` → `backend/.env` and fill in your keys:

```env
# MySQL (optional — app works without DB in demo mode)
DB_HOST=localhost
DB_PASSWORD=your_mysql_password

# IBM watsonx.ai Granite LLM (for AI agent)
IBM_WATSON_API_KEY=your_ibm_cloud_api_key
IBM_WATSON_PROJECT_ID=your_watsonx_project_id
IBM_GRANITE_MODEL_ID=ibm/granite-13b-instruct-v2
```

**Getting API Keys:**
- IBM watsonx.ai: https://dataplatform.cloud.ibm.com (free tier available)
- Open-Meteo (weather data): **No API key needed — completely free**

---

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health check |
| GET | `/api/weather/live` | All cities live weather |
| GET | `/api/weather/city/:id` | Single city weather + readings |
| GET | `/api/weather/summary` | Region-wise rainfall summary |
| GET | `/api/forecast/:cityId` | 7-day forecast + hourly data |
| GET | `/api/alerts` | Active alerts |
| GET | `/api/history` | Historical flood events |
| GET | `/api/history/summary` | Year-wise impact summary |
| GET | `/api/reservoirs` | Dam levels |
| GET | `/api/regions` | All 6 regions |
| GET | `/api/cities` | All 30+ cities |
| GET | `/api/stats` | System statistics |
| POST | `/api/agent/chat` | IBM Granite LLM query |
| POST | `/api/weather/refresh` | Trigger live weather refresh |

---

## 📊 Historical Flood Impact (2021–2026)

| Year | Key Event | Deaths | Displaced |
|------|-----------|--------|-----------|
| 2021 | Cyclone Tauktae | 152 | 2.1 Lakh |
| 2022 | Saurashtra Mega Floods | 196 | 3.7 Lakh |
| 2023 | Cyclone Biparjoy | 110 | 9.4 Lakh |
| 2024 | Vadodara Mega Floods | 95+ | 1.98 Lakh |
| 2025 | IMD Real-time (ongoing) | — | — |
| 2026 | Auto-detected via Open-Meteo | — | — |

---

## 📞 Emergency Contacts

| Service | Number |
|---------|--------|
| National Emergency | **112** |
| Gujarat SDMA | **1077** |
| NDRF Control Room | **011-24363260** |
| Ambulance | **108** |
| Gujarat Flood Control | **079-23251900** |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, Recharts, Socket.io-client |
| Backend | Node.js, Express, Socket.io |
| Weather Data | Open-Meteo API (free, no key, IMD-equivalent) |
| AI Agent | IBM watsonx.ai — Granite-13b-instruct-v2 |
| Database | MySQL + Sequelize ORM (optional) |
| Demo Mode | In-memory store with live Open-Meteo data |

---

## 🏛️ Built With IBM Bob — Agentic AI SDLC

This project was built using [IBM Bob](https://www.ibm.com/products/bob) following the 8-phase Agentic AI SDLC methodology. See [`SDLC_PLAN.md`](SDLC_PLAN.md) for full documentation.

---

*Gujarat Rain Alert System v2.0 · React 19 + Node.js · IMD Live Data · IBM Granite LLM · 2025*
