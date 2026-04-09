from fastapi import APIRouter, HTTPException, Query
from database import metrics_col, nodes_col
from models import MetricPayload
from alert_engine import run_alert_engine
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


def _parse_range(range_str: str) -> datetime:
    """Convert range string to a cutoff datetime."""
    now = datetime.utcnow()
    mapping = {"1h": 1, "6h": 6, "24h": 24}
    hours = mapping.get(range_str, 1)
    return now - timedelta(hours=hours)


@router.post("/ingest")
async def ingest_metric(payload: MetricPayload):
    """Receive a metric report from an agent and run the alert engine."""
    doc = payload.dict()
    await metrics_col.insert_one(doc)

    # Update node last_seen
    await nodes_col.update_one(
        {"node_id": payload.node_id},
        {"$set": {"last_seen": datetime.utcnow(), "status": "online", "hostname": payload.hostname}},
        upsert=True,
    )

    # Run alert engine asynchronously
    await run_alert_engine(payload)

    return {"status": "ok"}


@router.get("/summary/all")
async def get_all_latest():
    """Return the latest metric document for every known node."""
    node_docs = await nodes_col.find({}, {"_id": 0, "node_id": 1}).to_list(length=500)
    results = []
    for nd in node_docs:
        doc = await metrics_col.find_one(
            {"node_id": nd["node_id"]},
            {"_id": 0},
            sort=[("timestamp", -1)],
        )
        if doc:
            results.append(doc)
    return results


@router.get("/{node_id}/latest")
async def get_latest_metric(node_id: str):
    """Return the single most recent metric for a node."""
    doc = await metrics_col.find_one(
        {"node_id": node_id}, {"_id": 0}, sort=[("timestamp", -1)]
    )
    if not doc:
        raise HTTPException(status_code=404, detail="No metrics found for this node")
    return doc


@router.get("/{node_id}")
async def get_metrics(
    node_id: str,
    range: str = Query(default="1h", regex="^(1h|6h|24h)$"),
):
    """Return historical metrics for a node within the specified time range."""
    cutoff = _parse_range(range)
    cursor = metrics_col.find(
        {"node_id": node_id, "timestamp": {"$gte": cutoff}},
        {"_id": 0},
    ).sort("timestamp", 1)
    data = await cursor.to_list(length=5000)
    return data
