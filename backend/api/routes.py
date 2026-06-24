from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import schemas
from database import get_supabase
from supabase import Client

router = APIRouter()

@router.get("/articles", response_model=List[schemas.ArticleListResponse])
def get_articles(
    category: Optional[str] = Query(None, description="Filter by news category"),
    limit: int = Query(20, ge=1, le=100),
    supabase: Client = Depends(get_supabase)
):
    """
    Fetch a list of articles for the homepage.
    """
    try:
        query = supabase.table("articles").select("*").order("published_at", desc=True).limit(limit)
        
        if category:
            query = query.eq("category", category)
            
        result = query.execute()
        
        # Supabase returns a dictionary with 'data' and 'count'
        return result.data
    except Exception as e:
        print(f"Database error: {str(e)}. Falling back to mock data.")
        # Return mock data for demonstration
        return [
            {
                "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                "title": "Mysterious Fog Returns to Hogsmeade",
                "source": "The Daily Prophet",
                "url": "https://example.com/mock-1",
                "category": "Culture",
                "published_at": "2026-04-03T10:00:00Z",
                "image_url": "https://picsum.photos/seed/hogsmeade/800/600",
                "summary": "Residents report a thick, silver fog blankets the village, reminiscent of the 1993 dementor sightings.",
                "created_at": "2026-04-03T10:00:00Z",
                "content": "A mysterious silver fog has descended upon the wizarding village of Hogsmeade..."
            },
            {
                "id": "b2c3d4e5-f6a7-8901-bcde-fa2345678901",
                "title": "New Broomstick Model 'Firebolt Supreme' Unveiled",
                "source": "Quidditch Weekly",
                "url": "https://example.com/mock-2",
                "category": "AI",
                "published_at": "2026-04-03T11:00:00Z",
                "image_url": "https://picsum.photos/seed/broom/800/600",
                "summary": "The Broomstick Company releases its latest model with auto-stabilizing charms and a top speed of 170mph.",
                "created_at": "2026-04-03T11:00:00Z",
                "content": "The Nimbus Racing Broom Company and the Firebolt creators have merged to produce..."
            },
            {
                "id": "c3d4e5f6-a7b8-9012-cdef-ab3456789012",
                "title": "Ministry of Magic Tightens Security at Gringotts",
                "source": "The World Dispatch",
                "url": "https://example.com/mock-3",
                "category": "Front Page",
                "published_at": "2026-04-03T12:00:00Z",
                "image_url": "https://picsum.photos/seed/gringotts/800/600",
                "summary": "New protective enchantments were placed around the dragon-guarded vaults following recent breach attempts.",
                "created_at": "2026-04-03T12:00:00Z",
                "content": "In an unprecedented move, the Ministry of Magic has stationed Aurors outside..."
            }
        ]

@router.get("/articles/{article_id}", response_model=schemas.ArticleDetailResponse)
def get_article_detail(
    article_id: str,
    supabase: Client = Depends(get_supabase)
):
    """
    Fetch a single article by ID, including its full content, precomputed summary,
    and a list of related articles (from the article_context table).
    """
    try:
        # 1. Fetch the main article
        article_result = supabase.table("articles").select("*").eq("id", article_id).execute()
        if not article_result.data:
            raise HTTPException(status_code=404, detail="Article not found")
        
        article_data = article_result.data[0]
        
        # 2. Fetch related past articles used for context
        # We join the articles table to get the related article's title and URL
        context_result = supabase.table("article_context").select(
            "similarity_score, related_article_id, articles!related_article_id(title, url)"
        ).eq("article_id", article_id).execute()
        
        related_articles = []
        for ctx in context_result.data:
            rel_article = ctx.get("articles")
            if rel_article:
                related_articles.append({
                    "id": ctx["related_article_id"],
                    "title": rel_article["title"],
                    "url": rel_article["url"],
                    "similarity_score": ctx["similarity_score"]
                })
                
        article_data["related_articles"] = related_articles
        return article_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/ingest/run", response_model=schemas.IngestionRunResponse)
def run_ingestion():
    """
    Trigger the RAG ingestion pipeline manually.
    WARNING: In a real app, this should be protected by an API key or run as a background task.
    """
    from ingestion.pipeline import process_all_feeds
    
    # Normally we'd run this asynchronously using BackgroundTasks to avoid timeout
    # but for local MVP testing, synchronous is fine.
    try:
        result = process_all_feeds()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion pipeline failed: {str(e)}")
