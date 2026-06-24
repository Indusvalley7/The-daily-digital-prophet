# The World Dispatch — App Architecture & DevOps Guide

## What Is This App?

**The World Dispatch** is an AI-powered newspaper. Every day at 6 AM it automatically fetches real news from RSS feeds, runs the articles through an AI pipeline that generates newspaper-style summaries, and serves them in a beautiful 3D interactive newspaper UI.

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│   index.html + spreads.js + gestures.js                        │
│   (3D WebGL newspaper rendered with Three.js)                  │
│              │                                                  │
│              │  HTTP fetch("http://localhost:8000/articles")    │
└──────────────┼──────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (Python)                    │
│                    backend/main.py on port 8000                │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │  API Routes │    │  Scheduler   │    │ Ingestion        │   │
│  │  /articles  │    │  (6AM daily) │───▶│ Pipeline         │   │
│  │  /articles/ │    │  APScheduler │    │ fetcher.py       │   │
│  │  {id}       │    └──────────────┘    │ processor.py     │   │
│  └──────┬──────┘                        │ pipeline.py      │   │
│         │                               └──────────────────┘   │
└─────────┼──────────────────────────────────────────────────────┘
          │
          ├──────────────────────────────────────────────────────▶
          │                                                    Groq Cloud API
          │                                                    (LLM: Llama-3)
          │
    ┌─────┴──────────────────────────────────┐
    │              DATA LAYER                 │
    │                                         │
    │  ┌──────────────┐  ┌────────────────┐  │
    │  │   Supabase   │  │   ChromaDB     │  │
    │  │  (Postgres)  │  │ (Vector Store) │  │
    │  │              │  │                │  │
    │  │  articles    │  │ news_articles  │  │
    │  │  article_    │  │  collection    │  │
    │  │  context     │  │  (local disk)  │  │
    │  └──────────────┘  └────────────────┘  │
    └─────────────────────────────────────────┘
```

---

## The RAG Pipeline — How AI Summaries Are Made

**RAG = Retrieval-Augmented Generation.** This is the smart part of your app. Here's the step-by-step flow that runs every time a new article comes in:

```
RSS Feed  ──▶  Fetch article text (fetcher.py)
                     │
                     ▼
              Clean HTML, filter low-quality (processor.py)
                     │
                     ▼
              Convert text to embedding vector
              using SentenceTransformer (all-MiniLM-L6-v2)
                     │
                     ├──▶ Query ChromaDB for similar past articles
                     │          │
                     │          ▼
                     │    "Here are 3 related past stories
                     │     for context..."
                     │
                     ▼
              Send article + context to Groq (Llama-3)
                     │
                     ▼
              AI writes a newspaper-style summary
                     │
                     ├──▶ Save article + summary to Supabase
                     └──▶ Save embedding to ChromaDB
```

**In plain English:** When a new article arrives, the app first finds similar articles it already knows about (using ChromaDB), then gives those to the AI as context so the summary can say things like *"following last week's developments..."* — making it more journalistic and less generic.

---

## Component Breakdown

### 1. Frontend (`index.html`, `spreads.js`, `gestures.js`)

| File | Purpose |
|------|---------|
| `index.html` | All CSS + HTML structure + main JS logic |
| `spreads.js` | Defines each newspaper page's content layout |
| `gestures.js` | MediaPipe hand gesture control (wave to flip pages) |
| `hero.png` | The newspaper hero image |

**Tech stack:** Vanilla HTML/CSS/JS + Three.js (3D rendering) + MediaPipe (hand tracking)

The frontend fetches articles from the backend on load and fills the newspaper pages dynamically.

### 2. Backend (`backend/`)

| File/Folder | Purpose |
|-------------|---------|
| `main.py` | FastAPI app entry point, CORS config, lifecycle hooks |
| `api/routes.py` | API endpoints (`/articles`, `/articles/{id}`, `/ingest/run`) |
| `core/config.py` | Reads environment variables from `.env` |
| `core/scheduler.py` | APScheduler — runs the ingestion pipeline at 6AM daily |
| `core/llm.py` | Calls Groq (Llama-3) or Ollama to generate summaries |
| `core/vector_store.py` | ChromaDB wrapper — stores and queries article embeddings |
| `database.py` | Supabase client setup |
| `ingestion/fetcher.py` | Fetches RSS feeds and extracts article data |
| `ingestion/processor.py` | Cleans HTML, checks article quality |
| `ingestion/pipeline.py` | Orchestrates the full RAG pipeline for each article |

### 3. Supabase (Cloud PostgreSQL)

**What it stores:** Structured article data
```sql
articles         → id, title, source, url, category, published_at,
                   image_url, content, summary
