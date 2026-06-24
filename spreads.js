// Global array to store fetched articles
let API_ARTICLES = [];

function setArticles(articles) {
  API_ARTICLES = articles;
}

function fmtDC(text) {
  if (!text) return "";
  const t = text.trim();
  return `<span class="dropcap">${t.charAt(0)}</span>${t.slice(1)}`;
}

function getArticle(category, index) {
  if (typeof API_ARTICLES !== 'undefined' && API_ARTICLES.length > 0) {
    const categoryArticles = API_ARTICLES.filter(a => a.category === category);
    if (categoryArticles.length > index) {
      return categoryArticles[index];
    }
  }
  // Fallback Placeholder if backend is offline or empty
  return {
    source: "THE WORLD DISPATCH",
    title: "Pending Dispatch: Editorial Desk Awaits Transmission",
    published_at: new Date().toISOString(),
    content: "Please ensure the FastAPI backend is running and the ingestion pipeline has completed. This is placeholder text generated because the frontend could not establish a connection to localhost:8000.",
    summary: "The telegraph lines from the backend server appear to be disconnected. Ensure the local uvicorn host is running and processing incoming dispatches.",
    image_url: null
  };
}

const SPREADS = [
  // ══════════════════════════════ 0 · FRONT PAGE ════════════════════════════════
  {
    section: 'Front Page',
    page: (IMG) => {
      const a1 = getArticle('Front Page', 0);
      const a2 = getArticle('Front Page', 1);
      const a3 = getArticle('Front Page', 2);
      const a4 = getArticle('Front Page', 3);
      const a5 = getArticle('Front Page', 4);
      const a6 = getArticle('Front Page', 5);

      return `
    <div class="pg-hd">
      <div class="topbar">
        <span>ESTABLISHED 1842 · LONDON</span>
        <span>${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</span>
        <span>PRICE: 2 SHILLINGS</span>
      </div>
      <div class="mast">The World Dispatch <span style="font-size: 10px; font-family: serif; vertical-align: middle; opacity: 0.5;">v1.1</span></div>
      <div class="mast-sub">"Veritas &middot; Celeritas &middot; Claritas" &ensp;—&ensp; All the News Fit to Print</div>
      <div class="hrd"></div>
      <div class="ticker"><span>✦ LIVE DATA STREAM FROM SUPABASE ✦ BACKEND RAG MVP ACTIVE ✦ GROQ LLAMA-3 FAST INFERENCE ✦</span></div>
      <div class="hrd"></div>
    </div>
    
    <div class="cols" style="flex:none;height:auto;min-height:220px;border-bottom:2px solid #1a0f04;margin-bottom:5px;padding-bottom:15px;">
      <div class="col w2">
        <div class="az" style="margin-top:4px;">
          <span class="sl">${a1.source} &middot; Top Story</span>
          <div class="hl xl">${a1.title}</div>
          <div class="was">By THE WORLD DISPATCH DESK &middot; Summary Model: Llama-3</div>
          <div class="bt"><p class="dc">${fmtDC(a1.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="mp" style="height:160px; background:#ddd;">
          ${a1.image_url ? `<img src="${a1.image_url}" alt="News Image" style="height:160px;width:100%;object-fit:cover;filter: grayscale(100%) contrast(1.2);">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-style:italic;">No Image Available</div>`}
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a2.source} &middot; News Brief</span>
          <div class="hl sm">${a2.title}</div>
        </div>
      </div>
    </div>
    
    <div class="cols">
      <div class="col">
        <div class="az">
          <span class="sl">${a3.source} &middot; Global Affairs</span>
          <div class="hl md">${a3.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a3.summary)}</p></div>
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a5.source} &middot; Feature</span>
          <div class="hl md">${a5.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a5.summary)}</p></div>
        </div>
      </div>
      <div class="col">
         <div class="az">
          <span class="sl">${a4.source} &middot; Politics</span>
          <div class="hl md">${a4.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a4.summary)}</p></div>
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a6.source} &middot; Brief</span>
          <div class="hl md">${a6.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a6.summary)}</p></div>
        </div>
      </div>
      <div class="col">
         <div class="ad">
          <span class="at">Thornhill &amp; Sons</span>
          <p>Est. Purveyors of Fine Chronometers &middot; 30 Fleet Street, London &middot; Since 1894</p>
        </div>
      </div>
    </div>
    <div class="pgnum"><span>Page 1</span><span>THE WORLD DISPATCH &middot; FRONT PAGE</span></div>
  `
    }
  },

  // ══════════════════════════════ 1 · AI & TECHNOLOGY ═══════════════════════════════
  {
    section: 'AI',
    page: (IMG) => {
      const a1 = getArticle('AI', 0);
      const a2 = getArticle('AI', 1);
      const a3 = getArticle('AI', 2);
      const a4 = getArticle('AI', 3);
      const a5 = getArticle('AI', 4);
      const a6 = getArticle('AI', 5);

      return `
    <div class="pg-hd">
      <div class="pg-row">
        <span>THE WORLD DISPATCH &middot; AI DESK</span>
        <span class="sl" style="font-size:10px;letter-spacing:.15em;">PAGE 3</span>
      </div>
      <div class="pg-title">Technology &amp; Intelligence</div>
    </div>
    
    <div class="cols" style="flex:none;height:auto;min-height:265px;border-bottom:2px solid #1a0f04;margin-bottom:5px;padding-bottom:15px;">
      <div class="col w2">
        <div class="az" style="margin-top:4px;">
          <span class="sl">${a1.source} &middot; Lead Technology</span>
          <div class="hl xl">${a1.title}</div>
          <div class="was">By THE WORLD DISPATCH DESK &middot; Summary Model: Llama-3</div>
          <div class="bt"><p class="dc">${fmtDC(a1.summary)}</p></div>
        </div>
      </div>
      <div class="col">
         <div class="mp" style="height:160px; background:#ddd;">
          ${a1.image_url ? `<img src="${a1.image_url}" alt="News Image" style="height:160px;width:100%;object-fit:cover;filter: grayscale(100%) contrast(1.2);">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-style:italic;">No Image Available</div>`}
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a2.source} &middot; Tech Brief</span>
          <div class="hl sm">${a2.title}</div>
        </div>
      </div>
    </div>
    
    <div class="cols">
      <div class="col">
        <div class="az">
          <span class="sl">${a3.source} &middot; Startup News</span>
          <div class="hl md">${a3.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a3.summary)}</p></div>
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a6.source} &middot; Further Coverage</span>
          <div class="hl md">${a6.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a6.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a4.source} &middot; Regulation</span>
          <div class="hl md">${a4.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a4.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a5.source} &middot; Hardware</span>
          <div class="hl md">${a5.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a5.summary)}</p></div>
        </div>
      </div>
    </div>
    <div class="pgnum"><span>Page 3</span><span>THE WORLD DISPATCH &middot; AI DESK</span></div>
  `
    }
  },

  // ══════════════════════════════ 2 · SPORTS ══════════════════════════════════
  {
    section: 'Sports',
    page: (IMG) => {
      const a1 = getArticle('Sports', 0);
      const a2 = getArticle('Sports', 1);
      const a3 = getArticle('Sports', 2);
      const a4 = getArticle('Sports', 3);
      const a5 = getArticle('Sports', 4);
      const a6 = getArticle('Sports', 5);

      return `
    <div class="pg-hd">
      <div class="pg-row">
        <span>THE WORLD DISPATCH &middot; SPORTS DESK</span>
        <span class="sl" style="font-size:10px;letter-spacing:.15em;">PAGE 5</span>
      </div>
      <div class="pg-title">Sporting Headlines</div>
    </div>
    
    <div class="cols" style="flex:none;height:auto;min-height:265px;border-bottom:2px solid #1a0f04;margin-bottom:5px;padding-bottom:15px;">
      <div class="col w2">
        <div class="az" style="margin-top:4px;">
          <span class="sl">${a1.source} &middot; Lead Story</span>
          <div class="hl xl">${a1.title}</div>
          <div class="was">By THE WORLD DISPATCH DESK &middot; Summary Model: Llama-3</div>
          <div class="bt"><p class="dc">${fmtDC(a1.summary)}</p></div>
        </div>
      </div>
      <div class="col">
         <div class="mp" style="height:160px; background:#ddd;">
          ${a1.image_url ? `<img src="${a1.image_url}" alt="News Image" style="height:160px;width:100%;object-fit:cover;filter: grayscale(100%) contrast(1.2);">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-style:italic;">No Image Available</div>`}
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a2.source} &middot; Match Report</span>
          <div class="hl sm">${a2.title}</div>
        </div>
      </div>
    </div>
    
    <div class="cols">
      <div class="col">
        <div class="az">
          <span class="sl">${a3.source} &middot; Athletics</span>
          <div class="hl md">${a3.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a3.summary)}</p></div>
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a6.source} &middot; More Sport</span>
          <div class="hl md">${a6.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a6.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a4.source} &middot; Analysis</span>
          <div class="hl md">${a4.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a4.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a5.source} &middot; Breaking</span>
          <div class="hl md">${a5.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a5.summary)}</p></div>
        </div>
      </div>
    </div>
    <div class="pgnum"><span>Page 5</span><span>THE WORLD DISPATCH &middot; SPORTS DESK</span></div>
  `
    }
  },

  // ══════════════════════════════ 3 · CULTURE ══════════════════════════════════
  {
    section: 'Culture',
    page: (IMG) => {
      const a1 = getArticle('Culture', 0);
      const a2 = getArticle('Culture', 1);
      const a3 = getArticle('Culture', 2);
      const a4 = getArticle('Culture', 3);
      const a5 = getArticle('Culture', 4);
      const a6 = getArticle('Culture', 5);

      return `
    <div class="pg-hd">
      <div class="pg-row">
        <span>THE WORLD DISPATCH &middot; CULTURE DESK</span>
        <span class="sl" style="font-size:10px;letter-spacing:.15em;">PAGE 7</span>
      </div>
      <div class="pg-title">Arts &amp; Culture</div>
    </div>
    
    <div class="cols" style="flex:none;height:auto;min-height:265px;border-bottom:2px solid #1a0f04;margin-bottom:5px;padding-bottom:15px;">
      <div class="col w2">
        <div class="az" style="margin-top:4px;">
          <span class="sl">${a1.source} &middot; Arts</span>
          <div class="hl xl">${a1.title}</div>
          <div class="was">By THE WORLD DISPATCH DESK &middot; Summary Model: Llama-3</div>
          <div class="bt"><p class="dc">${fmtDC(a1.summary)}</p></div>
        </div>
      </div>
      <div class="col">
         <div class="mp" style="height:160px; background:#ddd;">
          ${a1.image_url ? `<img src="${a1.image_url}" alt="News Image" style="height:160px;width:100%;object-fit:cover;filter: grayscale(100%) contrast(1.2);">` : `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-style:italic;">No Image Available</div>`}
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a2.source} &middot; Exhibition</span>
          <div class="hl sm">${a2.title}</div>
        </div>
      </div>
    </div>
    
    <div class="cols">
      <div class="col">
        <div class="az">
          <span class="sl">${a3.source} &middot; Entertainment</span>
          <div class="hl md">${a3.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a3.summary)}</p></div>
        </div>
        <div class="hr" style="margin:10px 0;"></div>
        <div class="az">
          <span class="sl">${a6.source} &middot; Highlight</span>
          <div class="hl md">${a6.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a6.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a4.source} &middot; Literature</span>
          <div class="hl md">${a4.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a4.summary)}</p></div>
        </div>
      </div>
      <div class="col">
        <div class="az">
          <span class="sl">${a5.source} &middot; Film</span>
          <div class="hl md">${a5.title}</div>
          <div class="bt"><p class="dc">${fmtDC(a5.summary)}</p></div>
        </div>
      </div>
    </div>
    <div class="pgnum"><span>Page 7</span><span>THE WORLD DISPATCH &middot; CULTURE DESK</span></div>
  `
    }
  }
];
