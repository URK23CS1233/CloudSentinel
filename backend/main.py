import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import create_indexes, nodes_col, metrics_col
from routes import nodes, metrics, alerts
from typing import List


# ─── WebSocket Connection Manager ──────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: str):
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


async def broadcast_metrics_loop():
    """Background task: push latest metrics for all nodes every 5 seconds."""
    while True:
        await asyncio.sleep(5)
        try:
            node_docs = await nodes_col.find({}, {"_id": 0, "node_id": 1}).to_list(length=500)
            results = []
            for nd in node_docs:
                doc = await metrics_col.find_one(
                    {"node_id": nd["node_id"]},
                    {"_id": 0},
                    sort=[("timestamp", -1)],
                )
                if doc:
                    # datetime → ISO string for JSON
                    if "timestamp" in doc and hasattr(doc["timestamp"], "isoformat"):
                        doc["timestamp"] = doc["timestamp"].isoformat()
                    results.append(doc)
            if manager.active_connections and results:
                await manager.broadcast(json.dumps(results))
        except Exception as e:
            print(f"[ws] Broadcast error: {e}")


# ─── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_indexes()
    task = asyncio.create_task(broadcast_metrics_loop())
    yield
    task.cancel()


# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="CloudSentinel API",
    description="Lightweight distributed server monitoring backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nodes.router, prefix="/nodes", tags=["Nodes"])
app.include_router(metrics.router, prefix="/metrics", tags=["Metrics"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])


@app.get("/health")
async def health():
    count = await nodes_col.count_documents({})
    return {"status": "ok", "nodes_count": count}


@app.websocket("/ws/metrics")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; broadcast is handled by background task
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
