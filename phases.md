# AI Clinical Documentation Assistant — Project Phases

## Overview

An AI-powered full-stack application that converts doctor-patient conversations (audio or
text transcript) into structured SOAP notes, ICD-10 code suggestions, visit summaries,
and follow-up recommendations.

**Core decisions:**
- LLM: OpenAI for all AI calls
- Database: Supabase (PostgreSQL)
- Transcription: faster-whisper (local, CPU-based)
- ICD-10 retrieval: ChromaDB vector index + gpt-4o-mini rerank
- Backend: FastAPI (Python 3.12)
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4

---

## Phase 1 — Database Schema & Supabase Setup

### Goal
Design and create all database tables in Supabase. Establish the connection between the
backend and Supabase so data can be read and written.

### Supabase Connection Details (`.env`)

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
```

Where to find these:
- `SUPABASE_URL` + keys → Supabase dashboard → Project Settings → API
- `DATABASE_URL` → Project Settings → Database → Connection string (select asyncpg mode)

### Database Tables

#### `patients`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `name` | TEXT | nullable | Optional patient name |
| `date_of_birth` | DATE | nullable | |
| `created_at` | TIMESTAMPTZ | default now() | |

#### `encounters`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `patient_id` | UUID | FK → patients(id), nullable | Optional link to patient |
| `encounter_date` | TIMESTAMPTZ | default now() | |
| `transcript` | TEXT | NOT NULL | Raw conversation text |
| `processing_time_ms` | INT | nullable | Total AI pipeline latency |
| `created_at` | TIMESTAMPTZ | default now() | |

#### `soap_notes`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `encounter_id` | UUID | FK → encounters(id), UNIQUE | One SOAP note per encounter |
| `subjective` | TEXT | NOT NULL | Patient-reported symptoms, history |
| `objective` | TEXT | NOT NULL | Exam findings, vitals, labs |
| `assessment` | TEXT | NOT NULL | Diagnosis / differential |
| `plan` | TEXT | NOT NULL | Treatment, medications, follow-up |
| `subjective_confidence` | FLOAT | | AI confidence score 0–1 |
| `objective_confidence` | FLOAT | | AI confidence score 0–1 |
| `assessment_confidence` | FLOAT | | AI confidence score 0–1 |
| `plan_confidence` | FLOAT | | AI confidence score 0–1 |
| `finalized` | BOOLEAN | default false | True once clinician approves |
| `updated_at` | TIMESTAMPTZ | | Tracks clinician edits |

#### `icd_codes`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `encounter_id` | UUID | FK → encounters(id) | Multiple codes per encounter |
| `code` | TEXT | NOT NULL | e.g. J18.9 |
| `description` | TEXT | NOT NULL | Official CMS description |
| `confidence` | FLOAT | | AI confidence score 0–1 |
| `rationale` | TEXT | | One-sentence clinical rationale |
| `approved` | BOOLEAN | default true | Clinician unchecks to reject |

#### `visit_summaries`
| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, default gen_random_uuid() | |
| `encounter_id` | UUID | FK → encounters(id), UNIQUE | One summary per encounter |
| `summary` | TEXT | NOT NULL | 2–3 sentence visit summary |
| `follow_ups` | JSONB | | Array of {action, timeframe} objects |
| `updated_at` | TIMESTAMPTZ | | |

### SQL Migration (run in Supabase SQL Editor)

```sql
-- patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- encounters
CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  encounter_date TIMESTAMPTZ DEFAULT now(),
  transcript TEXT NOT NULL,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- soap_notes
CREATE TABLE soap_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID UNIQUE REFERENCES encounters(id) ON DELETE CASCADE,
  subjective TEXT NOT NULL,
  objective TEXT NOT NULL,
  assessment TEXT NOT NULL,
  plan TEXT NOT NULL,
  subjective_confidence FLOAT,
  objective_confidence FLOAT,
  assessment_confidence FLOAT,
  plan_confidence FLOAT,
  finalized BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- icd_codes
CREATE TABLE icd_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT,
  rationale TEXT,
  approved BOOLEAN DEFAULT true
);

