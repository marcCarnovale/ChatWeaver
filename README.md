# ChatWeaver

An experimental personal workspace for organizing assistant conversations as categories, threads, and nested comments. The application combines a React interface with a FastAPI backend, local SQLite storage, and optional embedding/model integrations.

![ChatWeaver interface](https://github.com/user-attachments/assets/11c4658d-09f7-4010-a102-504209f136b4)

## Status

ChatWeaver is a prototype rather than a production multi-user service. It currently assumes a trusted local user and does not provide authentication or tenant isolation. External model calls may incur cost and transmit supplied text to the selected provider.

## Architecture

- **Frontend:** React, React Router, Axios, React Markdown and DOMPurify.
- **Backend:** FastAPI with asynchronous SQLite access through `databases`/SQLAlchemy.
- **Retrieval:** SentenceTransformers embeddings stored in a local FAISS index.
- **Models:** optional OpenAI calls and an optional local GPT-2 pipeline.

The repository does not use Node/Express or PostgreSQL for its tracked backend implementation.

## Local setup

Python 3.10+, Node 20+, and npm are recommended.

```bash
git clone https://github.com/marcCarnovale/ChatWeaver.git
cd ChatWeaver
cp .env.example .env

python -m venv .venv
source .venv/bin/activate
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

In another terminal:

```bash
cd frontend
npm ci
npm start
```

Open `http://localhost:3000`. The frontend defaults to the backend at `http://localhost:8000/api`.

To enable local embeddings, FAISS retrieval, and the local GPT-2 option, also run:

```bash
python -m pip install -r backend/requirements-ml.txt
```

The first embedding or local-model operation can download substantial model files. `OPENAI_API_KEY` is needed only for OpenAI-backed operations.

## Configuration

Copy `.env.example` and adjust:

- `OPENAI_API_KEY`: optional provider credential;
- `CORS_ORIGINS`: comma-separated allowed browser origins for the backend; and
- `ENABLE_RETRIEVAL`: set to `true` after installing the optional ML requirements; and
- `REACT_APP_API_BASE_URL`: frontend API endpoint.

Do not commit `.env`. Local SQLite databases, FAISS indexes, caches, and model artifacts are excluded from version control.

## Verification

Backend:

```bash
python -m pip install -r backend/requirements-dev.txt
pytest -q
ruff check --select E4,E7,E9,F,I backend embeddings tests
```

Frontend:

```bash
cd frontend
npm ci
npm run build
```

Tests must not make real provider calls. Model and retrieval boundaries should be replaced with deterministic fakes.

## Security and operational limitations

- No authentication or authorization is implemented.
- The default CORS policy permits only the documented local frontend origins; configure it explicitly for another deployment.
- Prompt and response bodies should not be logged.
- The local database and FAISS index are not designed for concurrent distributed writers.
- Provider availability, model behavior and API compatibility are not guaranteed.
- This repository has not received an independent security review.
