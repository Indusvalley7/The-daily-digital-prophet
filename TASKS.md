# The World Dispatch — Task List

> A Harry Potter-themed magical newspaper web prototype.
> Development spanned multiple sessions from concept to polished interactive demo.

---

## Phase 1 — Concept & Visual Design

- [x] Define core concept: Harry Potter "The Daily Prophet"-inspired newspaper
- [x] Establish naming: **"The World Dispatch"** with motto *"Veritas · Celeritas · Claritas"*
- [x] Choose aesthetic: vintage broadsheet, parchment textures, 1800s typography
- [x] Select color palette: parchment `#f3ecd9`, dark ink `#1a0f04`, dark-red accents `#8b0000`, void background `#0d0900`
- [x] Choose typography stack:
  - [x] **UnifrakturMaguntia** — blackletter masthead & section titles
  - [x] **Playfair Display** — headlines (900 weight, serif)
  - [x] **Libre Baskerville** — body text, bylines, captions (classic editorial serif)

---

## Phase 2 — Newspaper Layout (HTML/CSS)

- [x] Build single-page newspaper at fixed portrait dimensions (780×970px)
- [x] Design masthead with establishment date, publication date, and price
- [x] Create scrolling breaking-news ticker bar with CSS `@keyframes tick` animation
- [x] Implement multi-column article grid layout using CSS flexbox
  - [x] Support flexible column widths (`.col`, `.col.w2` for double-width)
  - [x] Vertical column dividers via `border-right`
  - [x] Section label badges (`.sl`) with dark-red styling
- [x] Create headline hierarchy system: `.hl.xl` (22px), `.hl.lg` (16px), `.hl.md` (13px), `.hl.sm` (11px)
- [x] Implement drop-cap ornamental first letter using `::first-letter` pseudo-element with blackletter font
- [x] Add parchment paper texture using:
  - [x] SVG noise filter overlay (fractalNoise)
  - [x] Repeating horizontal ruled lines
  - [x] Inner box-shadow for page depth
- [x] Style page number footer with double-rule border
- [x] Create vintage advertisement block (Thornhill & Sons)
- [x] Create article zones (`.az`) with hover highlight and ⊕ indicator

---

## Phase 3 — Multi-Page Content System

- [x] Architect data-driven page system via `spreads.js`
- [x] Create 6 distinct newspaper sections, each with unique editorial content:
  - [x] **Page 1 — Front Page**: World affairs lead, science, climate, technology articles + ticker
  - [x] **Page 3 — Politics & Governance**: UN reform, France, EU, India, Americas articles
  - [x] **Page 5 — Environment & Science**: Climate floods, energy, oceanography, conservation, Amazon, Arctic
  - [x] **Page 7 — Arts & Entertainment**: Shakespeare discovery, Oscars, Vermeer, Beyoncé, theatre, architecture
  - [x] **Page 9 — Technology & AI**: Quantum internet, mRNA vaccine, SpaceX, AI hypotheses, cybersecurity, robotics
  - [x] **Page 11 — Sports & Horoscope**: World Cup, tennis, athletics, cricket, Formula 1 + full 12-sign horoscope grid
- [x] Each spread object exposes `section` name and `page(IMG)` template function

---

## Phase 4 — Three-State Zoom System

- [x] Implement finite state machine: `'float'` → `'expanded'` → `'zoomed'`
- [x] **Float State** (default):
  - [x] Small newspaper centered in dark void (~60% viewport width)
  - [x] Continuous 3D float animation: gentle `rotateX`, `rotateY`, `translateY` bob
  - [x] Dynamic drop shadow that intensifies with movement
  - [x] Hint text: *"Click the newspaper to open it"*
  - [x] Cursor set to `pointer` on entire newspaper
- [x] **Expanded State** (click newspaper):
  - [x] Smooth 1.1s cubic-bezier scale-up to fill viewport (~99%)
  - [x] Stop float animation; keep flag-wave running
  - [x] Show "↙ MINIMISE" button and page navigation controls
  - [x] Hint text: *"Click any article to zoom in"*
  - [x] Cursor set to `crosshair` on article zones, default elsewhere
- [x] **Zoomed State** (click article):
  - [x] Precise zoom into clicked article element (up to 4× scale)
  - [x] Vignette overlay darkens peripheral area
  - [x] Show "✕ BACK TO FULL PAGE" button
  - [x] Hide page navigation and dots

---

## Phase 5 — Navigation & Page Turning

- [x] Implement page-turn system with 3D flip animation
  - [x] Forward flip: `rotateY(0deg)` → `rotateY(-180deg)` over 1.2s
  - [x] Reverse flip: `rotateY(-180deg)` → `rotateY(0deg)` over 1.2s
  - [x] Flipper element styled with parchment texture matching newspaper
- [x] Create corner-turn tabs (bottom-right / bottom-left triangle peels)
  - [x] CSS triangle borders simulating page corner lift
  - [x] Hover enlargement effect (58px → 72px)
  - [x] Directional arrows (‹ / ›) overlaid on corners
