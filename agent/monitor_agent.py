"""
CloudSentinel Monitor Agent
Runs on each server node. Collects system metrics and POSTs to the backend.

Usage:
  pip install psutil requests
  python monitor_agent.py

Environment Variables:
  API_URL  — Backend URL (default: http://localhost:8000)
"""

import os
import sys
import uuid
import time
import socket
import platform
import logging
import requests
import psutil
from datetime import datetime

# ─── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("agent")

# ─── Config ────────────────────────────────────────────────────────────────────

AGENT_ID_FILE = os.path.join(os.path.dirname(__file__), "agent_id.txt")
API_URL = os.environ.get("API_URL", "http://localhost:8000").rstrip("/")
SEND_INTERVAL = int(os.environ.get("SEND_INTERVAL", "10"))  # seconds


def get_or_create_node_id() -> str:
    """Read NODE_ID from file, or generate and persist a new UUID."""
    if os.path.exists(AGENT_ID_FILE):
        with open(AGENT_ID_FILE, "r") as f:
            node_id = f.read().strip()
            if node_id:
                return node_id
    node_id = str(uuid.uuid4())
    with open(AGENT_ID_FILE, "w") as f:
        f.write(node_id)
    log.info(f"Generated new NODE_ID: {node_id}")
    return node_id


def get_local_ip() -> str:
    """Best-effort local IP detection."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def register_node(node_id: str):
    """POST /nodes/register to announce this node to the backend."""
    payload = {
        "node_id": node_id,
        "hostname": socket.gethostname(),
        "ip": get_local_ip(),
        "os": f"{platform.system()} {platform.release()}",
        "status": "online",
        "tags": [],
    }
    try:
        resp = requests.post(f"{API_URL}/nodes/register", json=payload, timeout=10)
        resp.raise_for_status()
        log.info(f"Registered node {node_id} ({payload['hostname']}) with backend")
    except Exception as e:
        log.warning(f"Node registration failed: {e} — will retry on next cycle")


def collect_metrics(node_id: str) -> dict:
    """Collect current system metrics using psutil."""
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage("/") if platform.system() != "Windows" else psutil.disk_usage("C:\\")

    return {
        "node_id": node_id,
        "hostname": socket.gethostname(),
        "cpu_percent": cpu,
        "cpu_cores": psutil.cpu_count(logical=True) or 1,
        "memory_percent": mem.percent,
        "memory_used_gb": round(mem.used / 1024 ** 3, 2),
        "memory_total_gb": round(mem.total / 1024 ** 3, 2),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / 1024 ** 3, 2),
        "disk_total_gb": round(disk.total / 1024 ** 3, 2),
        "timestamp": datetime.utcnow().isoformat(),
    }


def send_metrics(payload: dict, backoff: float) -> float:
    """POST metrics to backend. Returns updated backoff value."""
    try:
        resp = requests.post(f"{API_URL}/metrics/ingest", json=payload, timeout=10)
        resp.raise_for_status()
        log.info(
            f"Sent | CPU: {payload['cpu_percent']:.1f}%  "
            f"RAM: {payload['memory_percent']:.1f}%  "
            f"Disk: {payload['disk_percent']:.1f}%"
        )
        return 1.0  # reset backoff on success
    except requests.exceptions.ConnectionError:
        new_backoff = min(backoff * 2, 60)
        log.warning(f"Backend unreachable. Retrying in {new_backoff:.0f}s (backoff)")
        return new_backoff
    except Exception as e:
        log.error(f"Failed to send metrics: {e}")
        return min(backoff * 2, 60)


# ─── Main Loop ─────────────────────────────────────────────────────────────────

def main():
    node_id = get_or_create_node_id()
    log.info(f"CloudSentinel Agent starting | node_id={node_id}")
    log.info(f"Backend: {API_URL} | Interval: {SEND_INTERVAL}s")

    register_node(node_id)

    backoff = 1.0
    while True:
        try:
            payload = collect_metrics(node_id)
            backoff = send_metrics(payload, backoff)
        except Exception as e:
            log.error(f"Unexpected error in agent loop: {e}")
            backoff = min(backoff * 2, 60)

        sleep_time = SEND_INTERVAL if backoff == 1.0 else backoff
        time.sleep(sleep_time)


if __name__ == "__main__":
    main()