article_context  → article_id, related_article_id, similarity_score
```

Already cloud-hosted — works identically locally and in production. ✅

### 4. ChromaDB (Local Vector Database)

**What it stores:** Numerical "embeddings" (vectors) that represent the meaning of each article. Used to find similar articles during the RAG pipeline.

**⚠️ ChromaDB Problem for Deployment:**
ChromaDB is configured as `PersistentClient` storing data to `./chroma_data/` on disk. This works perfectly on your laptop, but in the cloud:
- Every deploy **wipes the disk** (ephemeral filesystem)
- The RAG "find similar past articles" step silently returns nothing

**What this means practically:**
- Articles are still fetched ✅
- Articles are still summarized by Groq ✅
- Summaries just won't have past-context enrichment (degrades gracefully)
- ChromaDB rebuilds from scratch on each server restart

**Decision:** For the initial deployment, ChromaDB still works — it just loses its memory on restart. The app functions correctly. A future upgrade would replace it with a hosted vector DB like [Pinecone](https://pinecone.io) or [Qdrant Cloud](https://qdrant.tech).

---

## Deployment Architecture

```
GitHub Repo (source of truth)
     │
     ├──── Vercel watches this ──▶  Deploys FRONTEND automatically
     │     (Static HTML hosting)    on every git push to main
     │
     └──── Railway watches this ──▶ Deploys BACKEND automatically
           (Python server hosting)   on every git push to main
```

### Why Railway (not Render)?

| | Railway | Render (free tier) |
|--|---------|--------|
| Server sleep | ❌ Never sleeps | ⚠️ Sleeps after 15 min idle |
| Free tier | $5/month credit (~free for small apps) | Free but unreliable for schedulers |
| Python support | ✅ Full long-running server | ✅ Full |
| Auto-deploy from GitHub | ✅ | ✅ |

**Railway is the right choice here** because your APScheduler fires at 6AM daily — that job will never run if the server is asleep (Render free tier behaviour).

---

## Environment Variables — Where Secrets Live

| Variable | Local (`.env`) | Production (Railway dashboard) |
|----------|----------------|-------------------------------|
| `SUPABASE_URL` | ✅ | Add manually in Railway |
| `SUPABASE_KEY` | ✅ | Add manually in Railway |
| `GROQ_API_KEY` | ✅ | Add manually in Railway |
| `LLM_PROVIDER` | ✅ | Add manually in Railway |
| `LLM_MODEL` | ✅ | Add manually in Railway |
| `CHROMA_DB_DIR` | ✅ | Add manually in Railway |

**Golden rule of DevOps:** Secrets never go in code or GitHub. They live in environment dashboards. The `.env` file is only for local development and must be in `.gitignore`.

---

## Files To Create/Modify For Deployment

| File | Action | Why |
|------|--------|-----|
| `.gitignore` | **CREATE** | Exclude `.env`, `venv/`, `chroma_data/`, `node_modules/` from GitHub |
| `vercel.json` | **CREATE** | Tell Vercel the entry point is `index.html` |
| `railway.toml` | **CREATE** | Tell Railway the start command and working directory |
| `index.html` | **MODIFY** | Change API URL from `localhost:8000` → Railway production URL |
| `backend/main.py` | **MODIFY** | Add Vercel URL to CORS allowed origins |
| `backend/.env` | **MODIFY** | Fix the stray bare API key on line 20 (will cause parse error) |

---

## Step-by-Step Deployment Order

### Step 1 — Git Setup
```bash
git init
git add .
git commit -m "feat: initial commit — The World Dispatch"
```

### Step 2 — Push to GitHub
```bash
# First create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/news-app.git
git push -u origin main
```

### Step 3 — Deploy Frontend to Vercel
1. Go to [vercel.com](https://vercel.com) → Add New → Project
2. Import your GitHub repo
3. Framework preset: **Other**
4. Root directory: `/` (project root, not `/backend`)
5. Deploy → Get URL: `https://news-app-xyz.vercel.app`

### Step 4 — Deploy Backend to Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Select your repo → set root directory to `backend/`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all env variables from your `.env` file
5. Deploy → Get URL: `https://news-app-xyz.up.railway.app`

### Step 5 — Wire Frontend → Backend
1. Update `index.html` API URL to the Railway URL
2. Add the Vercel URL to `backend/main.py` CORS list
3. `git push` → both Vercel and Railway auto-redeploy ✅