- [x] Create page indicator dots
  - [x] Horizontally centered at bottom of viewport
  - [x] Active dot highlighted in parchment color `#f3ecd9`
  - [x] Click any dot to navigate directly to that page
- [x] Add keyboard navigation: `ArrowRight` / `ArrowLeft` for page turns, `Escape` to go back

---

## Phase 6 — Flag-Wave Animation

- [x] Implement vertical strip wave system using CSS `clip-path` on 20 strips
  - [x] Each strip clips a vertical slice of the full page content
  - [x] 1.5% overlap between strips to eliminate visual gaps
  - [x] `transform-origin` set to strip center for natural deformation
- [x] Dual sine-wave physics for organic ripple:
  - [x] Primary wave: `sin(t × 0.9π − phase)` at 2.5° amplitude
  - [x] Secondary wave: `sin(t × 1.44π − phase × 1.4)` at 0.35× harmonic dampening
  - [x] Combined `rotateY` + `translateZ` per strip for 3D depth
- [x] Wave runs **continuously in ALL states** (float, expanded, zoomed) via dedicated `requestAnimationFrame` loop
- [x] Separate interaction layer on top: transparent clone of page content with only hover/click events active

---

## Phase 7 — Moving Pictures (Harry Potter photos)

- [x] Implement Ken Burns-style subtle animation on newspaper images
  - [x] 12-second `ease-in-out infinite alternate` animation
  - [x] Keyframes cycle through `scale(1.04–1.07)` and `translate` shifts
  - [x] Color filter transitions: `grayscale(85–100%)`, `contrast(1.08–1.18)`, `sepia(11–22%)`
- [x] Add vignette lens overlay on photos
  - [x] Radial gradient simulating vintage camera vignette
  - [x] Pulsing opacity animation (4s cycle) for "living" effect

---

## Phase 8 — Background & Atmosphere

- [x] Dark void background: `#0d0900` base color
- [x] Radial gradient scene backdrop: warm brown ellipse fading to black
- [x] CSS `perspective: 1600px` on viewport container for 3D tilt depth
- [x] `preserve-3d` transform style on stage for true 3D rendering
- [x] Vignette overlay in zoomed state using `radial-gradient` (semi-opaque black)

---

## Phase 9 — UI Controls & Polish

- [x] "✕ BACK TO FULL PAGE" button — dark translucent with parchment text
- [x] "↙ MINIMISE" button — returns from expanded to float
- [x] Contextual hint system with auto-fade (4s timeout)
- [x] All UI chrome elements have `z-index` layering to avoid conflicts
- [x] Click-outside-newspaper behavior:
  - [x] Expanded → collapses to float
  - [x] Zoomed → returns to expanded
- [x] Responsive fit calculation: auto-scales newspaper to viewport on window resize
- [x] `will-change: transform` for GPU-accelerated animation on strips and stage

---

## Phase 10 — Hand Gesture Control (Computer Vision) 🧙‍♂️

> _"Make the user feel like a real wizard casting spells at the newspaper."_

### 10.1 — Setup & Camera Integration

- [x] Integrate **MediaPipe Hands** via CDN (`@mediapipe/tasks-vision`)
- [x] Create `gestures.js` module to encapsulate all gesture detection logic
- [x] Request webcam access via `navigator.mediaDevices.getUserMedia`
- [x] Create a small live camera preview (picture-in-picture style) in a corner of the viewport
  - [x] Style with a subtle border and low opacity so it doesn't distract from the newspaper
  - [x] Add a toggle button to show/hide the camera feed
- [x] Initialize MediaPipe `HandLandmarker` with `runningMode: 'VIDEO'` for real-time detection
- [x] Run gesture detection loop synced with `requestAnimationFrame` (~30fps target)

### 10.2 — Gesture Recognition Engine

- [x] Implement **fist detection** (all fingers curled):
  - [x] Calculate distances from each fingertip (landmarks 8, 12, 16, 20) to wrist (landmark 0)
  - [x] Compare against knuckle distances (landmarks 5, 9, 13, 17) to determine curl state
  - [x] Require all 4 fingers + thumb to be curled for a valid fist
- [x] Implement **open hand detection** (all 5 fingers extended):
  - [x] Each fingertip must be significantly farther from wrist than its corresponding knuckle
  - [x] Require all 5 digits extended simultaneously
- [x] Implement **swish detection** (horizontal hand sweep):
  - [x] Track wrist X-position (landmark 0) across consecutive frames
  - [x] Detect a rapid horizontal movement exceeding a velocity threshold
  - [x] Classify as swish-right (positive X delta) or swish-left (negative X delta)
  - [x] Only trigger when hand is open/flat (not during a fist)
- [x] Add **cooldown timers** to prevent gesture spam (e.g., 1.5s between zoom actions, 1s between page turns)
- [x] Add **confidence thresholds** — require gesture to be held for ~300ms before triggering (debounce)

### 10.3 — Gesture → Action Mapping

- [x] **Fist clench → Zoom in** (one level):
  - [x] Float state → calls `expandPage()` (expands the newspaper)
  - [x] Expanded state → zooms into the **first visible article zone** (or center article)
