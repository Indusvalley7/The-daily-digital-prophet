# The World Dispatch 🗞️

The World Dispatch is an AI-powered, fully autonomous digital newspaper. It fetches the latest global news, processes it through a sophisticated RAG (Retrieval-Augmented Generation) pipeline using Llama-3, and presents it in an immersive, interactive 3D newspaper interface.

<img width="2928" height="1568" alt="image" src="https://github.com/user-attachments/assets/6f134641-2224-42bb-b7b9-dd4d6fc9d4a9" />


## 🌟 Features

- **Interactive 3D Interface**: Built with Three.js, experience reading the news as if holding a physical newspaper with real-time page-turning gestures.
- **AI News Summarization**: Powered by Groq and Llama-3, articles are autonomously summarized into concise, editorial-style "dispatches".
- **Semantic Search & RAG**: Uses ChromaDB to understand the context of news, linking current events to past stories.
- **Automated Ingestion**: A daily APScheduler job fetches fresh news every morning at 6 AM.
- **Split Architecture Deployment**: 
  - Frontend hosted on Vercel for lightning-fast static delivery.
  - Backend hosted on Railway to support long-running Python jobs without sleeping.

## 🛠️ Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | HTML5, Vanilla JS, Three.js, MediaPipe (Gestures) |
| **Backend** | Python, FastAPI, APScheduler |
| **Database** | Supabase (PostgreSQL) |
| **Vector DB** | ChromaDB |
| **AI / LLM** | Groq, Llama-3-8b-instant |

## 🚀 Live Application

- **Frontend**: [https://the-daily-digital-prophet.vercel.app](https://the-daily-digital-prophet.vercel.app)
- **Backend API**: [https://the-daily-digital-prophet-production.up.railway.app](https://the-daily-digital-prophet-production.up.railway.app)

## 💻 Local Development

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your `.env` file based on `.env.example`.
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup

The frontend is a static site. You can use any static file server:

```bash
# Using Python's built-in HTTP server
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser. Note: Make sure `API_BASE_URL` in `index.html` points to your local backend (`http://localhost:8000`) for development.

## 🏗️ Architecture details
For a detailed breakdown of the DevOps pipeline and system architecture, check out [newsapp.md](newsapp.md).
