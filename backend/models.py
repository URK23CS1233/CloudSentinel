from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List, Literal
import uuid


class Node(BaseModel):
    node_id: str
    hostname: str
    ip: str = "Unknown"
    os: str = "Unknown"
    status: str = "online"  # online | offline | stressed
    last_seen: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []


class MetricPayload(BaseModel):
    node_id: str
    hostname: str
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    disk_used_gb: float = 0.0
    disk_total_gb: float = 0.0
    memory_used_gb: float = 0.0
    memory_total_gb: float = 0.0
    cpu_cores: int = 1
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class Alert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    node_id: str
    type: str  # HIGH_CPU, HIGH_RAM, HIGH_DISK, etc.
    severity: Literal["info", "warning", "critical"] = "warning"
    value: float
    threshold: float
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    resolved: bool = False
    silenced: bool = False


class AlertRule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    node_id: str = "all"  # "all" means applies to every node
    metric: str  # cpu_percent | memory_percent | disk_percent
    operator: Literal[">", "<"] = ">"
    threshold: float
    severity: Literal["info", "warning", "critical"] = "warning"
    notification_channels: List[str] = []  # e.g. ["telegram"]


class Silence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    node_id: str
    alert_type: str
    duration_minutes: int = 60
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=datetime.utcnow)
