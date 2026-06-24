from supabase import create_client, Client
from core.config import settings

# Initialize the Supabase client
# The client is created only if the URL and KEY are provided in the environment/config
supabase: Client | None = None

if settings.SUPABASE_URL and settings.SUPABASE_KEY:
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
else:
    print("WARNING: SUPABASE_URL or SUPABASE_KEY not found in environment. Database connection will fail.")

def get_supabase() -> Client:
    """Dependency injection friendly accessor for the Supabase client."""
    if not supabase:
        raise Exception("Supabase client is not initialized.")
    return supabase
