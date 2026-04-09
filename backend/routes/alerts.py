from fastapi import APIRouter, HTTPException, Query
from database import alerts_col, alert_rules_col, silences_col
from models import Alert, AlertRule, Silence
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()


# ─── ALERTS ────────────────────────────────────────────────────────────────────

@router.get("/")
async def get_alerts(
    node_id: Optional[str] = Query(default=None),
    severity: Optional[str] = Query(default=None),
):
    """List all active (unresolved) alerts, optionally filtered."""
    query: dict = {"resolved": False}
    if node_id:
        query["node_id"] = node_id
    if severity:
        query["severity"] = severity
    cursor = alerts_col.find(query, {"_id": 0}).sort("timestamp", -1)
    return await cursor.to_list(length=200)


@router.post("/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    """Mark an alert as resolved."""
    result = await alerts_col.update_one(
        {"id": alert_id}, {"$set": {"resolved": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "resolved"}


@router.post("/{alert_id}/silence")
async def silence_alert(alert_id: str, duration_minutes: int = 60):
    """Silence a specific alert for a given duration and create a silence rule."""
    alert = await alerts_col.find_one({"id": alert_id}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    now = datetime.utcnow()
    silence = Silence(
        node_id=alert["node_id"],
        alert_type=alert["type"],
        duration_minutes=duration_minutes,
        created_at=now,
        expires_at=now + timedelta(minutes=duration_minutes),
    )
    await silences_col.insert_one(silence.dict())
    await alerts_col.update_one({"id": alert_id}, {"$set": {"silenced": True}})
    return {"status": "silenced", "expires_at": silence.expires_at}


# ─── ALERT RULES ───────────────────────────────────────────────────────────────

@router.get("/rules")
async def get_alert_rules():
    """List all configured alert rules."""
    rules = await alert_rules_col.find({}, {"_id": 0}).to_list(length=200)
    return rules


@router.post("/rules")
async def create_alert_rule(rule: AlertRule):
    """Create a new alert threshold rule."""
    await alert_rules_col.insert_one(rule.dict())
    return {"status": "created", "id": rule.id}


@router.delete("/rules/{rule_id}")
async def delete_alert_rule(rule_id: str):
    """Delete an alert rule by ID."""
    result = await alert_rules_col.delete_one({"id": rule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"status": "deleted"}