-- visit_summaries
CREATE TABLE visit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID UNIQUE REFERENCES encounters(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  follow_ups JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Deliverables
- [ ] Supabase project created
- [ ] All 5 tables created via SQL Editor
- [ ] `.env` filled with Supabase credentials
- [ ] Backend can connect and run a test query

---

## Phase 2 — Backend Services

### Goal
Build the FastAPI backend: AI pipeline (transcription → SOAP → ICD → summary), database
persistence, and all REST endpoints.

### Project Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, CORS, lifespan startup
│   ├── core/
│   │   ├── config.py            # pydantic-settings reads .env
│   │   └── database.py          # SQLAlchemy async engine → Supabase
│   ├── models/
│   │   ├── schemas.py           # Pydantic request/response models
│   │   └── db_models.py         # SQLAlchemy ORM table definitions
│   ├── api/routes/
│   │   ├── encounters.py        # All encounter endpoints
│   │   └── icd.py               # ICD search endpoint
│   └── services/
│       ├── transcription.py     # faster-whisper audio → text
│       ├── soap_generator.py    # gpt-4o-mini → SOAP note (JSON schema output)
│       ├── icd_service.py       # ChromaDB vector search + gpt-4o-mini rerank
│       └── summary_service.py   # gpt-4o-mini → visit summary + follow-ups
├── scripts/
│   ├── download_icd10.py        # One-time: fetch ~72k codes from CMS
│   └── build_icd_index.py       # One-time: embed codes into ChromaDB (~5-10 min)
├── data/icd10/                  # icd10cm_codes_2025.csv
├── requirements.txt
└── .env.example
```

### Key Libraries

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.12
openai>=1.30.0
pydantic==2.11.7
pydantic-settings==2.10.1
sqlalchemy==2.0.36
asyncpg==0.30.0
supabase==2.10.0
faster-whisper==1.1.1
chromadb==1.0.12
sentence-transformers==3.4.1
pandas==2.2.3
aiofiles==24.1.0
```

### AI Pipeline

Each step is serial — output feeds the next:

```
Audio bytes
    ↓ faster-whisper (CPU, asyncio.to_thread)
Transcript text
    ↓ gpt-4o-mini (response_format JSON schema)
SOAP note (4 sections + confidence scores)
    ↓ ChromaDB vector search (all-MiniLM-L6-v2) → top-10 candidates
    ↓ gpt-4o-mini rerank → 3-5 ICD-10 codes with rationale
    ↓ gpt-4o-mini
Visit summary + follow-up list
    ↓ SQLAlchemy async → Supabase PostgreSQL
EncounterResponse (returned to frontend)
```

### Services Detail

**`transcription.py`**
- Singleton `WhisperModel("base", device="cpu", compute_type="int8")`
- Accepts raw audio bytes, writes to temp file, runs VAD-filtered transcription
- Called via `asyncio.to_thread()` to avoid blocking the event loop

**`soap_generator.py`**
- `openai.AsyncOpenAI` with `response_format` JSON schema
- System prompt passed via the `system` message role
- Returns `SOAPNote` with 4 sections; each section has `content`, `confidence`, `uncertain`
- `uncertain = True` when `confidence < 0.75` (frontend highlights these in amber)

**`icd_service.py`**
- Singleton `SentenceTransformer("all-MiniLM-L6-v2")` + `chromadb.PersistentClient`
- `get_icd_suggestions()`: vector search top-10 → gpt-4o-mini rerank → 3-5 `ICDCode` objects
- `search_icd_direct()`: vector search only, no LLM — used by the search endpoint (~50ms)

**`summary_service.py`**
- Single gpt-4o-mini call with full SOAP note + ICD codes as input
- Returns `VisitSummary` with summary string + `follow_ups` list of `{action, timeframe}`

### API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| POST | `/api/encounter/transcript` | Process text transcript, save, return result |
| POST | `/api/encounter/audio` | Transcribe audio, run pipeline, save, return result |
| GET | `/api/encounters` | List all encounters (paginated) |
| GET | `/api/encounters/{id}` | Retrieve a single saved encounter |
| PATCH | `/api/encounters/{id}/soap` | Save clinician edits to SOAP note |
| PATCH | `/api/encounters/{id}/icd` | Update approved/rejected ICD codes |
| DELETE | `/api/encounters/{id}` | Delete an encounter and all related records |
| GET | `/api/icd/search?q=&n=` | Fast ICD-10 vector search (no LLM) |

### One-time ICD-10 Setup

```bash
# Download ~72k CMS ICD-10-CM codes → data/icd10/icd10cm_codes_2025.csv
python scripts/download_icd10.py

# Build ChromaDB vector index (~5-10 min on Apple Silicon)
python scripts/build_icd_index.py
```

### Running Locally

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
brew install ffmpeg          # required by faster-whisper
cp .env.example .env         # fill in ANTHROPIC_API_KEY + Supabase credentials
python scripts/download_icd10.py
python scripts/build_icd_index.py
uvicorn app.main:app --port 8000 --reload
```

### Deliverables
- [ ] All services implemented and tested individually
- [ ] All API endpoints working
- [ ] Encounter data saved and retrieved from Supabase correctly
- [ ] ICD-10 index built and search returning results
- [ ] Audio transcription working end-to-end

---

## Phase 3 — Frontend

### Goal
Build the React SPA: audio input, AI-generated note display with clinician review
workflow, ICD code selection, visit summary, and past encounter history.

### Project Structure

```
frontend/
├── src/
│   ├── App.tsx                  # Root: layout + state machine
│   ├── components/
│   │   ├── AudioUpload.tsx      # 3-tab input: upload | record | paste
│   │   ├── TranscriptView.tsx   # Read-only transcript, collapsible
│   │   ├── SOAPNoteEditor.tsx   # 4 editable sections + confidence badges
│   │   ├── ICDSuggestions.tsx   # Checkboxes + inline ICD search
│   │   ├── VisitSummary.tsx     # Summary paragraph + follow-up list
│   │   └── EncounterList.tsx    # Sidebar: past encounters from Supabase
│   ├── services/
│   │   └── api.ts               # Typed fetch wrappers for all endpoints
│   └── types/
│       └── index.ts             # TypeScript interfaces matching backend schemas
├── package.json
├── vite.config.ts               # Dev proxy: /api → http://127.0.0.1:8000
└── tsconfig.json
```

### Component Behaviour

**`AudioUpload.tsx`**
- Tab 1 — File upload: drag-and-drop zone + file input (WAV, MP3, M4A, WebM, FLAC, max 100MB)
- Tab 2 — Live record: MediaRecorder API; records as `audio/webm`, falls back to `audio/mp4`
  on Safari; start/stop button with pulsing animation while recording
- Tab 3 — Paste text: textarea + "Generate SOAP Note" button

**`SOAPNoteEditor.tsx`**
- 4 `<textarea>` fields (Subjective, Objective, Assessment, Plan), all editable
- Amber border + "Review needed" badge when `confidence < 0.75`
- Confidence badge color: green ≥ 85%, amber ≥ 75%, red < 75%
- "Finalize" button calls `PATCH /api/encounters/{id}/soap`

**`ICDSuggestions.tsx`**
- Checkbox list of AI-suggested codes; all pre-checked by default
- Each code shows: code, description, confidence %, rationale
- Clinician unchecks to reject; "Save" calls `PATCH /api/encounters/{id}/icd`
- Inline search input → `GET /api/icd/search` for adding extra codes

**`VisitSummary.tsx`**
- Summary paragraph (editable)
- Bulleted follow-up list with optional timeframe badges (e.g. "2 weeks", "as needed")

**`EncounterList.tsx`**
- Sidebar listing past encounters from `GET /api/encounters`
- Click to load a saved encounter into the main view
- Shows encounter date and first line of transcript

**`App.tsx` state machine**
```
idle → uploading (audio) → processing (AI pipeline) → done | error
```
- Left column: AudioUpload + TranscriptView
- Right column: SOAPNoteEditor + ICDSuggestions + VisitSummary

### Running Locally

```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

### Deliverables
- [ ] All components implemented
- [ ] Audio upload, live recording, and transcript paste all trigger the pipeline
- [ ] SOAP note renders with correct confidence highlighting
- [ ] ICD code approval/rejection saves to Supabase
- [ ] Past encounters load correctly from the sidebar
- [ ] Works on Chrome and Safari (MediaRecorder fallback)

---

## Phase 4 — Deployment

### Goal
Deploy backend and frontend to production with environment variables wired to Supabase.

### Backend — Railway or Render

**`backend/Dockerfile`**
```dockerfile
FROM python:3.12-slim
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Steps:**
1. Push repo to GitHub
2. Create Railway/Render service from the `backend/` directory
3. Set all environment variables in the dashboard (Supabase + OpenAI credentials)
4. The ChromaDB index needs to either be:
   - Committed to the repo (if small enough), or
   - Built at deploy time via a release command: `python scripts/build_icd_index.py`
5. Update `FRONTEND_ORIGIN` env var to the deployed frontend URL

### Frontend — Vercel or Netlify

**Steps:**
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
4. Update `api.ts` to use `VITE_API_URL` as base URL in production

### CORS Update
Once both are deployed, update backend `.env`:
```env
FRONTEND_ORIGIN=https://your-frontend.vercel.app
```

### Deliverables
- [ ] Backend running on Railway/Render with all env vars set
- [ ] Frontend deployed on Vercel/Netlify pointing to production backend
- [ ] Full end-to-end test on production URLs
- [ ] CORS configured correctly between frontend and backend domains
