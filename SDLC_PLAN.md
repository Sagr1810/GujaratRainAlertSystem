# Gujarat Rain Alert System — Agentic AI SDLC Plan
> Built with IBM Bob · Powered by IBM Granite LLM · IMD Live Data · React + Node.js + MySQL

---

## Overview

This document outlines all phases of the **Agentic AI Software Development Life Cycle (SDLC)** used to design, develop, and deploy the **Gujarat Rain Alert System** — a full-stack intelligent weather monitoring platform covering all six regions of Gujarat with live IMD data, AI-powered alerts, and IBM Granite LLM agent assistance.

---

## Phase 1: Requirements Engineering (Agentic Discovery)

### 1.1 Problem Statement
Gujarat faces annual flood disasters causing loss of life, crop damage, infrastructure collapse, and displacement of millions. Existing weather apps lack:
- Region-specific granularity (South/North/East/West/Central/Saurashtra)
- Historical impact analysis (2021–2024)
- Intelligent AI-assisted alerts
- Farmer/citizen-specific advisories
- Evacuation and flood-risk mapping

### 1.2 Stakeholder Identification (Agent-Assisted)
| Stakeholder | Need |
|---|---|
| Citizens | Real-time rain alerts, safe routes |
| Farmers | Crop-specific rain advisories |
| Govt/NDRF | Mass alert broadcasting |
| Researchers | Historical data, trend analysis |
| Urban planners | Flood risk zones, drainage stress |

### 1.3 Functional Requirements
- Live rain data from IMD API (India Meteorological Department)
- Rain alerts (Yellow / Orange / Red)
- Region-wise data: South, North, East, West, Central, Saurashtra
- City-level detail for 30+ major Gujarat cities
- Historical impact data (2021, 2022, 2023, 2024)
- IBM Granite LLM Agent Assistant (natural language Q&A)
- Flood risk index per region
- Farmer crop advisory module
- Evacuation route suggestions
- Water reservoir level tracking
- Disease outbreak risk post-rain
- Air quality correlation post-rain

### 1.4 Non-Functional Requirements
- Response time < 2 seconds for live data
- 99.9% uptime target
- Mobile-responsive UI
- Secure API key management
- MySQL persistent storage with caching

---

## Phase 2: System Design (Agentic Architecture)

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GUJARAT RAIN ALERT SYSTEM                 │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React.js)                                        │
│  ├── Dashboard (Live Map + Alerts)                          │
│  ├── Region View (6 Regions)                                │
│  ├── City Detail Pages (30+ cities)                         │
│  ├── Historical Impact (2021-2024)                          │
│  ├── AI Agent Chat (IBM Granite)                            │
│  ├── Farmer Advisory Module                                 │
│  ├── Flood Risk Map                                         │
│  └── Alert Broadcast Panel                                  │
├─────────────────────────────────────────────────────────────┤
│  Backend (Node.js + Express)                                │
│  ├── IMD API Proxy Layer                                    │
│  ├── OpenWeatherMap API Integration                         │
│  ├── IBM watsonx Granite LLM API                            │
│  ├── Alert Engine (threshold-based)                         │
│  ├── MySQL ORM (Sequelize)                                  │
│  └── WebSocket Server (real-time push)                      │
├─────────────────────────────────────────────────────────────┤
│  Database (MySQL)                                           │
│  ├── rain_readings (live + historical)                      │
│  ├── alerts                                                 │
│  ├── cities                                                 │
│  ├── regions                                                │
│  ├── historical_impacts                                     │
│  ├── reservoir_levels                                       │
│  └── agent_conversations                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack
| Layer | Technology |
|---|---|
| Frontend | React.js 18, Tailwind CSS, Leaflet.js (maps), Chart.js, Socket.io-client |
| Backend | Node.js 20, Express.js, Socket.io, Axios, node-cron |
| Database | MySQL 8.0, Sequelize ORM |
| AI Agent | IBM watsonx.ai (Granite-13b-instruct) |
| Weather API | OpenWeatherMap API (primary), IMD scraper (secondary) |
| Mapping | React-Leaflet, OpenStreetMap tiles |
| Charts | Recharts / Chart.js |
| Auth | JWT tokens |

### 2.3 Data Flow
```
IMD / OpenWeatherMap API
        ↓ (every 15 min via cron)
  Backend API Layer
        ↓
  Alert Engine → MySQL
        ↓
  WebSocket Broadcast
        ↓
  React Frontend (live updates)
        ↓
  IBM Granite Agent (on user query)
```

---

## Phase 3: Data Engineering (Agentic Data Pipeline)

### 3.1 Gujarat Regions & Cities
| Region | Major Cities |
|---|---|
| **North Gujarat** | Ahmedabad, Gandhinagar, Mehsana, Patan, Banaskantha |
| **South Gujarat** | Surat, Valsad, Navsari, Tapi, Bharuch |
| **East Gujarat** | Vadodara, Anand, Dahod, Chhota Udaipur, Panchmahal |
| **West Gujarat** | Kutch (Bhuj), Dwarka, Porbandar |
| **Central Gujarat** | Anand, Kheda, Nadiad, Cambay |
| **Saurashtra** | Rajkot, Junagadh, Amreli, Bhavnagar, Jamnagar, Somnath |

### 3.2 Historical Impact Data (2021–2024)
**2021 — Cyclone Tauktae + Monsoon**
- Deaths: 152
- Displaced: 2.1 lakh
- Crops damaged: 8.4 lakh hectares
- Infrastructure loss: ₹4,200 crore

**2022 — Extreme Monsoon Season**
- Deaths: 196
- Displaced: 3.7 lakh
- Floods in Saurashtra, Kutch
- Rajkot, Jamnagar most affected

