# AI-Powered Land Risk Assessment System

Production-grade, containerized pipeline for geospatial land-risk analysis.

The system combines:

- Go backend API for orchestration, validation, and reporting
- Python ML microservice (XGBoost + satellite feature extraction)
- React frontend dashboard with map-driven input and diagnostics
- PostgreSQL for report/trace persistence
- Redis for caching and latency optimization

## Why this project exists

Land-risk assessment often requires combining heterogeneous signals: geospatial context, satellite observations, engineered features, and deterministic policy rules. This repository implements an end-to-end system that turns those inputs into:

- A risk class and confidence score
- A technical explanation trail
- A citizen-friendly summary
- Downloadable JSON/PDF reports and trace artifacts

## System architecture

```mermaid
flowchart LR
	U[User] --> F[React Frontend]
	F --> B[Go Backend API]

	B --> K[KGIS / Geospatial APIs]
	B --> M[Python ML Service]
	B --> R[(Redis Cache)]
	B --> P[(PostgreSQL)]
	B --> O[OpenRouter Summary API Optional]

	M --> S[Satellite Data Sources]
```

## Core capabilities

- Multi-input analysis request handling:
	- latitude + longitude
	- or villageId + surveyNumber
- Resilient KGIS ingestion with retry/timeout handling
- Feature engineering for model inference
- Satellite feature extraction (`ndvi`, `vegetation_density`, `water_overlap_ratio`)
- Rule-based validation and confidence adjustment
- Deterministic high-risk override for high water overlap conditions
- Full trace and latency metrics persistence
- PDF report generation
- Optional plain-language summary generation via OpenRouter

## Repository layout

```text
.
├── backend-go/          # Go API service, orchestration, persistence, reporting
├── ml-service-python/   # FastAPI ML inference + satellite feature service
├── frontend-react/      # React + Leaflet client app
├── postgres/            # PostgreSQL init scripts
├── redis/               # Redis configuration
├── tests/integration/   # End-to-end smoke test script
├── docs/                # Evaluation notes and final report artifacts
├── docker-compose.yml   # Multi-service stack definition
└── Makefile             # Developer and CI-friendly commands
```

## Prerequisites

- Docker Engine with Docker Compose plugin
- GNU Make

Optional for local, non-containerized development:

- Go 1.22+
- Python 3.11+
- Node.js 20+

## Quick start

1. Create runtime environment file.

```bash
cp .env.local .env
```

2. Optionally update credentials and API settings in `.env`.

3. Build and start the full stack.

```bash
make up
```

This command:

1. Builds/starts all services.
2. Runs database migrations.
3. Seeds sample data.

4. Verify health.

```bash
curl -fsS http://127.0.0.1:18080/health
```

## Service endpoints (default)

Defaults come from `.env.local`.

| Service | URL |
| --- | --- |
| Frontend | http://127.0.0.1:13000 |
| Backend API | http://127.0.0.1:18080 |
| ML Service | http://127.0.0.1:18000 |
| PostgreSQL | 127.0.0.1:15432 |
| Redis | 127.0.0.1:6379 |

## Make targets

```bash
make build
make up
make down
make restart
make logs
make clean
make migrate
make seed
make test
make integration-test
```

## API reference

### Backend API

Base URL: `http://127.0.0.1:18080`

#### `POST /analyze`

Request examples:

```json
{
	"latitude": 12.9716,
	"longitude": 77.5946,
	"surveyType": "parcel"
}
```

```json
{
	"villageId": "V123",
	"surveyNumber": "S456",
	"surveyType": "parcel"
}
```

Response shape:

```json
{
	"report": {
		"id": "<report-id>",
		"riskClass": "Low|Medium|High",
		"confidence": 0.0,
		"citizenSummary": {
			"overview": "...",
			"keyPoints": [],
			"nextSteps": [],
			"disclaimer": "...",
			"source": "model|fallback"
		}
	},
	"cacheHit": false
}
```

#### `GET /report/:id`

Returns persisted report metadata and full payload.

#### `GET /report/:id?format=pdf`

Returns PDF report bytes as file download.

#### `GET /trace/:id`

Returns trace payload and stored metrics for auditing.

#### `GET /health`

