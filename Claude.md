# Claude.md — The World Dispatch

> A complete project reference for **The World Dispatch**, a Harry Potter-themed magical newspaper web prototype built with vanilla HTML, CSS, and JavaScript.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Design System](#design-system)
4. [Architecture](#architecture)
5. [Three-State Zoom System](#three-state-zoom-system)
6. [Flag-Wave Animation System](#flag-wave-animation-system)
7. [Moving Pictures Effect](#moving-pictures-effect)
8. [Page Turn System](#page-turn-system)
9. [Content System (spreads.js)](#content-system-spreadsjs)
10. [Hand Gesture Control (Computer Vision)](#hand-gesture-control-computer-vision) ✨ NEW
11. [UI Components Reference](#ui-components-reference)
12. [Automated Scheduling](#automated-scheduling) ✨ NEW
13. [Running the Project](#running-the-project)

---

## Project Overview

The World Dispatch is an interactive newspaper prototype inspired by the magical newspapers from the Harry Potter universe (The Daily Prophet). The newspaper floats in a dark void, features a flag-wave ripple animation across its surface, contains "moving pictures" (subtly animated photos), and supports three levels of zoom interaction.

### Key Features

- **Floating newspaper** in a dark 3D void with gentle bob and tilt
- **Flag-wave animation** — the paper's surface ripples like a flag in a breeze using 20 vertical CSS strips
- **Three zoom states** — float → expanded → zoomed article view
- **6 full newspaper pages** with page-flip transitions between them
- **Moving pictures** — photos subtly pan and zoom in the style of Harry Potter
- **Vintage broadsheet design** — parchment texture, blackletter masthead, drop-cap initials, scrolling ticker
- **Hand gesture control** 🧙‍♂️ — use webcam + MediaPipe to zoom with a fist, zoom out with an open palm, and swish to turn pages

### Technology Stack

| Layer       | Choice                  | Rationale                                       |
|-------------|------------------------|-------------------------------------------------|
| Structure   | Vanilla HTML           | No build tools or framework needed              |
| Styling     | Vanilla CSS            | All animations are pure CSS `@keyframes`         |
| Logic       | Vanilla JavaScript     | State machine, DOM construction, RAF loops       |
| Fonts       | Google Fonts (3 families) | Loaded via `<link>` tag in `<head>`           |
| Images      | Single `hero.png`       | Used across all pages as placeholder photo      |
| CV / Hands  | MediaPipe Hands (CDN)  | Browser-based hand landmark detection at ~30fps  |
| Server      | `npx serve .`          | Any static file server works                    |

---

## File Structure

```
news-app/
├── index.html      # Main entry point — CSS + HTML template + JS engine
├── spreads.js      # 6 newspaper page templates (data-driven content)
├── gestures.js     # [NEW] Hand gesture recognition module (MediaPipe Hands)
├── hero.png        # Placeholder photo used in articles
├── TASKS.md        # Task list of all completed work
└── Claude.md       # This file — comprehensive project documentation
```

### index.html (1116 lines)

The single-file application contains three major sections:

| Section         | Lines       | Contents                                                       |
|-----------------|-------------|----------------------------------------------------------------|
| `<style>`       | 10–767      | All CSS: layout, typography, animations, states, wave system   |
| `<body>` HTML   | 770–780     | Minimal DOM shells; content injected by JS                     |
| `<script>`      | 782–1113    | State machine, animation loops, DOM builder, event handlers    |

### spreads.js (411 lines)

A single `const SPREADS = [...]` array of 6 objects. Each object has:
```js
{
  section: 'Section Name',      // e.g. 'Front Page', 'Politics'
  page: IMG => `...HTML...`     // Template literal returning page HTML
}
```

---

## Design System

### Color Palette

| Token         | Hex         | Usage                                            |
|---------------|-------------|--------------------------------------------------|
| Parchment     | `#f3ecd9`   | Page background, button text, active dot          |
| Ink           | `#1a0f04`   | Text, borders, rules, masthead                   |
| Dark Red      | `#8b0000`   | Section labels, hover icons                      |
| Body Text     | `#291800`   | Article body copy                                |
| Caption Grey  | `#666`      | Bylines, photo captions, page row text           |
| Void          | `#0d0900`   | Body background                                  |
| Void Gradient | `#3a2514`   | Radial gradient center behind newspaper          |

### Typography

| Font Family            | CSS Class / Usage                      | Style              |
|------------------------|----------------------------------------|--------------------|
| **UnifrakturMaguntia** | `.mast`, `.pg-title`, `.ad .at`, `::first-letter` | Blackletter / gothic |
| **Playfair Display**   | `.hl` (all headline sizes)             | Serif, 900 weight  |
| **Libre Baskerville**  | `.bt`, `.topbar`, `.ticker`, `.pc`     | Classic editorial serif |

### Headline Size Scale

| Class     | Font Size | Usage                        |
|-----------|-----------|------------------------------|
| `.hl.xl`  | 22px      | Lead article headlines       |
| `.hl.lg`  | 16px      | Secondary lead headlines     |
| `.hl.md`  | 13px      | Standard article headlines   |
| `.hl.sm`  | 11px      | Minor article headlines      |

### Paper Texture

The parchment effect is achieved by layering three visual elements on `.page`:

1. **Horizontal ruled lines** — `repeating-linear-gradient` every 28px (subtle 0.09 opacity)
2. **Noise texture** — inline SVG `feTurbulence` filter (fractalNoise, 0.04 opacity)
3. **Inner shadow** — `::before` pseudo-element with `box-shadow: inset` for depth at edges

---

## Architecture

### State Machine

The application is built around a simple string-based state machine:

```
┌─────────┐  click newspaper  ┌──────────┐  click article  ┌────────┐
│  float  │ ──────────────── │ expanded  │ ──────────────  │ zoomed │
│         │                   │           │                 │        │
│ (bob +  │  ← MINIMISE btn  │ (static,  │  ← BACK btn    │ (zoom  │
│  wave)  │  or click void    │  wave)    │  or click void  │  into  │
└─────────┘                   └──────────┘                  │  .az)  │
                                   ▲                        └────────┘
                                   │       click void          │
                                   └───────────────────────────┘
```

### Key State Variables

```js
let state = 'float';                    // Current state: 'float' | 'expanded' | 'zoomed'
let fs = 1, stageX = 0, stageY = 0;    // Float mode: scale factor + position
let exFs = 1, exX = 0, exY = 0;        // Expanded mode: scale factor + position
let floatT = 0, rafId = null;          // Float animation: time counter + RAF ID
let curPage = 0;                        // Currently visible page index (0–5)
```

### Animation Loops

Three independent `requestAnimationFrame` loops run in parallel:

| Loop              | Function           | When Active        | Purpose                                |
|-------------------|--------------------|--------------------|-----------------------------------------|
| Float animation   | `animateFloat()`   | Float state only   | 3D tilt, bob, dynamic shadow           |
| Wave animation    | `animateWave()`    | **All states**     | Flag ripple on the active spread       |
| Gesture detection | `detectGestures()` | **All states**     | Webcam hand tracking via MediaPipe     |

---

## Three-State Zoom System

### State 1: Float

The newspaper appears small (~60% viewport width), centered in a dark void with a warm radial gradient behind it.

**Visual effects running:**
- Gentle bob: `translateY` oscillates ±10px at `sin(t * 1.15)` frequency
- Gentle drift: `translateX` oscillates ±3px at `sin(t * 0.31)` frequency
- 3D tilt: `rotateX` ±1.8° and `rotateY` ±1.4° at different frequencies
- Dynamic shadow: shadow distance and blur scale with bob amplitude
- Flag wave: 20-strip ripple runs continuously

**Key function:** `animateFloat()`
```js
const rx = Math.sin(floatT * 0.9) * 1.8;       // Tilt X
const ry = Math.cos(floatT * 0.65) * 1.4;      // Tilt Y
const fty = Math.sin(floatT * 1.15) * 10;      // Vertical bob
const ftx = Math.sin(t * 0.31) * 3;            // Horizontal drift
```

### State 2: Expanded

The newspaper smoothly scales up to fill 99% of the viewport. The float animation stops but the wave continues.

**Transition:** 1.1s `cubic-bezier(0.22, 0.1, 0.15, 1)` — fast start, gentle ease-out

**UI changes:**
- "↙ MINIMISE" button appears (top-left)
- Corner-turn page navigation tabs appear (bottom corners)
- Page indicator dots remain visible
- Article zones show ⊕ icon on hover

### State 3: Zoomed

On clicking an article zone (`.az`), the camera zooms into that specific element.

**Zoom calculation:**
```js
// Get article bounding box relative to stage
const nCx = (ar.left + ar.width / 2 - sr.left) / exFs;
const nCy = (ar.top + ar.height / 2 - sr.top) / exFs;
// Scale to fit article in ~80% viewport width, max 4×
const ns = Math.min(vw * 0.80 / nW, vh * 0.86 / nH, 4.0);
```

**Visual effects:**
- Vignette overlay fades in (radial gradient, 0.88 opacity edge)
- Transition: 1.7s cubic-bezier for dramatic zoom feel
- Heavy shadow: `box-shadow: 0 70px 160px rgba(0,0,0,0.92)`

---

## Flag-Wave Animation System

The most technically distinctive feature. The newspaper surface ripples like a flag in a gentle breeze, achieved entirely with CSS transforms and JavaScript.

### How It Works

```
┌──────────────────────────────────────────────────────────┐
│                    .wave-surface                          │
│  ┌───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬── ...    │
│  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │        │
│  │   │   │   │   │   │   │   │   │   │   │   │        │
│  │ s │ s │ s │ s │ s │ s │ s │ s │ s │ s │ s │        │
│  │ t │ t │ t │ t │ t │ t │ t │ t │ t │ t │ t │        │
│  │ r │ r │ r │ r │ r │ r │ r │ r │ r │ r │ r │        │
│  │ i │ i │ i │ i │ i │ i │ i │ i │ i │ i │ i │        │
│  │ p │ p │ p │ p │ p │ p │ p │ p │ p │ p │ p │        │
│  └───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴── ...    │
│                                                           │
│  + Interaction layer (transparent, above all strips)      │
└──────────────────────────────────────────────────────────┘
```

### Strip Construction (DOM Build Phase)

Each of the 20 strips:
1. Contains a **full copy** of the page HTML
2. Uses `clip-path: inset(0 rightPct% 0 leftPct%)` to show only its vertical slice
3. Has **1.5% overlap** with neighbors to prevent visible seam gaps
4. Sets `transform-origin` to its center column position
5. Gets `backface-visibility: hidden` and `will-change: transform` for GPU acceleration

### Wave Physics (Per Frame)

```js
for (let i = 0; i < n; i++) {
    const phase = (i / n) * Math.PI * 2.5;                    // Phase offset per strip
    const w1 = Math.sin(t * 0.45 * 2 * Math.PI - phase);     // Primary wave (0.45 Hz)
    const w2 = Math.sin(t * 0.72 * 2 * Math.PI - phase * 1.4) * 0.35;  // Secondary harmonic
    const wave = w1 + w2;
    const stripRy = wave * 2.5;    // rotateY: ±2.5° max
    const stripTz = wave * 5;     // translateZ: ±5px max
    strips[i].style.transform = `rotateY(${stripRy}deg) translateZ(${stripTz}px)`;
}
```

**Key parameters:**

| Parameter            | Value     | Effect                                    |
|----------------------|-----------|-------------------------------------------|
| `NUM_STRIPS`         | 20        | Number of vertical slices                 |
| Primary frequency    | 0.45 Hz   | Main wave speed                           |
| Secondary frequency  | 0.72 Hz   | Faster harmonic for organic feel          |
| Phase coverage       | 2.5π      | ~1.25 full waves visible across the page  |
| Harmonic dampening   | 0.35×     | Secondary wave is 35% of primary amplitude|
| rotateY amplitude    | ±2.5°     | Maximum strip Y-rotation                  |
| translateZ amplitude | ±5px      | Maximum depth displacement                |
| Strip overlap        | 1.5%      | Prevents seam gaps during deformation     |

### Interaction Layer

Because the strips have `pointer-events: none`, a separate transparent `.interact` div sits on top of the `.wave-surface`. This layer:
- Contains an identical copy of the page HTML
- Makes all text/images invisible via CSS (`color: transparent !important`, etc.)
- Only the `.az` hover backgrounds and `::after` icons are visible
- Handles all `click` and `hover` events

---

## Moving Pictures Effect

Newspaper photos use two layered animations to simulate the Harry Potter "living photograph" effect:

### Ken Burns Animation (on `<img>`)

```css
@keyframes px {
    0%   { transform: scale(1.04) translate(0, 0);      filter: grayscale(100%) contrast(1.10) sepia(18%); }
    33%  { transform: scale(1.07) translate(-4px, -2px); filter: grayscale(88%)  contrast(1.16) sepia(11%); }
    66%  { transform: scale(1.05) translate(3px, -3px);  filter: grayscale(96%)  contrast(1.08) sepia(22%); }
    100% { transform: scale(1.06) translate(4px, 2px);   filter: grayscale(85%)  contrast(1.18) sepia(11%); }
}
```
- Duration: 12s, `ease-in-out`, infinite, alternate
- Scale range: 1.04–1.07× (subtle zoom breathing)
- Position drift: ±4px horizontal, ±3px vertical
- Filter shift: grayscale oscillates 85–100%, contrast 1.08–1.18

### Vignette Lens Overlay (via `.mp::after`)

```css
@keyframes vf {
    0%   { opacity: .65 }
    50%  { opacity: .3 }
    100% { opacity: .8 }
}
```
- Radial gradient from transparent center to dark edges
- 4s pulsing opacity cycle gives a "flickering old film" quality
- The image container has `overflow: hidden` so zoom doesn't leak out

---

## Page Turn System

### Flip Animation

A dedicated `#flipper` div is positioned and sized to match the newspaper's current screen bounds, then animated:

| Direction | CSS Class | Animation             | Duration |
|-----------|-----------|----------------------|----------|
| Forward   | `.go`     | `rotateY(0 → -180°)` | 1.2s     |
| Backward  | `.rev`    | `rotateY(-180° → 0°)` | 1.2s    |

The `transform-origin: left center` creates a natural page-turn pivot along the spine.

**Timing:** The active spread swaps at 580ms (midway through the flip while the page is edge-on), creating the illusion that the new page was behind the flipping one.

### Corner Turn Tabs

Two fixed-position triangles at the bottom corners:

```css
#cn::before {  /* Next page — bottom right */
    border-width: 0 0 58px 58px;
    border-color: transparent transparent #c4b48a transparent;
}
#cp::before {  /* Previous page — bottom left */
    border-width: 0 58px 58px 0;
    border-color: transparent #c4b48a transparent transparent;
}
```

On hover, the triangles grow from 58px to 72px and darken from `#c4b48a` to `#a89060`, simulating a paper corner being peeled up.

### Page Dots

Centered at the bottom of the viewport, one dot per spread. The active page dot is highlighted in `#f3ecd9` (parchment), inactive dots are `rgba(255, 255, 255, 0.2)`.

---

## Hand Gesture Control (Computer Vision)

> _"Make the user feel like a real wizard casting spells at the newspaper."_ 🧙‍♂️

The hand gesture system uses the user's webcam and **MediaPipe Hands** to detect hand poses and movements in real-time, mapping them to newspaper interactions. All existing click and keyboard controls continue to work alongside gesture input.

### Technology: MediaPipe Hands

- **Library**: `@mediapipe/tasks-vision` loaded via CDN (JSDelivr)
- **Model**: `HandLandmarker` — detects 21 3D landmarks per hand in real-time
- **Running mode**: `VIDEO` — processes live webcam frames
- **Performance target**: ~30fps hand detection on modern hardware
- **Privacy**: All processing is on-device; no data sent to external servers

### Hand Landmark Map

MediaPipe detects 21 landmarks per hand. The key ones used for gesture recognition:

```
        8   12  16  20       ← Fingertips (INDEX, MIDDLE, RING, PINKY)
        |   |   |   |
        7   11  15  19       ← DIP joints
        |   |   |   |
        6   10  14  18       ← PIP joints
        |   |   |   |
    4   5   9   13  17       ← MCP knuckles (+ thumb tip at 4)
     \  |  /   /   /
      3 |/   /   /           ← Thumb joints
       \|  /   /
        2 /   /
        |/  /
        1 /                  ← Thumb CMC
        |/
        0                    ← WRIST
```

### Gesture Definitions

#### 1. Fist Clench → Zoom In

| Detail        | Value                                                    |
|---------------|----------------------------------------------------------|
| **Detection** | All 4 fingertips (8, 12, 16, 20) closer to wrist than their MCP knuckles (5, 9, 13, 17) |
| **Thumb**     | Thumb tip (4) closer to wrist than thumb MCP (2)         |
| **Debounce**  | Must be held for ~300ms continuously                     |
| **Cooldown**  | 1.5s between zoom-in triggers                            |
| **Action**    | Float → `expandPage()` · Expanded → `zoomTo(firstArticle)` |

#### 2. Open Hand → Zoom Out

| Detail        | Value                                                    |
|---------------|----------------------------------------------------------|
| **Detection** | All 5 fingertips significantly farther from wrist than their MCP knuckles |
| **Debounce**  | Must be held for ~300ms continuously                     |
| **Cooldown**  | 1.5s between zoom-out triggers                           |
| **Action**    | Zoomed → `zoomOut()` · Expanded → `collapseToFloat()`    |

#### 3. Swish Right → Next Page

| Detail        | Value                                                    |
|---------------|----------------------------------------------------------|
| **Gesture**   | **Two-Finger Pointer** (Index + Middle extended together) |
| **Detection** | Wrist (landmark 0) X-position moves rapidly from left to right |
| **Threshold** | X velocity > 0.08 per frame (lowered for sensitivity)    |
| **Consistency**| Direction must be maintained for 3+ consecutive frames   |
| **Cooldown**  | 1.0s between page turns                                  |
| **Action**    | `turnPage(1)` (Next) · Automatically zooms out if in `zoomed` state |

#### 4. Swish Left → Previous Page

| Detail        | Value                                                    |
|---------------|----------------------------------------------------------|
| **Gesture**   | **Two-Finger Pointer** (Index + Middle extended together) |
| **Detection** | Wrist X-position moves rapidly from right to left        |
| **Threshold** | X velocity > 0.08 per frame                              |
| **Consistency**| Direction must be maintained for 3+ consecutive frames   |
| **Cooldown**  | 1.0s between page turns                                  |
| **Action**    | `turnPage(-1)` (Prev) · Automatically zooms out if in `zoomed` state |

### Gesture → State Mapping Summary

```
 ┌──────────────────────────────────────────────────────────────────┐
 │                    GESTURE → ACTION MAP                         │
 ├──────────┬──────────────┬──────────────┬────────────────────────┤
 │ Gesture  │ Float State   │ Expanded     │ Zoomed State           │
 ├──────────┼──────────────┼──────────────┼────────────────────────┤
 │ ✊ Fist   │ → Expanded   │ → Zoomed     │ (no action)            │
 │ 🖐 Open  │ (no action)  │ → Float      │ → Expanded             │
 │ 👉 Swish→│ (no action)  │ Next page    │ (no action)            │
 │ 👈 Swish←│ (no action)  │ Prev page    │ (no action)            │
 └──────────┴──────────────┴──────────────┴────────────────────────┘
```

### Module Architecture: `gestures.js`

The gesture system is encapsulated in a standalone module that hooks into the existing app:

```js
// gestures.js — public API
function initGestures(callbacks)  // Initialize camera + MediaPipe
  // callbacks: { onFist, onOpenHand, onSwishLeft, onSwishRight }

function startGestures()          // Begin detection loop
function stopGestures()           // Pause detection
function isGestureActive()        // Returns true if camera is running
```

The main `index.html` wires the callbacks to existing state-transition functions:

```js
initGestures({
    onFist:       () => { /* expandPage() or zoomTo() based on state */ },
    onOpenHand:   () => { /* zoomOut() or collapseToFloat() based on state */ },
    onSwishRight: () => { turnPage(1); },
    onSwishLeft:  () => { turnPage(-1); },
});
```

### Camera Preview UI

- Small `<video>` element in the bottom-left or top-right corner
- Semi-transparent with subtle border (unobtrusive)
- Toggle button to show/hide the camera feed
- Pulsing glow effect when a hand is detected
- Gesture indicator emoji (✊ / 🖐 / 👉 / 👈) flashes on recognition

---

## Content System (spreads.js)

### Page Architecture

Each page follows a consistent template:

```
┌─────────────────────────────────┐
│ .pg-hd (page header)            │
│   .topbar / .pg-row / .pg-title │
│   .ticker (front page only)     │
│   .hrd (double rules)           │
├─────────────────────────────────┤
│ .cols (upper section)           │
│   .col.w2 │ .col               │
│   Lead     │ Photo/Secondary   │
│   article  │ articles           │
├─────────────────────────────────┤
│ .cols (lower section)           │
│   .col │ .col │ .col           │
│   3-column equal-width grid    │
├─────────────────────────────────┤
│ .pgnum (footer)                 │
│   Page X  │  THE WORLD DISPATCH │
└─────────────────────────────────┘
```

### Section Inventory

| Index | Section              | Page # | Lead Story                                             |
|-------|---------------------|--------|-------------------------------------------------------|
| 0     | Front Page          | 1      | World Leaders Emergency Summit in Geneva               |
| 1     | Politics            | 3      | UN Reform: Africa Gets Two Permanent Security Council Seats |
| 2     | Environment         | 5      | Unprecedented Floods Across Danube Basin               |
| 3     | Entertainment       | 7      | Lost Shakespeare Manuscript Found in Stratford Pub     |
| 4     | Technology & AI     | 9      | China Activates Quantum Internet: Beijing to Shanghai  |
| 5     | Sports & Horoscope  | 11     | Nigeria Defeats Brazil 3–1 for First FIFA World Cup    |

---

## UI Components Reference

### CSS Class Quick Reference

| Class    | Element                  | Description                                       |
|----------|--------------------------|---------------------------------------------------|
| `.page`  | Main page container      | 780×970px, parchment background, the newspaper    |
| `.mast`  | Masthead title           | "The World Dispatch" in blackletter               |
| `.topbar`| Top meta bar             | Established date, publication date, price         |
| `.ticker`| Breaking news marquee    | Auto-scrolling horizontal text band               |
| `.cols`  | Column container         | Flexbox row of `.col` elements                    |
| `.col`   | Single column            | Flex:1 with right border divider                  |
| `.col.w2`| Double-width column      | Flex:2 for lead articles                          |
| `.sl`    | Section label            | Dark-red uppercase badge (e.g. "WORLD AFFAIRS")   |
| `.hl`    | Headline                 | Playfair Display, with size modifiers             |
| `.was`   | Byline / dateline        | Italic, grey, small (7.8px)                       |
| `.bt`    | Body text                | Justified, serif, 9.5px                           |
| `.dc`    | Drop-cap paragraph       | First letter becomes large blackletter float      |
| `.az`    | Article zone (clickable) | Hover highlight + ⊕ icon, triggers zoom           |
| `.mp`    | Moving picture container | Photo with Ken Burns + vignette animation         |
| `.pc`    | Photo caption            | Italic, centered, grey                            |
| `.ad`    | Advertisement block      | Bordered box with blackletter title               |
| `.hrd`   | Heavy rule               | 3px double border                                 |
| `.hr`    | Light rule               | 1px solid border                                  |
| `.hgrid` | Horoscope grid           | 2-column CSS grid                                 |
| `.hi`    | Horoscope item           | Border box for one zodiac sign                    |
| `.pgnum` | Page number footer       | Bottom bar with page number and publication name   |

### ID Reference (UI Controls)

| ID        | Element                | Purpose                                          |
|-----------|------------------------|--------------------------------------------------|
| `#vp`     | Viewport container     | `perspective: 1600px`, houses the stage          |
| `#stage`  | Newspaper stage        | Contains all spreads; receives all transforms    |
| `#vig`    | Vignette overlay       | Dark radial overlay for zoomed state             |
| `#cn`     | Corner next            | Bottom-right page-turn triangle                  |
| `#cp`     | Corner previous        | Bottom-left page-turn triangle                   |
| `#dots`   | Page indicator dots    | Bottom-center dot navigation                     |
| `#zb`     | Zoom back button       | "✕ BACK TO FULL PAGE" in zoomed state            |
| `#mb`     | Minimise button        | "↙ MINIMISE" in expanded state                   |
| `#flipper`| Page flip overlay      | Animated page-turn visual effect                 |
| `#hint`   | Hint text              | Auto-fading contextual instruction text          |

---

## Running the Project

### Quick Start

```bash
cd /Users/indu/Desktop/Projects/news-app
npx -y serve .
```

Then open the URL shown in the terminal (typically `http://localhost:3000`).

### Interaction Guide

#### Mouse & Keyboard

| Action                     | Result                                          |
|----------------------------|-------------------------------------------------|
| Wait 2 seconds             | Hint appears: *"Click the newspaper to open it"*|
| Click the newspaper        | Expands from float to full-page view            |
| Click any article headline | Zooms into that article with vignette           |
| Click "✕ BACK TO FULL PAGE"| Returns to expanded view                        |
| Click "↙ MINIMISE"        | Collapses back to floating state                |
| Click the dark void area   | Goes back one zoom level                        |
| Press `Escape`             | Goes back one zoom level                        |
| Press `→` / `←` arrow keys | Navigate between pages (expanded mode)          |
| Click corner triangle      | Flip to next/previous page                      |
| Click a page dot           | Jump directly to that page                      |

#### Hand Gestures 🧙‍♂️

| Gesture                 | Result                                          |
|-------------------------|-------------------------------------------------|
| ✊ Clench fist           | Zoom in one level (float → expanded → zoomed)   |
| 🖐 Show open hand       | Zoom out one level (zoomed → expanded → float)  |
| 👉 Swish hand right     | Turn to next page (expanded mode)               |
| 👈 Swish hand left      | Turn to previous page (expanded mode)           |

### Browser Requirements

- Modern browser with CSS `perspective`, `transform-style: preserve-3d`, and `clip-path` support
- Recommended: Chrome, Firefox, Safari, Edge (all modern versions)
- Google Fonts loaded via CDN — requires internet connection
- **For gesture control**: Webcam access + HTTPS (or `localhost`) required
  - Camera permission will be requested on page load
  - If denied, the app gracefully falls back to click/keyboard only

---

## Development History

The project was built across multiple development sessions:

1. **Session 1 — "Refining Flag Wave Animation"**: Established the initial concept, prototype layout, and flag-wave strip system. Iterated extensively on the wave physics to eliminate gap artifacts and achieve natural ripple motion. Originally used 12 strips, later refined.

2. **Session 2 — "Building Harry Potter Newspaper App"**: Rebuilt into the final polished version with 6 content pages, page-turn navigation, 3-state zoom system, moving pictures, and the complete interaction flow. Consolidated from separate `style.css` + `app.js` into a single `index.html` for simplicity, with content extracted to `spreads.js`.

3. **Session 3 — "Hand Gesture Control"**: Added computer vision via MediaPipe Hands to let the user control newspaper zoom and page turning with hand gestures — fist to zoom in, open hand to zoom out, swish to turn pages. Encapsulated in a new `gestures.js` module.

4. **Session 4 — "Backend RAG MVP"**: Architected a decoupled backend using FastAPI, Supabase (PostgreSQL), ChromaDB, and Ollama. Built an ingestion pipeline to fetch real RSS feeds, generate embeddings (`SentenceTransformers`), retrieve similar past context, and generate classic newspaper-style summaries (`Mistral`) completely disconnected from the fast frontend serving layer.

635: 5. **Session 5 — "Frontend Integration & Density Expansion"**: Wired the vanilla JS layout directly to the FastAPI endpoints. Increased text density drastically by upgrading the layout algorithms to support 5 articles per section spread, up from 2. Resolved cross-origin CORS errors, fixed backend synchronization issues with ChromaDB and Supabase, and upgraded the inference tier to Llama 3.1.
636: 
637: 6. **Session 6 — "Automated Scheduling"**: Implemented a 6 AM "Morning Edition" automated refresh using `APScheduler`. The system now clears the database and triggers the full ingestion pipeline every morning, ensuring the newspaper always presents the latest dispatches upon first opening.
638: 
639: ---
640: 
641: ## Automated Scheduling
642: 
643: To ensure "The World Dispatch" feels like a real daily newspaper, the backend includes an automated scheduling system.
644: 
645: ### 6 AM Morning Edition
646: 
647: - **Trigger Time**: 06:00 AM Daily.
648: - **Action**: Calls `wipe_and_ingest.py` programmatically.
649: - **Mechanism**: Uses `APScheduler` (`BackgroundScheduler`) integrated into the FastAPI application lifecycle.
650: - **Content Freshness**: By the time the user opens the app in the morning, the database has already been populated with the overnight global dispatches.
651: 
652: ### Managing the Pipeline
653: 
654: The scheduler runs as part of the `uvicorn` process. When the server starts, it automatically initializes the schedule.
655: 655: - **Manual Override**: The ingestion can still be triggered manually via the `/ingest/run` POST endpoint or by running `python backend/wipe_and_ingest.py`.
656: 
657: 7. **Session 7 — "Three.js Engine Migration"**: Fully migrated the newspaper rendering from a DOM-strip based model to a high-fidelity Three.js WebGL scene. Achieved 60FPS fluid motion with a segment-dense PlaneGeometry and custom vertex shaders for ripples. Developed a high-fidelity "Soft Page Turn" effect using cylindrical paper deformation for realistic, elastic transitions. Increased gesture sensitivity for the "Swish" motion to be position-based, matching the near-instant response of the zoom functions.
