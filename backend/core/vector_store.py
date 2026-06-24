import chromadb
from chromadb.config import Settings
from core.config import settings

# Initialize ChromaDB client.
# Persistent client stores data locally on disk (acting as our vector DB MVP)
client = chromadb.PersistentClient(
    path=settings.CHROMA_DB_DIR,
    settings=Settings(allow_reset=True)
)

# Get or create the collection for storing news article embeddings.
# using cosine similarity as the distance metric (best for SentenceTransformers)
collection = client.get_or_create_collection(
    name="news_articles",
    metadata={"hnsw:space": "cosine"}
)

def get_vector_store():
    """Returns the ChromaDB collection instance"""
    return collection

def insert_embedding(article_id: str, embedding: list[float], metadata: dict):
    """Upsert an article's embedding and metadata into ChromaDB"""
    collection.upsert(
        ids=[str(article_id)],
        embeddings=[embedding],
        metadatas=[metadata]
    )

def search_similar_articles(embedding: list[float], n_results: int = 3, min_similarity: float = 0.5):
    """
    Query ChromaDB for the closest vectors.
    Returns a list of dicts with id, metadata, and distance metrics.
    Note: ChromaDB returns distance (0 is exact match for cosine).
    Similarity score is calculated as (1 - distance).
    """
    results = collection.query(
        query_embeddings=[embedding],
        n_results=n_results
    )
    
    similar_articles = []
    if not results['ids'] or not results['ids'][0]:
        return similar_articles
        
    for i in range(len(results['ids'][0])):
        dist = results['distances'][0][i]
        sim_score = 1.0 - dist
        
        # Filter out bad matches based on threshold
        if sim_score >= min_similarity:
            similar_articles.append({
                "id": results['ids'][0][i],
                "metadata": results['metadatas'][0][i],
                "score": sim_score
            })
            
    return similar_articles
