# CloudSentinel 🛰️

> Lightweight, self-hosted distributed server monitoring dashboard.  
> Inspired by Prometheus architecture. Built with FastAPI + Motor + React + Recharts.

---

## 🏗️ Architecture

```
Agent (psutil) → FastAPI Backend → MongoDB Atlas → React Dashboard
                     ↕  WebSocket  ↕
                  Frontend (Vite)
```

---

## ⚡ Quick Start

### 1. MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a DB user and allow `0.0.0.0/0` access
3. Copy your connection string

---

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/cloudsentinel
TELEGRAM_BOT_TOKEN=        # Optional
TELEGRAM_CHAT_ID=          # Optional
```

Run:
```bash
uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

---

### 3. Agent (on every server you want to monitor)

```bash
cd agent
pip install psutil requests
```

Set `API_URL` env var (or edit `monitor_agent.py` default):
```bash
# Windows
set API_URL=http://your-backend:8000
python monitor_agent.py

# Linux/Mac
API_URL=http://your-backend:8000 python monitor_agent.py
```

The agent will:
- Auto-register itself with the backend on startup
- Send metrics every 10 seconds
- Persist its `node_id` in `agent_id.txt`
- Reconnect with exponential backoff if server unreachable

---

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env: set VITE_API_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:5173
```

---

## 🚀 Deployment (Free Tier)

| Layer | Service | Free |
|---|---|---|
| Frontend | Vercel | ✅ |
| Backend | Render.com | ✅ |
| Database | MongoDB Atlas | ✅ |

### Deploy Backend to Render
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect repo → use `backend/render.yaml`
4. Set env vars: `MONGODB_URL`, optionally `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### Deploy Frontend to Vercel
```bash
cd frontend
vercel deploy
# Set env: VITE_API_URL=https://your-backend.onrender.com
```

> ⚠️ Render free tier sleeps after 15 min of inactivity.  
> Use [UptimeRobot](https://uptimerobot.com) to ping your `/health` endpoint every 5 min.

---

## 🔔 Alert System

- **Rules**: configurable per-node or global thresholds
- **Deduplication**: same alert type won't fire more than once per 5 minutes per node
- **Inhibition**: metric alerts suppressed when node is offline
- **Silencing**: silence an alert for 15min / 1h / 4h / 24h
- **Telegram**: set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` for instant notifications

---

## 📁 Project Structure

```
CloudSentinel/
├── backend/
│   ├── main.py          # FastAPI app + WebSocket
│   ├── database.py      # Motor + indexes
│   ├── models.py        # Pydantic models
│   ├── alert_engine.py  # Alert logic
│   ├── routes/
│   │   ├── nodes.py
│   │   ├── metrics.py
│   │   └── alerts.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── pages/       # Dashboard, NodeDetail, Alerts, Rules
│       ├── components/  # NodeCard, MetricsChart, AlertsPanel, Sidebar
│       ├── hooks/       # useMetrics.ts (React Query)
│       └── lib/         # api.ts, types.ts, utils.ts
└── agent/
    └── monitor_agent.py
```
