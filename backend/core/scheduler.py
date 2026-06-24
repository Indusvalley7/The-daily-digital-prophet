from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
from database import get_supabase
from ingestion.pipeline import process_all_feeds

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_daily_ingestion():
    """
    Clears the database and runs the ingestion pipeline.
    This corresponds to the logic in wipe_and_ingest.py.
    """
    logger.info("Starting scheduled daily news refresh...")
    try:
        supabase = get_supabase()
        
        # 1. Clear existing data
        logger.info("Clearing existing articles from Supabase...")
        supabase.table("article_context").delete().neq("similarity_score", -999).execute()
        supabase.table("articles").delete().neq("url", "impossible").execute()
        
        # 2. Run ingestion
        logger.info("Running ingestion pipeline for all feeds...")
        results = process_all_feeds()
        logger.info(f"Daily refresh complete. Results: {results}")
        
    except Exception as e:
        logger.error(f"Scheduled ingestion failed: {str(e)}")

# Initialize the scheduler
scheduler = BackgroundScheduler()

def start_scheduler():
    """
    Configures and starts the background scheduler.
    """
    # Schedule the job for 6:00 AM daily
    trigger = CronTrigger(hour=6, minute=0)
    scheduler.add_job(
        run_daily_ingestion,
        trigger=trigger,
        id="daily_news_refresh",
        name="Daily 6AM News Refresh",
        replace_existing=True
    )
    
    scheduler.start()
    logger.info("Background scheduler started. Daily news refresh job scheduled for 06:00:00.")

def shutdown_scheduler():
    """
    Shuts down the scheduler.
    """
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background scheduler shut down.")
