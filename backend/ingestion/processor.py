import re
from bs4 import BeautifulSoup

def clean_html(raw_html: str) -> str:
    """
    Removes HTML tags and returns plain text.
    Essential because LLMs and embedders prefer clean text over raw HTML markup.
    """
    if not raw_html:
        return ""
    
    # Use BeautifulSoup as it handles broken HTML better than regex
    soup = BeautifulSoup(raw_html, "html.parser")
    text = soup.get_text(separator=' ')
    
    # Collapse multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def truncate_for_embedding(text: str, max_words: int = 250) -> str:
    """
    Truncates text to ensure it fits within typical embedding context windows
    and avoids wasting LLM tokens on overly long fluff.
    """
    words = text.split()
    if len(words) > max_words:
        return ' '.join(words[:max_words]) + "..."
    return text

def is_quality_article(article: dict) -> bool:
    """
    Simple heuristics to skip bad/malformed articles.
    """
    if not article.get('title') or not article.get('url'):
        return False
        
    cleaned_content = clean_html(article.get('content', ''))
    
    # We lowered the word count requirement to 0 because some feeds (like NYT Sports) 
    # sometimes only provide a title and no description in their RSS payload.
    # The Llama-3 model can still generate a summary from just the title.
    if len(cleaned_content.split()) < 0:
        return False
        
    return True
