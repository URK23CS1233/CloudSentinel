from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/cloudsentinel")
client = AsyncIOMotorClient(MONGODB_URL)
db = client.cloudsentinel

# Collection references
nodes_col = db.nodes
metrics_col = db.metrics
alerts_col = db.alerts
alert_rules_col = db.alert_rules
silences_col = db.silences


async def create_indexes():
    """Create necessary MongoDB indexes on startup."""
    # TTL index: auto-delete metrics older than 30 days
    await metrics_col.create_index(
        "timestamp",
        expireAfterSeconds=30 * 24 * 60 * 60  # 30 days
    )
    # Performance indexes
    await metrics_col.create_index([("node_id", 1), ("timestamp", -1)])
    await nodes_col.create_index("node_id", unique=True)
    await alerts_col.create_index([("node_id", 1), ("timestamp", -1)])
    await alerts_col.create_index("id", unique=True)
    await alert_rules_col.create_index("id", unique=True)
    await silences_col.create_index("id", unique=True)
    await silences_col.create_index("expires_at")
    print("✅ MongoDB indexes created")
