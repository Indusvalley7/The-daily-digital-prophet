import requests
import json
from core.config import settings

def generate_summary(article_text: str, context_articles: list[dict]) -> str:
    """
    Calls the local Ollama LLM to generate a short, newspaper-style summary.
    Uses retrieved context to enrich the summary but avoids overriding the main article facts.
    """
    
    # 1. Format the Context
    context_text = ""
    if context_articles:
        context_text = "Related past events for context:\n\n"
        for idx, ctx in enumerate(context_articles):
            title = ctx['metadata'].get('title', 'Unknown Title')
            # Extract the stored summary fragment from metadata if available
            summary = ctx['metadata'].get('summary_excerpt', '')
            context_text += f"[{idx+1}] {title}:\n{summary}\n\n"

    # 2. Build the precise Prompt
    prompt = f"""You are an expert news editor for the "Daily News Digest", a classic newspaper.
Your task is to write a concise, compelling, and neutral summary of a new article.

{context_text}---
CURRENT ARTICLE TO SUMMARIZE:
{article_text}
---

INSTRUCTIONS:
1. Write a single short paragraph (3-4 sentences maximum).
2. Adopt a serious, classic newspaper tone (e.g., Reuters, BBC).
3. Focus purely on the facts presented in the CURRENT ARTICLE.
4. If "Related past events" are provided, you may briefly weave that context in (e.g., "following last month's developments") but DO NOT invent facts or let the past events overshadow the current news.
5. Do not include introductory phrases like "Here is a summary" or "This article discusses". Start reporting the news immediately.

YOUR SUMMARY:"""

    # 3. Call the LLM
    if settings.LLM_PROVIDER == "ollama":
        return _call_ollama(prompt)
    elif settings.LLM_PROVIDER == "groq":
        return _call_groq(prompt)
    else:
        return "LLM integration error: Provider not supported or configured."

def _call_groq(prompt: str) -> str:
    """Internal helper to communicate with the Groq Cloud API (Llama-3)."""
    try:
        from groq import Groq
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert news editor. Your output must instantly start with the news summary paragraph. No conversational filler.",
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.2,
            max_tokens=256,
        )
        return chat_completion.choices[0].message.content.strip()
    except ImportError:
        return "LLM Error: groq python package not installed. Run 'pip install groq'."
    except Exception as e:
        print(f"Error calling Groq API: {e}")
        return "Summary could not be generated at this time. Please read the full article for details."

def _call_ollama(prompt: str) -> str:
    """Internal helper to communicate with the local Ollama daemon."""
    url = f"{settings.OLLAMA_BASE_URL}/api/generate"
    
    payload = {
        "model": settings.LLM_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2, # Low temp for factual reporting
            "top_p": 0.9
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "Summary could not be generated at this time. Please read the full article for details."
