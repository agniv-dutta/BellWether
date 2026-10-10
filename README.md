# BellWether

AI retail backend for the Google AI Builder Cup 2026. FastAPI + Vertex AI
(google-genai SDK). Backend only, no frontend.

## Features

- **Semantic search** over the product catalog (`/api/search`)
- **Visual search** from an uploaded image (`/api/search/visual`)
- **Conversational shopping assistant** with tool calling (`/api/chat`)
- **Merchant copilot**: natural language to read-only SQL analytics
  (`/api/merchant/ask`) and low-stock/fast-selling alerts (`/api/merchant/alerts`)

## Requirements

- Python 3.11
- Google Cloud project with the Vertex AI API enabled
- Application Default Credentials (ADC) configured locally:
  `gcloud auth application-default login`

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env        # then edit the values
```

`.env` keys:

| Key | Description |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT` | Your Google Cloud project ID |
| `GOOGLE_CLOUD_LOCATION` | Vertex AI region (e.g. `us-central1`) |
| `GEMINI_MODEL` | Chat model ID (e.g. `gemini-2.5-flash`) |
| `EMBEDDING_MODEL` | Embedding model ID (e.g. `gemini-embedding-001`) |
| `DB_PATH` | Path to the local SQLite database |

## Seed the database

```bash
python scripts/seed.py
```

## Verify Vertex AI connectivity

```bash
python scripts/smoke_test_ai.py
```

## Embed the catalog

```bash
python scripts/embed_catalog.py
```

## Run

```bash
uvicorn app.main:app --reload
```

Then open http://localhost:8000/docs for the interactive API UI.

## Tests

```bash
pytest
```

## Docker

```bash
docker build -t bellwether .
# Provide env vars at run time; mount a volume for the SQLite DB.
docker run -p 8080:8080 \
  -e GOOGLE_CLOUD_PROJECT=your-project-id \
  -e GOOGLE_CLOUD_LOCATION=us-central1 \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e EMBEDDING_MODEL=gemini-embedding-001 \
  -e DB_PATH=/data/bellwether.db \
  -v bellwether-data:/data \
  bellwether
```

The container's only filesystem dependency is the SQLite database path from
`DB_PATH`; everything else is read from environment configuration.
