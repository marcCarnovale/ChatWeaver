import pytest
from fastapi.testclient import TestClient
from backend.main import app
import backend.dependencies as deps

class DummyVectorDB:
    async def initialize(self):
        pass
    async def search_embeddings(self, query: str, k: int = 5):
        return [
            {"thread_id": 1, "text": "Dummy text", "flags": 0, "approvals": 0}
        ]

@pytest.fixture(scope="module")
def client(monkeypatch):
    dummy_db = DummyVectorDB()
    monkeypatch.setattr(deps, "vector_db", dummy_db)
    monkeypatch.setattr("backend.main.vector_db", dummy_db)
    monkeypatch.setattr(deps, "get_vector_db", lambda: dummy_db)
    with TestClient(app) as c:
        yield c