Health endpoint for backend service.

### ML service API

Base URL: `http://127.0.0.1:18000`

#### `POST /predict`

Input:

```json
{
	"features": [0.1, 0.2, 0.3, 0.4, 0.1, 1.0, 3.0, 0.7, 1520.0, 0.0]
}
```

#### `POST /satellite-features`

Input supports either coordinates or geometry.

```json
{
	"latitude": 12.9716,
	"longitude": 77.5946
}
```

#### `GET /health`

Health endpoint for ML service.

## Pipeline execution flow

1. Request validation and deduplication.
2. Concurrent/optimized KGIS pulls.
3. Preprocessing and feature engineering.
4. Satellite feature extraction.
5. ML inference.
6. Rule-based validation and confidence/risk adjustment.
7. Report generation + optional citizen summary.
8. Persistence of report, trace, and latency metrics.
9. Cache write for repeated-input acceleration.

## Configuration

Main runtime config is in `.env` (copy from `.env.local`).

Important variables:

| Variable | Purpose | Default |
| --- | --- | --- |
| `BACKEND_PORT` | Backend published port | `18080` |
| `ML_SERVICE_PORT` | ML service published port | `18000` |
| `FRONTEND_PORT` | Frontend published port | `13000` |
| `DATABASE_URL` | Backend PostgreSQL DSN | `postgres://landrisk:landrisk@postgres:5432/landrisk?sslmode=disable` |
| `REDIS_URL` | Backend Redis URL | `redis://redis:6379/0` |
| `ML_SERVICE_URL` | Backend to ML service URL | `http://ml-service:8000` |
| `KGIS_BASE_URL` | Upstream geospatial endpoint base | `https://kgis.ksrsac.in:9000` |
| `REQUEST_TIMEOUT_SECONDS` | End-to-end backend timeout | `25` |
| `ML_TIMEOUT_SECONDS` | ML call timeout | `10` |
| `KGIS_TIMEOUT_SECONDS` | KGIS call timeout | `8` |
| `OPENROUTER_API_KEY` | Optional LLM key for citizen summaries | empty |
| `OPENROUTER_MODEL` | OpenRouter model name | `openai/gpt-oss-120b:free` |

## Testing

Run all core tests:

```bash
make test
```

Run integration smoke test against running stack:

```bash
make integration-test
```

Current coverage focus:

- Backend unit tests: handlers, preprocessing, validation, analyzer timeout behavior
- ML unit tests: NDVI and inference behavior
- Integration test: full request-to-report pipeline smoke validation

## Troubleshooting

### Missing `.env` or compose env errors

Ensure `.env` exists:

```bash
cp .env.local .env
```

### Services are unhealthy after startup

Check logs:

```bash
make logs
```

Reset stack and volumes when required:

```bash
make clean && make up
```

### OpenRouter summaries not appearing

If `OPENROUTER_API_KEY` is empty/invalid, the backend falls back to deterministic text for `citizenSummary`.

### Integration test cannot reach backend

Use host `127.0.0.1` consistently (the integration script defaults to this).

## Security and secrets

- Do not commit `.env`.
- Keep API keys in local environment only.
- Rotate keys immediately if exposed.
- Restrict CORS origin via `FRONTEND_ORIGIN` for non-local deployments.

## Documentation index

Detailed docs are in [docs/README.md](docs/README.md).

Quick links:

- [docs/evaluation/01-data-pulling-and-preprocessing.md](docs/evaluation/01-data-pulling-and-preprocessing.md)
- [docs/evaluation/02-technique-logic-data-handling-response-time.md](docs/evaluation/02-technique-logic-data-handling-response-time.md)
- [docs/evaluation/03-accuracy-and-result-validation.md](docs/evaluation/03-accuracy-and-result-validation.md)
- [docs/evaluation/04-report-quality.md](docs/evaluation/04-report-quality.md)
- [docs/evaluation/05-frontend-design-and-experience.md](docs/evaluation/05-frontend-design-and-experience.md)
- [docs/report/Report.tex](docs/report/Report.tex)
- [docs/report/Report.pdf](docs/report/Report.pdf)

## Demo Video

Project demo recording:

- [Demo.mp4](Demo.mp4)
