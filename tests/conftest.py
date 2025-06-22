import pytest
from fastapi.testclient import TestClient
import backend.dependencies as deps
from sqlalchemy.ext.asyncio import create_async_engine
from databases import Database
from types import SimpleNamespace
import importlib
import transformers
import sentence_transformers

# Patch heavy model loading before importing backend modules
transformers.pipeline = lambda *a, **k: lambda x, **kw: ["dummy"]
transformers.AutoTokenizer = SimpleNamespace(from_pretrained=lambda *a, **k: None)
sentence_transformers.SentenceTransformer = lambda *a, **k: SimpleNamespace(encode=lambda x: [0.0])

import backend.services.model_router as model_router
importlib.reload(model_router)

import backend.database as db

db.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
db.database = Database("sqlite+aiosqlite:///:memory:")

async def init_db():
    async with db.engine.begin() as conn:
        await conn.run_sync(db.metadata.create_all)
    await db.database.connect()

async def close_db_connection():
    await db.database.disconnect()
    await db.engine.dispose()

db.init_db = init_db
db.close_db_connection = close_db_connection

from backend.main import app

class DummyVectorDB:
    async def initialize(self):
        pass
    async def search_embeddings(self, query: str, k: int = 5):
        return [
            {"thread_id": 1, "text": "Dummy text", "flags": 0, "approvals": 0}
        ]

@pytest.fixture
def client(monkeypatch):
    dummy_db = DummyVectorDB()
    monkeypatch.setattr(deps, "vector_db", dummy_db)
    monkeypatch.setattr("backend.main.vector_db", dummy_db)
    monkeypatch.setattr(deps, "get_vector_db", lambda: dummy_db)
    with TestClient(app) as c:
        yield c

