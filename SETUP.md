# CloudSentinel — Lightweight Distributed Server Monitoring

A self-hosted, lightweight server monitoring dashboard inspired by Prometheus. Real-time metrics collection, alerting, and visualization for distributed nodes.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│  Dashboard • Node Details • Alerts • Rules                       │
│  Tech: React + TypeScript + Vite + shadcn/ui + Recharts         │
└───────────────────────┬─────────────────────────────────────────┘
                        │ REST API + WebSocket
┌───────────────────────▼─────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  /nodes • /metrics • /alerts • /ws/metrics                       │
│  Tech: FastAPI + Motor (async MongoDB)                           │
└───────────────────────┬─────────────────────────────────────────┘
                        │ Motor Client
┌───────────────────────▼─────────────────────────────────────────┐
│                   MongoDB (Cloud or Local)                       │
│  Collections: nodes, metrics, alerts, alert_rules, silences     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              AGENT (runs on each monitored node)                 │
│  monitor_agent.py — collects metrics, registers node, sends     │
│  Tech: Python + psutil                                           │
│  Updates: every 10s, exponential backoff on failure              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Prerequisites

- **Backend**: Python 3.10+, MongoDB (local or cloud)
- **Frontend**: Node.js 18+, npm/yarn
- **Agent**: Python 3.10+, psutil

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# or (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your MongoDB URL and Telegram credentials (optional)

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**
API docs at: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Setup environment
cp .env.example .env
# Edit .env if backend is not at localhost:8000

# Development server
npm run dev
# or
yarn dev
```

Frontend runs at: **http://localhost:5173**

### 4. Agent Setup

On each server you want to monitor:

```bash
cd agent

# Install dependencies
pip install psutil requests

# Setup environment
cp .env.example .env
# Edit .env with backend API URL (e.g., http://your-backend.com)

# Run agent
python monitor_agent.py
```

The agent will:

- Generate a unique node_id and save to `agent_id.txt`
- Register itself with the backend
- Collect and send metrics every 10 seconds
- Retry with exponential backoff on connection failures

---

## API Reference

### Nodes

- `GET /nodes` — List all nodes
- `GET /nodes/{node_id}` — Get single node details
- `POST /nodes/register` — Register new node (called by agent)
- `PUT /nodes/{node_id}/status` — Update node status (online/offline/stressed)

### Metrics

- `POST /metrics/ingest` — Receive metric from agent (triggers alert engine)
- `GET /metrics/{node_id}?range=1h|6h|24h` — Historical metrics
- `GET /metrics/{node_id}/latest` — Most recent metric
- `GET /metrics/summary/all` — Latest metric for all nodes

### Alerts

- `GET /alerts?node_id=X&severity=critical` — List active alerts
- `POST /alerts/{id}/resolve` — Mark alert as resolved
- `POST /alerts/{id}/silence?duration_minutes=60` — Silence alert
- `GET /alerts/rules` — List alert rules
- `POST /alerts/rules` — Create rule
- `DELETE /alerts/rules/{id}` — Delete rule

### WebSocket

- `WS /ws/metrics` — Real-time metric stream (5-second updates)

---

## Database Schema

### Collections

```javascript
// nodes
{
  node_id: "uuid",
  hostname: "server-01",
  ip: "192.168.1.10",
  os: "Linux 5.15",
  status: "online",           // online | offline | stressed
  last_seen: ISODate(),
  tags: ["prod", "web"]
}

// metrics (auto-expires after 30 days)
{
  node_id: "uuid",
  hostname: "server-01",
  cpu_percent: 45.2,
  memory_percent: 62.1,
  disk_percent: 78.5,
  cpu_cores: 8,
  memory_used_gb: 8.2,
  memory_total_gb: 32,
  disk_used_gb: 150,
  disk_total_gb: 500,
  timestamp: ISODate()
}

// alerts
{
  id: "uuid",
  node_id: "uuid",
  type: "HIGH_CPU",
  severity: "critical",       // info | warning | critical
  value: 92.5,
  threshold: 90,
  message: "CPU alert on server-01: 92.5% > 90%",
  timestamp: ISODate(),
  resolved: false,
  silenced: false
}

// alert_rules
{
  id: "uuid",
  node_id: "all",             // "all" = applies to all nodes
  metric: "cpu_percent",
  operator: ">",
  threshold: 90,
  severity: "critical",
  notification_channels: ["telegram"]
}

// silences
{
  id: "uuid",
  node_id: "uuid",
  alert_type: "HIGH_CPU",
  created_at: ISODate(),
  expires_at: ISODate(),
  duration_minutes: 60
}
```

---

## Alert Engine

Runs after every metric ingestion. Features:

### 1. **Deduplication**

- If same alert type fired for same node in last **5 minutes** → skip
- Prevents alert spam

### 2. **Inhibition**

- If node status is **"offline"** → skip all metric alerts
- Only fires "node down" alerts

### 3. **Silencing**

- Check if active, non-expired silence exists for this alert
- If yes → skip creation

### 4. **Notifications**

- Sends Telegram message if `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` set
- Rich format with emoji, alert severity, hostname

---

## Frontend Features

### Dashboard

- **Stat cards**: Total nodes, online, offline, active alerts
- **Node grid**: Real-time status, CPU/RAM/Disk % with color coding
- **Live updates**: Auto-refresh every 5 seconds

### Node Detail

- **Metrics graphs**: CPU, RAM, Disk over time with threshold lines
- **Time range**: 1h/6h/24h selector
- **Recent alerts**: Last 5 alerts for this node
- **Latest snapshot**: Current resource usage

### Alerts Page

- **Table view**: All active alerts with severity badges
- **Filtering**: By severity (info/warning/critical)
- **Actions**: Resolve alert, silence for 15m/1h/4h/24h

### Rules Page

- **Form**: Create new rules (metric, operator, threshold, severity)
- **Scope**: Per-node or "all nodes"
- **Management**: Delete rules
- **Targets**: CPU %, RAM %, Disk %

---

## Deployment

### Option 1: Docker (Recommended)

Create `docker-compose.yml`:

```yaml
version: "3.8"

