from database import get_supabase
from ingestion.pipeline import process_all_feeds
from core.vector_store import client as chroma_client

print("Connecting to Supabase...")
supabase = get_supabase()

print("Deleting all existing articles to reset categories...")
try:
    # Delete all articles by filtering out an impossible URL
    # This deletes everything because every article will have a URL != "impossible"
    supabase.table("article_context").delete().neq("similarity_score", -999).execute()
    supabase.table("articles").delete().neq("url", "impossible").execute()
    print("Database cleared.")
except Exception as e:
    print(f"Error clearing database: {e}")

print("Running ingestion pipeline to fetch Front Page, AI, Sports, Culture...")
results = process_all_feeds()
print(results)
