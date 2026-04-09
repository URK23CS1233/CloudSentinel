from fastapi import APIRouter, HTTPException, BackgroundTasks
from database import nodes_col, metrics_col
from models import Node
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


async def mark_stale_nodes_offline():
    """Mark nodes as offline if last_seen > 60 seconds ago."""
    cutoff = datetime.utcnow() - timedelta(seconds=60)
    await nodes_col.update_many(
        {"last_seen": {"$lt": cutoff}, "status": {"$ne": "offline"}},
        {"$set": {"status": "offline"}},
    )


@router.get("/")
async def get_nodes(background_tasks: BackgroundTasks):
    """List all nodes with their current live status."""
    background_tasks.add_task(mark_stale_nodes_offline)
    nodes = await nodes_col.find({}, {"_id": 0}).to_list(length=500)
    return nodes


@router.get("/{node_id}")
async def get_node(node_id: str):
    """Get a single node by its ID."""
    node = await nodes_col.find_one({"node_id": node_id}, {"_id": 0})
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.post("/register")
async def register_node(node: Node):
    """Called by the agent on startup to register or refresh its presence."""
    doc = node.dict()
    doc["last_seen"] = datetime.utcnow()
    doc["status"] = "online"
    await nodes_col.update_one(
        {"node_id": node.node_id},
        {"$set": doc},
        upsert=True,
    )
    return {"status": "registered", "node_id": node.node_id}


@router.put("/{node_id}/status")
async def update_node_status(node_id: str, status: str):
    """Manually update a node's status."""
    allowed = {"online", "offline", "stressed"}
    if status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")
    result = await nodes_col.update_one(
        {"node_id": node_id},
        {"$set": {"status": status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Node not found")
    return {"status": "updated"}