- [x] **Open hand (5 fingers) → Zoom out** (one level):
  - [x] Zoomed state → calls `zoomOut()` (back to expanded)
  - [x] Expanded state → calls `collapseToFloat()` (back to floating)
- [x] **Swish right → Next page** (expanded state only):
  - [x] Triggers `turnPage(1)` — same as clicking the right corner tab or pressing →
- [x] **Swish left → Previous page** (expanded state only):
  - [x] Triggers `turnPage(-1)` — same as clicking the left corner tab or pressing ←
- [x] All gesture actions should trigger the **same animations** as their click/keyboard equivalents (no separate code paths)

### 10.4 — Visual Feedback

- [x] Show a small **gesture indicator icon** when a gesture is recognized (e.g., ✊ / 🖐 / 👉 / 👈)
  - [x] Icon fades in on detection, fades out after the action completes
  - [x] Positioned near the camera preview or center of screen
- [x] Update hint text to include gesture instructions:
  - [x] Float state: *"Clench fist to open the newspaper"*
  - [x] Expanded state: *"Clench fist to zoom · Swish to turn pages · Open hand to minimize"*
  - [x] Zoomed state: *"Open hand to zoom out"*
- [x] Add a pulsing border or glow on the camera preview when a hand is detected

### 10.5 — Error Handling & Graceful Degradation

- [x] If camera access is denied, fall back to click/keyboard-only mode (no error shown)
- [x] If MediaPipe fails to load, log warning and continue with existing controls
- [x] Show a brief onboarding tooltip explaining available gestures on first launch
- [x] Ensure all existing click/keyboard controls remain fully functional alongside gesture input

---

## Phase 11 — Refine Swish Gesture & Fix Page Turn Reliability

- [x] Re-design "Swish" gesture to require two fingers (Index + Middle) extended together, preventing accidental zoom-out (open hand) conflicts.
- [x] Increase detection sensitivity: lower `SWISH_VELOCITY` to 0.035 and trigger threshold to 2 frames for a more magical, effortless feel.
- [x] Fix race condition where turning the page while currently in the `zoomed` state would break the CSS animation. It now smoothly zooms out and flips simultaneously.

---

## Phase 12 — Backend RAG MVP Architecture & Setup

- [x] Design decoupled architecture separating frontend from LLM processing time.
- [x] Set up FastAPI foundation (`main.py`, `schemas.py`, `database.py`).
- [x] Configure Supabase (PostgreSQL) for Relational Storage (`articles`, `article_context`).
- [x] Configure ChromaDB for Vector Storage (local persistent MVP).
- [x] Integrate `SentenceTransformers` (`all-MiniLM-L6-v2`) for generating embeddings.
- [x] Integrate local Ollama (`mistral`) for generating classic newspaper-style summaries.
- [x] Build Ingestion Pipeline: fetch RSS feeds, clean HTML, truncate, embed, retrieve similar context, summarize, and persist.
- [x] Create `README.md` with explicit database setup commands and local execution instructions.

---

## Phase 13 — Frontend API Integration

- [x] Connect `index.html` to the local FastAPI backend on port 8000
- [x] Fetch actual news data before initializing the 3D newspaper
- [x] Map and dynamically render the returned JSON directly into `spreads.js`
- [x] Provide stylish offline fallback templates if the database is unreachable

---

## Phase 14 — Data Quality & Layout Density

- [x] Upgrade the Groq LLM inference model to `llama-3.1-8b-instant`
- [x] Resolve Supabase vs ChromaDB foreign key constraints via programmatic deletion
- [x] Migrate broken RSS feeds (NYT Sports -> BBC Sport)
- [x] Increase LLM ingestion limit from 2 to 6 articles per category
- [x] Completely rewrite `spreads.js` layout from sparse 2-article pages to rich 5-article grids
- [x] Inject cache-busters into the HTML logic to force browser layout re-renders

---

## Phase 15 — Automated Content Scheduling [COMPLETED]
- [x] Implement a 6 AM "Morning Edition" cron-like refresh job
- [x] Integrate `APScheduler` into the Python backend to automate `process_all_feeds()`
- [x] Ensure redundant articles are cleared before each fresh ingestion
- [x] Add logging to verify scheduler execution status

---

## Phase 16 — Three.js Engine Migration [COMPLETED]
- [x] Replace 20-strip CSS animation with a integrated Three.js WebGL scene
- [x] Implement a PlaneGeometry shader for smooth, gap-free newspaper waves
- [x] Use Hybrid Rendering: WebGL for movement, DOM for high-fidelity zoomed text
- [x] Add dynamic lighting and volumetric shadowing to the paper folds

---

## Phase 17 — Advanced Animation & Gesture Tuning [COMPLETED]
- [x] Implement a realistic 3D "Page Curl" bend for turn transitions
- [x] Refactor "Swish" gesture to be position-based (center-crossing) for higher sensitivity
- [x] Optimize render loop for consistent 60FPS on high-resolution displays

---

## Phase 18 — Soft Page Turning UI [COMPLETED]
- [x] Implement Cylindrical Deformation vertex shader
- [x] Create 'soft' elastic paper roll effect during page transitions
- [x] Coordinate texture swapping with roll animation for high-fidelity feel
