<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1f6feb,100:388bfd&height=200&section=header&text=ClinicalDoc%20AI&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=AI-powered%20clinical%20documentation%20assistant&descAlignY=58&descSize=18" width="100%" />

<br/>

[![Version](https://img.shields.io/badge/version-1.0.0-1f6feb?style=flat-square&logo=github)](https://github.com/rishi-2399/clinicaldoc_AI)
[![Backend](https://img.shields.io/badge/backend-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Frontend](https://img.shields.io/badge/frontend-React%2019-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Language](https://img.shields.io/badge/python-3.12-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Database](https://img.shields.io/badge/database-Supabase-3ecf8e?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Deploy](https://img.shields.io/badge/deployed%20on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://clinicaldoc-ai.vercel.app)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

<br/>

**Convert doctor–patient conversations into structured SOAP notes, ICD-10 codes, and visit summaries — in under 15 seconds.**

[🚀 Live Demo](https://clinicaldoc-ai.vercel.app) · [📖 Docs](#-quick-start) · [🐛 Report Bug](https://github.com/rishi-2399/clinicaldoc_AI/issues) · [✨ Request Feature](https://github.com/rishi-2399/clinicaldoc_AI/issues) · [📷 Demo Video](https://drive.google.com/file/d/1cY4rKUK5GjcRrVIfUv6oKZIjo61aZ_O1/view?usp=sharing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [AI Pipeline](#-ai-pipeline)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🧠 Overview

ClinicalDoc AI eliminates documentation burden for clinicians by turning raw audio or text transcripts of patient visits into fully structured, reviewable medical notes — complete with ICD-10 code suggestions and follow-up action plans.

| Metric | Value |
|---|---|
| ⚡ Pipeline latency | ~10 seconds (audio → full note) |
| 🗂️ ICD-10 index | 72,000 CMS 2025 codes |
| 🎙️ Transcription | Local CPU via `faster-whisper` |
| 🔬 SOAP sections | 4 sections, each with AI confidence scores |
| 💊 ICD codes per encounter | 3–5 with clinical rationale |
| 🛢️ Database | Supabase (PostgreSQL) |

---

## 🔄 AI Pipeline

Each step runs serially — the output of each stage feeds the next:

```
🎙️  Audio / Text Input
        │
        ▼
📝  Transcription          ←  faster-whisper (CPU, int8)
        │
        ▼
🩺  SOAP Note Generation   ←  gpt-4o-mini  (JSON schema output)
        │                      Subjective · Objective · Assessment · Plan
        │                      + confidence score per section
        ▼
🔍  ICD-10 Code Lookup     ←  ChromaDB vector search (top-10 candidates)
        │                      → gpt-4o-mini rerank → 3–5 codes + rationale
        ▼
📋  Visit Summary          ←  gpt-4o-mini  (summary + follow-up list)
        │
        ▼
💾  Persist to Supabase    ←  SQLAlchemy async → PostgreSQL
        │
        ▼
✅  EncounterResponse returned to frontend
```

---

## ✨ Features

- **Three input modes** — upload audio file, live microphone recording, or paste text transcript
- **Structured SOAP notes** — AI-generated Subjective, Objective, Assessment, and Plan sections
- **Confidence scoring** — each SOAP section includes a 0–1 confidence score; low-confidence sections are flagged amber for clinician review
- **ICD-10 suggestions** — vector search over 72k CMS codes, reranked by GPT with one-sentence clinical rationale per code
- **Clinician review workflow** — inline SOAP editing, approve/reject individual ICD codes, finalize notes
- **Visit summaries** — 2–3 sentence summary plus structured follow-up action list
- **Encounter history** — all past encounters stored in Supabase, accessible via sidebar
- **Safari support** — MediaRecorder fallback from `audio/webm` to `audio/mp4`

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| `fastapi` | 0.115.0 | REST API framework |
| `uvicorn` | 0.30.6 | ASGI server |
| `openai` | ≥1.30.0 | SOAP, ICD rerank, summary generation |
| `faster-whisper` | 1.1.1 | Local CPU audio transcription |
| `chromadb` | 1.0.12 | ICD-10 vector index |
| `sentence-transformers` | 3.4.1 | `all-MiniLM-L6-v2` embeddings |
| `sqlalchemy` | 2.0.36 | Async ORM |
| `asyncpg` | 0.30.0 | PostgreSQL async driver |
| `pydantic` | 2.11.7 | Request/response validation |
| `supabase` | 2.10.0 | Supabase Python client |

### Frontend
| Package | Purpose |
|---|---|
| React 19 + TypeScript | UI framework |
| Vite | Build tool + dev server |
| Tailwind CSS 4 | Utility-first styling |
| MediaRecorder API | Live audio recording |

### Infrastructure
| Service | Role |
|---|---|
| Supabase | PostgreSQL database + auth-ready |
| Railway | Backend hosting (Docker) |
| Vercel | Frontend hosting |

---

## 📁 Project Structure

```
clinicaldoc_AI/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app, CORS, lifespan startup
│   │   ├── core/
│   │   │   ├── config.py            # pydantic-settings reads .env
│   │   │   └── database.py          # SQLAlchemy async engine → Supabase
│   │   ├── models/
│   │   │   ├── schemas.py           # Pydantic request/response models
│   │   │   └── db_models.py         # SQLAlchemy ORM table definitions
│   │   ├── api/routes/
│   │   │   ├── encounters.py        # All encounter endpoints
│   │   │   └── icd.py               # ICD search endpoint
│   │   └── services/
│   │       ├── transcription.py     # faster-whisper audio → text
│   │       ├── soap_generator.py    # gpt-4o-mini → SOAP note
│   │       ├── icd_service.py       # ChromaDB + gpt-4o-mini rerank
│   │       └── summary_service.py   # gpt-4o-mini → visit summary
│   ├── scripts/
│   │   ├── download_icd10.py        # One-time: fetch ~72k CMS codes
│   │   └── build_icd_index.py       # One-time: embed into ChromaDB
│   ├── data/icd10/
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── App.tsx                  # Root layout + state machine
│       ├── components/
│       │   ├── AudioUpload.tsx      # 3-tab input: upload | record | paste
│       │   ├── SOAPNoteEditor.tsx   # 4 editable sections + confidence badges
│       │   ├── ICDSuggestions.tsx   # Checkboxes + inline ICD search
│       │   ├── VisitSummary.tsx     # Summary + follow-up list
│       │   └── EncounterList.tsx    # Sidebar: past encounters
│       ├── services/api.ts          # Typed fetch wrappers
│       └── types/index.ts           # TypeScript interfaces
│
├── DEMO.md
├── phases.md
└── railway.toml
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.12
- Node.js 18+
- [ffmpeg](https://ffmpeg.org/download.html) (`brew install ffmpeg` on macOS)
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key

### 1. Clone the repo

```bash
git clone https://github.com/rishi-2399/clinicaldoc_AI
cd clinicaldoc_AI
```

### 2. Backend setup

```bash
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in your `.env`:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.your-project-id.supabase.co:5432/postgres
FRONTEND_ORIGIN=http://localhost:5173
```

### 3. Create database tables

Run the following SQL in your **Supabase SQL Editor**:

```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  encounter_date TIMESTAMPTZ DEFAULT now(),
  transcript TEXT NOT NULL,
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE icd_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT,
  rationale TEXT,
  approved BOOLEAN DEFAULT true
);

CREATE TABLE visit_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID UNIQUE REFERENCES encounters(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  follow_ups JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. Build the ICD-10 index *(one-time, ~5–10 min)*

```bash
python scripts/download_icd10.py    # downloads ~72k CMS codes
python scripts/build_icd_index.py   # builds ChromaDB vector index
```

### 5. Run the backend

```bash
uvicorn app.main:app --port 8000 --reload
```

### 6. Run the frontend

```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/encounter/transcript` | Process text transcript → full note |
| `POST` | `/api/encounter/audio` | Transcribe audio → run full pipeline |
| `GET` | `/api/encounters` | List all encounters (paginated) |
| `GET` | `/api/encounters/{id}` | Retrieve a single encounter |
| `PATCH` | `/api/encounters/{id}/soap` | Save clinician edits to SOAP note |
| `PATCH` | `/api/encounters/{id}/icd` | Approve or reject ICD codes |
| `DELETE` | `/api/encounters/{id}` | Delete encounter and all related records |
| `GET` | `/api/icd/search?q=&n=` | Fast vector ICD-10 search (no LLM) |

---

## 🗄️ Database Schema

```
patients              encounters              soap_notes
──────────────        ──────────────────      ──────────────────────
id          uuid  ←── patient_id    uuid      id              uuid
name        text      id            uuid  ←── encounter_id   uuid (unique)
date_of_birth date    transcript    text      subjective      text
created_at  tstz      encounter_date tstz     objective       text
                      processing_ms  int      assessment      text
                      created_at     tstz     plan            text
                                              *_confidence    float
                                              finalized       bool

icd_codes                       visit_summaries
──────────────────────          ───────────────────────
id              uuid            id              uuid
encounter_id    uuid  ──┐       encounter_id    uuid (unique)
code            text    │       summary         text
description     text    │       follow_ups      jsonb
confidence      float   │       updated_at      tstz
rationale       text    │
approved        bool    │
                        └── both FK → encounters(id)
```

---

## 🚢 Deployment

### Backend — Railway

1. Push the repo to GitHub
2. Create a new Railway service pointed at the `backend/` directory
3. Set environment variables in the Railway dashboard (same as `.env`)
4. Add a release command to build the ICD-10 index on first deploy:
   ```
   python scripts/build_icd_index.py
   ```
5. Update `FRONTEND_ORIGIN` once Vercel URL is known

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

### Frontend — Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set build settings:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app`
4. Update `FRONTEND_ORIGIN` in Railway with the Vercel deployment URL

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by [rishi-2399](https://github.com/rishi-2399)

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1f6feb,100:388bfd&height=100&section=footer" width="100%" />

</div>
