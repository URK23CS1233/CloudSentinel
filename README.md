# CloudSentinel 🛰️

**Lightweight, self-hosted distributed server monitoring dashboard** inspired by Prometheus architecture.

Real-time metrics collection, intelligent alerting, and rich visualizations for monitoring distributed nodes.

## ✨ Features

- 📊 **Real-time Metrics**: CPU, RAM, Disk usage for all nodes
- 🚨 **Smart Alerts**: Deduplication, silencing, inhibition rules
- 📈 **Rich Dashboard**: Live status cards, metric graphs with thresholds
- 🔔 **Notifications**: Telegram bot integration for alerts
- 🌐 **WebSocket Live Stream**: 5-second metric broadcasts
- 💾 **30-day History**: Auto-cleanup metrics via TTL indexes
- 🎛️ **Rule Management**: Per-node or global thresholds
- ⚡ **High Performance**: Async FastAPI + Motor MongoDB

## Tech Stack

- **Backend**: FastAPI + Motor (async MongoDB) + Pydantic
- **Frontend**: React 19 + TypeScript + Vite + Tailwind + shadcn/ui + Recharts
- **Agent**: Python + psutil
- **Database**: MongoDB (Atlas cloud or Docker)

## 🏗️ Architecture

```
Agent (psutil)     Agent (psutil)       Agent (psutil)
  ↓                   ↓                    ↓
GET metrics → FastAPI Backend ← Telegram Bot
             (WebSocket broadcast every 5s)
             Motor async client
                    ↓
            MongoDB Atlas
      (nodes, metrics, alerts, rules)
```

## 🚀 Quickstart (5 min)

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (free cluster at [mongodb.com/atlas](https://mongodb.com/atlas))

### Setup

**Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Edit with your MongoDB URL
uvicorn main:app --reload
```

**Agent** (on each server to monitor)

```bash
cd agent
pip install psutil requests
API_URL=http://localhost:8000 python monitor_agent.py
```

**Frontend**

```bash
cd frontend
npm install
npm run dev  # http://localhost:5173
```

✅ Backend: http://localhost:8000 | Docs: http://localhost:8000/docs

## 📚 Full Documentation

See **[SETUP.md](SETUP.md)** for detailed setup, deployment, API reference, architecture, and troubleshooting.

## 📊 Dashboard Pages

| Page            | Features                                                    |
| --------------- | ----------------------------------------------------------- |
| **Dashboard**   | Stat cards, node grid with live metrics, color-coded status |
| **Node Detail** | Time-series graphs, threshold lines, recent alerts          |
| **Alerts**      | Table view, severity filter, silence/resolve actions        |
| **Rules**       | Create thresholds per-node or globally, delete rules        |

## 🔔 Alert Features

✅ **Deduplication** — same alert type won't fire >1x per 5min per node  
✅ **Inhibition** — skip metric alerts if node offline  
✅ **Silencing** — mute for 15min/1h/4h/24h  
✅ **Telegram** — instant notifications if configured

## 🚀 Free Deployment

| Layer    | Service                                    | Free |
| -------- | ------------------------------------------ | ---- |
| Backend  | [Render.com](https://render.com)           | ✅   |
| Frontend | [Vercel](https://vercel.com)               | ✅   |
| Database | [MongoDB Atlas](https://mongodb.com/atlas) | ✅   |

**→ See [SETUP.md](SETUP.md) for deployment steps**

## 📁 Project Structure

```
.
├── backend/
│   ├── main.py                 # FastAPI + WebSocket
│   ├── database.py             # Motor + indexes
│   ├── models.py               # Pydantic schemas
│   ├── alert_engine.py         # Alert evaluation
│   ├── routes/                 # {nodes, metrics, alerts}.py
│   └── requirements.txt
├── agent/
│   └── monitor_agent.py        # psutil metrics sender
├── frontend/
│   ├── src/
│   │   ├── pages/              # {Dashboard, Alerts, Rules, NodeDetail}.tsx
│   │   ├── components/         # {NodeCard, MetricsChart, AlertsPanel}.tsx
│   │   ├── hooks/              # useMetrics.ts (React Query)
│   │   ├── lib/                # {api, types, utils}.ts
│   │   └── App.tsx
│   └── vite.config.ts
├── SETUP.md                    # Detailed documentation
└── README.md
```

## 🔗 API Endpoints

```
GET    /nodes
GET    /nodes/{node_id}
POST   /nodes/register
PUT    /nodes/{node_id}/status

POST   /metrics/ingest
GET    /metrics/{node_id}?range=1h|6h|24h
GET    /metrics/{node_id}/latest
GET    /metrics/summary/all

GET    /alerts?node_id=X&severity=critical
POST   /alerts/{id}/resolve
POST   /alerts/{id}/silence?duration_minutes=60
GET    /alerts/rules
POST   /alerts/rules
DELETE /alerts/rules/{id}

WS     /ws/metrics
GET    /health
```

## 📖 Configuration

**Backend** (`backend/.env`)

```env
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/cloudsentinel
TELEGRAM_BOT_TOKEN=          # optional
TELEGRAM_CHAT_ID=            # optional
```

**Frontend** (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

**Agent** (`agent/.env`)

```env
API_URL=http://localhost:8000
SEND_INTERVAL=10  # seconds
```

## 🆘 Support

📖 **Setup Help**: See [SETUP.md](SETUP.md)  
🔍 **API Docs**: http://localhost:8000/docs  
🐛 **Issues**: Report on GitHub

---

**Built for monitoring distributed systems easily and efficiently.**