services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      MONGODB_URL: mongodb://mongodb:27017/cloudsentinel
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
      TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID}
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      VITE_API_URL: http://backend:8000

volumes:
  mongo_data:
```

Run:

```bash
docker-compose up -d
```

### Option 2: Render.com (Backend)

1. Push repo to GitHub
2. Create Render service:
   - **Environment**: Python 3.10
   - **Build**: `pip install -r requirements.txt`
   - **Start**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment vars**: `MONGODB_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
3. Update frontend `.env` with backend URL

### Option 3: Vercel (Frontend)

1. Push frontend folder to GitHub
2. Import to Vercel
3. Set `VITE_API_URL` in environment variables

---

## Configuration

### Backend (.env)

```env
# MongoDB URL (local or Atlas)
MONGODB_URL=mongodb://localhost:27017/cloudsentinel

# Telegram notifications (optional)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env)

```env
# Backend API endpoint
VITE_API_URL=http://localhost:8000
```

### Agent (.env)

```env
# Backend API endpoint
API_URL=http://localhost:8000

# Metric collection interval (seconds)
SEND_INTERVAL=10
```

---

## Monitoring Best Practices

### Alert Thresholds

| Metric | Info | Warning | Critical |
| ------ | ---- | ------- | -------- |
| CPU %  | 50   | 75      | 90       |
| RAM %  | 60   | 80      | 95       |
| Disk % | 70   | 85      | 95       |

Create rules for your use case on the Rules page.

### Data Retention

- **Metrics**: Automatically deleted after 30 days (TTL index)
- **Alerts**: Kept indefinitely (can be archived manually)
- **Consider**: MongoDB backup strategy for production

### Scaling

- **Many nodes?** Consider sharding metrics collection
- **High volume?** Use InfluxDB instead of MongoDB
- **Distributed?** Deploy backend as stateless service (horizontal scale)

---

## Troubleshooting

### Agent can't reach backend

- Check `API_URL` environment variable
- Verify backend is running: `curl http://localhost:8000/health`
- Check firewall rules if backend is remote

### No metrics appearing

- Ensure agent is running: `python monitor_agent.py`
- Check backend logs: `docker logs cloudsentinel-backend`
- Verify MongoDB connection in backend logs

### Alerts not firing

- Check alert rules created on Rules page
- Verify metric values exceed thresholds
- Check `alert_engine.py` logs for deduplication/inhibition

### WebSocket not connecting

- Check frontend console for CORS errors
- Verify backend CORS config allows frontend URL
- Check firewall for WebSocket port

---

## Architecture Decisions

### Why Motor (async MongoDB)?

- Non-blocking I/O for high-concurrency metric ingestion
- Better resource efficiency than sync driver
- Pairs well with FastAPI async routes

### Why TTL index on metrics?

- Automatic cleanup prevents DB bloat
- 30 days retention balances history vs. storage
- Can be tuned in `database.py`

### Why 5-minute deduplication?

- Prevents alert fatigue for ongoing issues
- Still alerts on recurring problems
- Configurable in `alert_engine.py`

### Why WebSocket for dashboard?

- Real-time updates without polling
- Lower latency and bandwidth
- Better UX for live monitoring

---

## Development

### Project Structure

```
.
├── backend/
│   ├── main.py              # FastAPI app entry
│   ├── database.py          # Motor MongoDB setup
│   ├── models.py            # Pydantic schemas
│   ├── alert_engine.py      # Alert logic
│   ├── requirements.txt
│   └── routes/
│       ├── nodes.py
│       ├── metrics.py
│       └── alerts.py
├── agent/
│   └── monitor_agent.py     # Node agent
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Alerts, Rules, NodeDetail
│   │   ├── components/      # NodeCard, MetricsChart, AlertsPanel, Sidebar
│   │   ├── hooks/           # useMetrics, useNodes, useAlerts, etc
│   │   ├── lib/             # api.ts, types.ts, utils.ts
│   │   └── App.tsx
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

### Tech Stack

- **Backend**: FastAPI, Motor, Pydantic, httpx
- **Frontend**: React 19, TypeScript, Tailwind, shadcn/ui, Recharts, React Query
- **Agent**: Python, psutil, requests
- **Database**: MongoDB (async via Motor)
- **Deployment**: Docker, Render, Vercel

---

## License

This project is open source. Feel free to fork and modify for your needs.

---

## Contributing

Contributions welcome! Areas for improvement:

- [ ] PostgreSQL support (InfluxDB for metrics)
- [ ] Email/Slack notifications
- [ ] Multi-user authentication
- [ ] Grafana/Prometheus integration
- [ ] Historical alert analytics
- [ ] Custom alert actions (webhooks)
- [ ] Agent plugin system

---

**Questions?** Check the troubleshooting section, or review the code comments for detailed explanations.

**Happy monitoring! 🚀**
