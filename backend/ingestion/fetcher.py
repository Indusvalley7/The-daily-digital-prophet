"""
This module handles fetching and processing RSS feeds.
"""
import feedparser
from datetime import datetime
from email.utils import parsedate_to_datetime

# Specific RSS feeds mapped to the 4 newspaper sections
FEEDS = [
    {"url": "http://feeds.bbci.co.uk/news/world/rss.xml", "category": "Front Page", "source": "BBC News"},
    {"url": "http://feeds.bbci.co.uk/news/technology/rss.xml", "category": "Technology & AI", "source": "BBC News"},
    {"url": "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "category": "Culture", "source": "BBC News"},
    {"url": "http://feeds.bbci.co.uk/news/science_and_environment/rss.xml", "category": "Environment", "source": "BBC News"}
]
# Note for Sports: BBC Sports feeds use a slightly different URL structure, so using Science/Environment or another clear category helps maintain consistency for the MVP. Let's stick with the classic 4 BBC feeds that map cleanly. We'll rename them to exactly match the requested genres.

FEEDS = [
    {"url": "http://feeds.bbci.co.uk/news/world/rss.xml", "category": "Front Page", "source": "BBC News"},
    {"url": "http://feeds.bbci.co.uk/news/technology/rss.xml", "category": "AI", "source": "BBC News"},
    {"url": "http://feeds.bbci.co.uk/sport/rss.xml", "category": "Sports", "source": "BBC Sport"},
    {"url": "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml", "category": "Culture", "source": "BBC News"},
]

def fetch_articles_from_feeds():
    """
    Downloads articles from the configured RSS feeds.
    Returns a raw list of article dictionaries.
    """
    raw_articles = []
    
    for feed in FEEDS:
        try:
            parsed = feedparser.parse(feed["url"])
            if parsed.bozo:
                print(f"Warning: Issue parsing feed {feed['url']}")
                continue
                
            for entry in parsed.entries[:6]:  # Limit increased to 6 per feed to fill the newspaper UI
                # Extract image if available (media_content or enclosures)
                image_url = None
                if 'media_content' in entry and len(entry.media_content) > 0:
                    image_url = entry.media_content[0].get('url')
                elif 'enclosures' in entry and len(entry.enclosures) > 0:
                    image_url = entry.enclosures[0].get('href')

                # Parse date
                pub_date = datetime.utcnow()
                if 'published' in entry:
                    try:
                        pub_date = parsedate_to_datetime(entry.published)
                    except Exception:
                        pass
                
                raw_articles.append({
                    "title": entry.title,
                    "url": entry.link,
                    "source": feed["source"],
                    "category": feed["category"],
                    "published_at": pub_date.isoformat(),
                    "image_url": image_url,
                    # RSS usually provides a summary or description, not full content.
                    # For MVP, we use the description as the base content.
                    "content": entry.get('description', '') or entry.get('summary', '')
                })
        except Exception as e:
            print(f"Error fetching feed {feed['url']}: {str(e)}")
            
    return raw_articles
