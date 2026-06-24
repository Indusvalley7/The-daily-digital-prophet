# Daily News Digest - RAG Backend MVP

This backend powers the Daily News Digest newspaper app. It automatically fetches news articles, generates embeddings via `sentence-transformers`, retrieves similar past articles from `ChromaDB`, and summarizes the news using a classical newspaper tone via an LLM (`Ollama` / `Mistral`). It serves this processed data via a lightweight FastAPI server.

## 1. Prerequisites

- Python 3.10+
- [Ollama](https://ollama.com/) installed locally (we use the `mistral` model by default).
- A [Supabase](https://supabase.com/) project.

## 2. Supabase Setup (Database)

In your Supabase project's SQL Editor, run the following to create the necessary tables:

```sql
-- Create the articles table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    source TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    image_url TEXT,
    content TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the context mapping table
CREATE TABLE article_context (
    id SERIAL PRIMARY KEY,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    related_article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    similarity_score FLOAT NOT NULL
);
```

## 3. Local Setup

1. **Install Dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   Rename `.env.example` to `.env` and fill in your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_KEY=your-anon-key
   ```

3. **Start Ollama**
   Ensure Ollama is running and has the mistral model pulled:
   ```bash
   ollama pull mistral
   ollama run mistral
   ```

4. **Run the FastAPI Server**
   ```bash
   uvicorn main:app --reload --port 8000
   ```

## 4. How to use the API

### Trigger Ingestion (RAG Pipeline)
To fetch new articles and run them through the RAG summarization pipeline:
```bash
POST http://localhost:8000/ingest/run
```
*Note: The first run involves downloading the `all-MiniLM-L6-v2` embedding model (~80MB) and initializing ChromaDB locally.*

### Fetch Articles (Frontend)
Get the latest articles for the homepage:
```bash
GET http://localhost:8000/articles?limit=20
```

Get a single article with its summary and related context:
```bash
GET http://localhost:8000/articles/{uuid}
```

## 5. Connecting the React Frontend

In your frontend code, you can fetch data like this:

```javascript
// Fetch latest articles for the homepage
const fetchArticles = async () => {
    const res = await fetch('http://localhost:8000/articles');
    const data = await res.json();
    // Use data to populate your article cards...
}

// Fetch article details (including summary and related articles)
const fetchDetails = async (id) => {
    const res = await fetch(`http://localhost:8000/articles/${id}`);
    const data = await res.json();
    
    // Display data.summary in your beautiful newspaper layout
    // Display data.related_articles as "Read further..." links
}
```

## 6. Going to Production

When you are ready to move beyond this MVP:
1. **Hosting**: Deploy this FastAPI app to **Render** or **Railway**. 
2. **Cron Jobs**: Don't trigger `/ingest/run` manually. Setup a cron job (e.g., GitHub Actions, or Render Cron) to hit that endpoint every hour.
3. **Security**: Add API Key authentication to the `/ingest/run` endpoint to prevent public abuse.
4. **LLM**: Swap the local Ollama provider for the official Mistral API or OpenAI API by changing `core/llm.py` and adding an API key to the `.env` file.