**2023 — Biparjoy Cyclone + Floods**
- Deaths: 29 (cyclone) + 81 (floods)
- Displaced: 9.4 lakh
- Crops: 11.2 lakh hectares
- Kutch & North Gujarat worst hit

**2024 — Monsoon Season**
- Ongoing data collection
- Vadodara, Surat, Ahmedabad floods
- 200+ mm/day events recorded

### 3.3 Alert Thresholds (IMD Standard)
| Alert Level | Rainfall | Color |
|---|---|---|
| Normal | < 35.5 mm/day | Green |
| Moderate | 35.5–64.4 mm/day | Yellow |
| Heavy | 64.5–115.5 mm/day | Orange |
| Very Heavy | 115.6–204.4 mm/day | Red |
| Extremely Heavy | > 204.4 mm/day | Dark Red |

---

## Phase 4: Development (Agentic Coding)

### 4.1 Sprint Plan
| Sprint | Duration | Deliverable |
|---|---|---|
| Sprint 1 | Week 1 | Project setup, MySQL schema, basic API |
| Sprint 2 | Week 2 | IMD/OpenWeatherMap integration, alert engine |
| Sprint 3 | Week 3 | React frontend, map, dashboard |
| Sprint 4 | Week 4 | IBM Granite agent integration |
| Sprint 5 | Week 5 | Advanced features, farmer advisory |
| Sprint 6 | Week 6 | UI polish, testing, .bat scripts |

### 4.2 IBM Granite Agent Capabilities
- Natural language rain queries ("Will it flood in Surat tomorrow?")
- Historical impact summaries
- Farmer crop advisory ("Should I harvest wheat this week?")
- Evacuation guidance
- Reservoir status interpretation
- Multilingual support (Gujarati + Hindi + English)

---

## Phase 5: Testing (Agentic QA)

### 5.1 Test Categories
- **Unit Tests**: API endpoints, alert logic, data parsing
- **Integration Tests**: MySQL queries, IMD API connection
- **AI Agent Tests**: Granite LLM response quality
- **UI Tests**: Component rendering, map interaction
- **Load Tests**: Concurrent WebSocket connections
- **Regression Tests**: Alert threshold accuracy

### 5.2 Test Data
- Mock rain readings for all 30 cities
- Simulated flood scenarios
- Edge cases: API timeout, network failure, zero rainfall

---

## Phase 6: Deployment (Agentic DevOps)

### 6.1 Local Deployment (Windows)
- `setup.bat` — installs Node.js, MySQL, dependencies
- `start.bat` — starts backend + frontend
- `seed.bat` — seeds historical data into MySQL

### 6.2 Production Deployment (Optional)
- Docker Compose (backend + MySQL)
- Nginx reverse proxy
- PM2 process manager
- Environment variables via `.env`

---

## Phase 7: Monitoring & Feedback (Agentic Operations)

### 7.1 System Monitoring
- API health endpoint `/api/health`
- Database connection status
- IMD API response time tracking
- Alert delivery confirmation logs

### 7.2 Agentic Feedback Loop
- Agent conversation logs stored in MySQL
- User feedback ratings for agent responses
- Automatic retraining prompts if satisfaction < 70%

---

## Phase 8: Continuous Improvement (Agentic Learning)

### 8.1 Model Fine-tuning Plan
- Monthly review of Granite agent responses
- Add Gujarat-specific context to system prompt
- Incorporate new IMD data formats
- Expand to district-level granularity

### 8.2 Feature Roadmap
- SMS/WhatsApp alert integration (Twilio)
- Satellite imagery overlay
- AI flood prediction (72-hour forecast)
- Integration with NDRF command center
- Gujarati language voice alerts
- IoT rain gauge data ingestion

---

## Unique Features (Beyond Standard Weather Apps)

| Feature | Description |
|---|---|
| 🌾 Farmer Advisory | Crop-specific rain impact guidance |
| 🏥 Disease Risk Index | Post-rain leptospirosis, malaria risk |
| 🛣️ Road Closure Alerts | NH/SH flood closure notifications |
| 💧 Reservoir Tracker | 206 dams in Gujarat — live levels |
| 🏭 Industrial Flood Risk | GIDC zone flood exposure |
| 📊 Economic Impact Dashboard | Real-time loss estimation |
| 🚨 Mass SMS Broadcast | Govt admin panel for mass alerts |
| 🌊 Flash Flood Predictor | AI-based 6-hour flash flood risk |
| 🗺️ Evacuation Route Map | Safe route suggestions |
| 📱 PWA Support | Offline alerts via service worker |
| 🌡️ Heat-Rain Correlation | Urban heat island post-rain analysis |
| 📰 News Integration | Rain-related news feed |
| 🔔 Custom Alert Zones | Users set personal geo-alert zones |
| 📈 Rainfall Trend Analytics | 10-year trend with ML trendline |
| 🎙️ Voice Assistant | Gujarati language voice queries |

---

## IBM Bob Agentic AI SDLC — Phase Summary

| Phase | Status | IBM Bob Action |
|---|---|---|
| Requirements Engineering | ✅ Complete | Bob analyzed stakeholder needs |
| System Architecture | ✅ Complete | Bob designed multi-tier architecture |
| Data Engineering | ✅ Complete | Bob mapped Gujarat regions + IMD schema |
| Development | ✅ Complete | Bob generated all code artifacts |
| Testing | ✅ Complete | Bob created test cases |
| Deployment | ✅ Complete | Bob created .bat automation scripts |
| Monitoring | ✅ Complete | Bob added health checks + logging |
| Continuous Improvement | 🔄 Ongoing | Bob tracks agent feedback loop |

---

*Generated by IBM Bob | Gujarat Rain Alert System v1.0 | Agentic AI SDLC*
