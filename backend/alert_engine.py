"""
Alert Engine — runs after every metric ingestion.

Rules:
1. Load AlertRules from MongoDB for this node (node-specific + "all")
2. Evaluate metric value against threshold
3. Deduplication: skip if same alert type+node fired in last 5 minutes
4. Inhibition: skip all metric alerts if node is "offline"
5. Silence check: skip if an active silence covers this alert
6. If alert fires: save to MongoDB and send Telegram notification
"""

import os
import httpx
from datetime import datetime, timedelta
from database import alerts_col, alert_rules_col, silences_col, nodes_col
from models import Alert, MetricPayload

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

METRIC_LABELS = {
    "cpu_percent": "CPU",
    "memory_percent": "RAM",
    "disk_percent": "Disk",
}

ALERT_TYPE_MAP = {
    "cpu_percent": "HIGH_CPU",
    "memory_percent": "HIGH_RAM",
    "disk_percent": "HIGH_DISK",
}


async def _send_telegram(message: str):
    """Send a Telegram message via Bot API if credentials are set."""
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url, json={"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"})
    except Exception as e:
        print(f"[alert_engine] Telegram send failed: {e}")


async def _is_deduplicated(node_id: str, alert_type: str) -> bool:
    """Return True if the same alert type fired for this node in the last 5 minutes."""
    cutoff = datetime.utcnow() - timedelta(minutes=5)
    existing = await alerts_col.find_one({
        "node_id": node_id,
        "type": alert_type,
        "timestamp": {"$gte": cutoff},
        "resolved": False,
    })
    return existing is not None


async def _is_silenced(node_id: str, alert_type: str) -> bool:
    """Return True if an active, non-expired silence covers this alert."""
    now = datetime.utcnow()
    silence = await silences_col.find_one({
        "node_id": node_id,
        "alert_type": alert_type,
        "expires_at": {"$gt": now},
    })
    return silence is not None


async def _is_node_offline(node_id: str) -> bool:
    """Return True if the node's current status is 'offline'."""
    node = await nodes_col.find_one({"node_id": node_id}, {"status": 1})
    if not node:
        return False
    return node.get("status") == "offline"


def _evaluate(value: float, operator: str, threshold: float) -> bool:
    if operator == ">":
        return value > threshold
    if operator == "<":
        return value < threshold
    return False


async def run_alert_engine(payload: MetricPayload):
    """Evaluate all applicable alert rules against the incoming metric payload."""

    # Inhibition: skip all metric alerts for offline nodes
    if await _is_node_offline(payload.node_id):
        return

    # Load rules that apply to this node or to "all"
    cursor = alert_rules_col.find({
        "$or": [
            {"node_id": payload.node_id},
            {"node_id": "all"},
        ]
    })
    rules = await cursor.to_list(length=200)

    metric_values = {
        "cpu_percent": payload.cpu_percent,
        "memory_percent": payload.memory_percent,
        "disk_percent": payload.disk_percent,
    }

    for rule in rules:
        metric = rule.get("metric")
        operator = rule.get("operator", ">")
        threshold = rule.get("threshold", 0)
        severity = rule.get("severity", "warning")

        value = metric_values.get(metric)
        if value is None:
            continue

        if not _evaluate(value, operator, threshold):
            continue

        alert_type = ALERT_TYPE_MAP.get(metric, metric.upper())

        # Deduplication check
        if await _is_deduplicated(payload.node_id, alert_type):
            continue

        # Silence check
        if await _is_silenced(payload.node_id, alert_type):
            continue

        label = METRIC_LABELS.get(metric, metric)
        message = (
            f"🚨 [{severity.upper()}] {label} alert on `{payload.hostname}`\n"
            f"{label} is at {value:.1f}% (threshold: {operator}{threshold}%)"
        )

        alert = Alert(
            node_id=payload.node_id,
            type=alert_type,
            severity=severity,
            value=value,
            threshold=threshold,
            message=message,
        )

        await alerts_col.insert_one(alert.dict())
        await _send_telegram(message)
        print(f"[alert_engine] Fired {alert_type} for {payload.node_id} ({value:.1f}%)")
