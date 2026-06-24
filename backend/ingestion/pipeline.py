import os
from sentence_transformers import SentenceTransformer
from database import get_supabase
from core.vector_store import insert_embedding, search_similar_articles
from core.llm import generate_summary
from ingestion.fetcher import fetch_articles_from_feeds
from ingestion.processor import clean_html, truncate_for_embedding, is_quality_article

# Load the SentenceTransformer model (done once at startup to save time)
try:
    print("Loading SentenceTransformer model...")
    embedder = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"Error loading embedding model: {e}")
    embedder = None

def process_article(article_data: dict, supabase):
    """
    The core RAG pipeline for a single article.
    1. Clean and Deduplicate
    2. Embed
    3. Retrieve context
    4. Generate Summary
    5. Save everything
    """
    url = article_data['url']
    
    # --- 1. Deduplication Check ---
    # Check if this article already exists in the SQL DB
    existing = supabase.table("articles").select("id").eq("url", url).execute()
    if existing.data:
        return {"status": "skipped", "reason": "Already exists"}

    # --- 2. Clean and Prepare Text ---
    cleaned_content = clean_html(article_data['content'])
    if not cleaned_content:
        cleaned_content = article_data['title']

    # --- 3. Generate Embedding ---
    if not embedder:
        return {"status": "error", "reason": "Embedder model not loaded"}
        
    text_to_embed = f"Title: {article_data['title']}\n\n{truncate_for_embedding(cleaned_content)}"
    embedding = embedder.encode(text_to_embed).tolist()

    # --- 4. RAG: Retrieve Similar Past Articles ---
    # We query ChromaDB for articles similar to the one we are ingesting right now
    context_articles = search_similar_articles(embedding, n_results=3, min_similarity=0.4)

    # --- 5. RAG: Generate Summary ---
    summary = generate_summary(cleaned_content, context_articles)

    # --- 6. Save to Supabase (Relational DB) ---
    article_record = {
        "title": article_data['title'],
        "source": article_data['source'],
        "url": url,
        "category": article_data['category'],
        "published_at": article_data['published_at'],
        "image_url": article_data['image_url'],
        "content": cleaned_content,
        "summary": summary
    }
    
    # Insert primary article
    insert_res = supabase.table("articles").insert(article_record).execute()
    if not insert_res.data:
        return {"status": "error", "reason": "Failed to insert into articles table"}
    
    new_article_id = insert_res.data[0]['id']

    # Save relationship context
    if context_articles:
        context_records = []
        for ctx in context_articles:
            # Prevent storing relationships to itself, though highly unlikely here
            if str(ctx['id']) != str(new_article_id):
                context_records.append({
                    "article_id": new_article_id,
                    "related_article_id": ctx['id'],
                    "similarity_score": ctx['score']
                })
        if context_records:
            supabase.table("article_context").insert(context_records).execute()

    # --- 7. Save to ChromaDB (Vector DB) ---
    metadata = {
        "title": article_data['title'],
        "category": article_data['category'],
        "published_at": article_data['published_at'],
        "summary_excerpt": summary[:200] + "..." if len(summary) > 200 else summary
    }
    insert_embedding(str(new_article_id), embedding, metadata)

    return {"status": "added", "id": new_article_id}

def process_all_feeds():
    """
    Master function to fetch, process, and store all incoming articles.
    """
    supabase = get_supabase()
    raw_articles = fetch_articles_from_feeds()
    
    results = {
        "status": "success",
        "articles_processed": 0,
        "articles_added": 0,
        "errors": 0,
        "message": ""
    }
    
    for item in raw_articles:
        if not is_quality_article(item):
            continue
            
        results["articles_processed"] += 1
        try:
            res = process_article(item, supabase)
            if res["status"] == "added":
                results["articles_added"] += 1
        except Exception as e:
            print(f"Failed processing article {item.get('title')}: {e}")
            results["errors"] += 1
            
    results["message"] = f"Processed {results['articles_processed']} articles. Added {results['articles_added']} new ones."
    return results
