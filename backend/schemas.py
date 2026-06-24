from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from datetime import datetime
from uuid import UUID

# -----------------
# Article Models
# -----------------

class ArticleBase(BaseModel):
    title: str
    source: str
    url: str
    category: str
    published_at: datetime
    image_url: Optional[str] = None
    summary: Optional[str] = None

class ArticleListResponse(ArticleBase):
    id: UUID
    created_at: datetime

class RelatedArticle(BaseModel):
    id: UUID
    title: str
    url: str
    similarity_score: float

class ArticleDetailResponse(ArticleListResponse):
    content: str  # Full content included in detail view
    related_articles: List[RelatedArticle] = []

# -----------------
# Ingestion Models
# -----------------

class IngestionRunResponse(BaseModel):
    status: str
    articles_processed: int
    articles_added: int
    errors: int
    message: str
