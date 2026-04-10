#!/bin/bash
# CloudSentinel — Quick Start Commands

# === PREREQUISITES ===
# 1. Python 3.10+: python --version
# 2. Node.js 18+: node --version  
# 3. MongoDB: docker run -d -p 27017:27017 mongo:7

# ============================================================================
# BACKEND SETUP
# ============================================================================

# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file (copy from template)
cp .env.example .env

# 6. Edit .env with your MongoDB URL
# For local MongoDB: MONGODB_URL=mongodb://localhost:27017/cloudsentinel
# For MongoDB Atlas: MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/cloudsentinel
# (Optional) Set Telegram credentials for notifications

# 7. Run backend
uvicorn main:app --reload
# Server will run at http://localhost:8000
# API docs available at http://localhost:8000/docs

# ============================================================================
# FRONTEND SETUP (in new terminal)
# ============================================================================

cd frontend

# 1. Install dependencies
npm install
# or
yarn install

# 2. Copy environment template
cp .env.example .env

# 3. If backend is not at localhost:8000, edit .env
# VITE_API_URL=http://your-backend-url:8000

# 4. Run development server
npm run dev
# or
yarn dev
# Frontend will run at http://localhost:5173

# ============================================================================
# AGENT SETUP (in new terminal)
# ============================================================================

cd agent

# 1. Install Python dependencies
pip install psutil requests

# 2. Copy environment template  
cp .env.example .env

# 3. Set backend URL (if not localhost)
# Edit .env: API_URL=http://your-backend-url:8000

# 4. Run agent
# The agent will auto-generate a node_id and register itself

# On macOS/Linux:
API_URL=http://localhost:8000 python monitor_agent.py

# On Windows (PowerShell):
$env:API_URL = "http://localhost:8000"
python monitor_agent.py

# Or Windows (CMD):
set API_URL=http://localhost:8000
python monitor_agent.py

# ============================================================================
# VERIFY EVERYTHING IS WORKING
# ============================================================================

# 1. Check backend health
curl http://localhost:8000/health
# Should return: {"status":"ok","nodes_count":1}

# 2. List registered nodes
curl http://localhost:8000/nodes
# Should return array with your registered node

# 3. Get latest metrics for last registered node
curl http://localhost:8000/metrics/summary/all
# Should return array with current metrics

# 4. Visit dashboard
# Open browser: http://localhost:5173
# You should see:
# - Dashboard with 1 node
# - Real-time CPU, RAM, Disk metrics
# - Node status (online/offline/stressed)

# ============================================================================
# CREATE A TEST ALERT RULE
# ============================================================================

# Create an alert rule that fires when CPU > 50%
curl -X POST http://localhost:8000/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "node_id": "all",
    "metric": "cpu_percent",
    "operator": ">",
    "threshold": 50,
    "severity": "warning",
    "notification_channels": []
  }'

# View all rules
curl http://localhost:8000/alerts/rules

# View active alerts
curl http://localhost:8000/alerts

# ============================================================================
# DOCKER DEPLOYMENT
# ============================================================================

# Create docker-compose.yml in project root (see SETUP.md)

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# ============================================================================
# CLOUD DEPLOYMENT (Render.com + Vercel + MongoDB Atlas)
# ============================================================================

# 1. Backend to Render.com
#    - Push repo to GitHub
#    - Go to render.com → New Service
#    - Connect repo, use backend/render.yaml
#    - Set MONGODB_URL environment variable
#    - (Optional) Set TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

# 2. Frontend to Vercel
#    - Go to vercel.com → Import Project
#    - Select frontend directory
#    - Set VITE_API_URL=https://your-backend.onrender.com

# 3. Database on MongoDB Atlas
#    - Go to mongodb.com/atlas
#    - Create free M0 cluster
#    - Create database user
#    - Allow 0.0.0.0/0 access
#    - Copy connection string to MONGODB_URL

# ============================================================================
# USEFUL COMMANDS
# ============================================================================

# View backend logs in real-time
# (Terminal running backend)
# Ctrl+C to stop

# Monitor agent metrics
tail -f agent_id.txt  # View node ID

# Stop all processes
# Ctrl+C in each terminal

# Reset to fresh start
rm -rf backend/venv frontend/node_modules agent/agent_id.txt
rm backend/.env frontend/.env agent/.env
# Then redo setup above

# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/nodes
curl http://localhost:8000/metrics/summary/all
curl http://localhost:8000/alerts
curl http://localhost:8000/alerts/rules

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# Backend won't start
# → Check MongoDB is running: docker ps | grep mongo
# → Check port 8000 is free: lsof -i :8000 (macOS/Linux)
# → Check .env file exists and MONGODB_URL is correct

# Frontend won't start
# → Delete node_modules: rm -rf node_modules
# → Reinstall: npm install
# → Check port 5173 is free

# Agent can't connect to backend
# → Verify backend is running: curl http://localhost:8000/health
# → Check API_URL in .env matches backend address
# → If backend is remote, ensure firewall allows port 8000

# No metrics appearing
# → Verify agent is running and sending metrics
# → Check backend logs for any errors
# → Ensure MongoDB connection is working

# Alerts not firing
# → Create alert rule on Rules page
# → Verify threshold is reasonable
# → Check backend logs for deduplication/inhibition messages

# ============================================================================
# DEVELOPMENT TIPS
# ============================================================================

# Backend development
# - Edit main.py, routes/*.py, alert_engine.py
# - Changes auto-reload with --reload flag
# - Check http://localhost:8000/docs for live API docs

# Frontend development  
# - Edit src/**/*.tsx files
# - Hot reload automatically on save
# - Check browser console for errors

# Agent development
# - Edit agent/monitor_agent.py
# - Restart agent to apply changes
# - Check console output for logs

# ============================================================================
# NEXT STEPS
# ============================================================================

# 1. Read SETUP.md for detailed documentation
# 2. Visit Dashboard at http://localhost:5173
# 3. Create alert rules on Rules page
# 4. Test silencing and resolving alerts
# 5. Deploy to cloud (Render, Vercel, MongoDB Atlas)
# 6. Monitor multiple nodes by running agent on different servers
# 7. Configure Telegram notifications (optional)

# ============================================================================
# SUPPORT
# ============================================================================

# Documentation: See SETUP.md and README.md
# API Documentation: http://localhost:8000/docs
# Issues: Report on GitHub
# Questions: Check troubleshooting section above

echo "✅ CloudSentinel setup guide complete!"
echo "📖 See SETUP.md for detailed documentation"
echo "🚀 Visit http://localhost:5173 to start monitoring!"
