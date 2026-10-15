# BellWether

Full-stack AI retail app for the Google AI Builder Cup 2026. The frontend is a
React + Vite single-page app ("The Shopfront" design system) and the
backend is a FastAPI + Gemini API service (google-genai SDK).

```
backend/   FastAPI API (semantic + visual search, chat, merchant copilot)
frontend/  React 18 + Vite + TypeScript + Tailwind v4 UI
```

## Features

- **Semantic search** over the product catalog (`/api/search`)
- **Visual search** from an uploaded image (`/api/search/visual`)
- **Conversational shopping assistant** with tool calling (`/api/chat`)
- **Merchant copilot**: natural language to read-only SQL analytics
  (`/api/merchant/ask`) and low-stock/fast-selling alerts (`/api/merchant/alerts`)

The catalog is a general-retail store across six categories:
Apparel, Footwear, Home & Living, Beauty, Kitchen and Accessories.

## Prerequisites

- Python 3.11
- Node 20+
- A Gemini API key from Google AI Studio
  (https://aistudio.google.com/apikey)

## Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env        # then edit the values
```

`.env` keys:

| Key | Description |
| --- | --- |
| `GEMINI_BACKEND` | `api` (AI Studio key) or `vertex` (GCP project). Default `api` |
| `GEMINI_API_KEY` | Gemini API key from Google AI Studio |
| `GOOGLE_CLOUD_PROJECT` | Only for `GEMINI_BACKEND=vertex` |
| `GOOGLE_CLOUD_LOCATION` | Only for `GEMINI_BACKEND=vertex` (default `us-central1`) |
| `GEMINI_MODEL` | Chat model ID (e.g. `gemini-2.5-flash`) |
| `EMBEDDING_MODEL` | Embedding model ID (e.g. `gemini-embedding-001`) |
| `DB_PATH` | Path to the local SQLite database |

Seed the database, verify the API key, and embed the catalog:

```bash
python scripts/seed.py              # 200 products, baskets, customers, personas
python scripts/seed_events.py      # 400 shopper search events (feeds Demand Radar)
python scripts/smoke_test_ai.py     # requires GEMINI_API_KEY
python scripts/embed_catalog.py     # requires GEMINI_API_KEY
```

New endpoints beyond search/chat/ask/alerts:

| Endpoint | What it does |
| --- | --- |
| `GET /api/products/trending` | Top sellers by recent units (powers Shopper "Trending today") |
| `GET /api/products/{id}/complete-the-look` | Co-purchased items ranked by lift |
| `GET /api/merchant/overview` | Revenue/units KPIs, at-risk count, unmet demand |
| `GET /api/merchant/demand-gaps?days=` | Clustered unmet shopper demand (Demand Radar) |
| `GET /api/merchant/forecast?product_id=` | Days of cover + 14-day forecast |

`GET /api/search` accepts `persona_id` (`aarav`, `meera`, `riya`) for
personalised re-ranking. Every search, visual search and chat query is logged
to `search_events`; misses (`result_count == 0` or top score below
`DEMAND_MISS_THRESHOLD`) feed Demand Radar. Out-of-stock hits are swapped for
the nearest in-stock substitute with an explanatory note.

Run the API:

```bash
uvicorn app.main:app --reload
```

Then open http://localhost:8000/docs for the interactive API UI.

> Semantic/visual search and the chat/insight paths call the Gemini API and
> require `GEMINI_API_KEY`. Until the catalog is embedded, `/api/search` falls
> back to a lexical keyword search so the API stays usable without a key.

## Frontend

```bash
cd frontend
npm install
cp .env.example .env        # set VITE_API_URL and VITE_USE_MOCKS
npm run dev                 # http://localhost:5173
```

`.env` keys:

| Key | Description |
| --- | --- |
| `VITE_API_URL` | Backend base URL (default `http://localhost:8000`) |
| `VITE_USE_MOCKS` | `true` to use mock data, `false` to call the live API |

The navbar/footer toggle switches mock mode at runtime (persisted in
`localStorage`). Switch to live data to talk to the running backend.

Build for production:

```bash
cd frontend
npm run build
```

## Tests

```bash
cd backend
pytest
```

```bash
cd frontend
npm run lint
```

## Docker (backend)

```bash
cd backend
docker build -t bellwether .
# Provide env vars at run time; mount a volume for the SQLite DB.
docker run -p 8080:8080 \
  -e GEMINI_API_KEY=your-gemini-api-key \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e EMBEDDING_MODEL=gemini-embedding-001 \
  -e DB_PATH=/data/bellwether.db \
  -v bellwether-data:/data \
  bellwether
```

The container's only filesystem dependency is the SQLite database path from
`DB_PATH`; everything else is read from environment configuration.
