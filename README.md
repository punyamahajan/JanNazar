<div align="center">

# जननज़र · JanNazar

### AI-Powered Civic Intelligence Platform

*"Jan" (जन) = People &nbsp;·&nbsp; "Nazar" (नज़र) = Watchful Eye*

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![MUI](https://img.shields.io/badge/MUI-v7-007FFF?logo=mui&logoColor=white)](https://mui.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)

</div>

---

## What is JanNazar?

JanNazar is a full-stack civic intelligence platform that lets citizens report civic issues — potholes, garbage, broken streetlights, flooding, stray animals — using voice, photos, or text in any language. The report flows through a DAG of autonomous AI agents that transcribe, translate, classify, deduplicate, route, and prioritise it automatically. Every agent streams its internal reasoning to the screen in real time so citizens can watch the AI think.

This is not a complaint box. It is an AI system with an auditable, transparent pipeline.

---

## Table of Contents

1. [Features](#features)
2. [Pages & Routes](#pages--routes)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Component Reference](#component-reference)
6. [Type Reference](#type-reference)
7. [Hooks Reference](#hooks-reference)
8. [Database Schema](#database-schema)
9. [Environment Variables](#environment-variables)
10. [Windows Setup — Step by Step](#windows-setup--step-by-step)
11. [Supabase Setup — Step by Step](#supabase-setup--step-by-step)
12. [Running the Project](#running-the-project)
13. [Available Scripts](#available-scripts)
14. [Troubleshooting](#troubleshooting)
15. [Roadmap](#roadmap)
16. [License](#license)

---

## Features

### Core Platform

| Feature | Description |
|---|---|
| **Multi-modal Reporting** | Citizens submit via voice recording, photo/video upload, or typed text in any language |
| **Autonomous AI Agent Pipeline** | 7 agents (Speech → Vision → Translation → Classification → Dedup → Routing → Priority) run in a DAG with partial parallelism |
| **Live Chain-of-Thought** | Every agent streams its internal thoughts to the UI in real time — not a spinner, actual reasoning |
| **CivicGPT** | RAG-powered civic chat assistant; query the entire issues database in natural language |
| **Live Civic Map** | Leaflet map with colour-coded category markers, urgency-based sizing, real-time updates via Supabase Realtime |
| **Community Feed** | Real-time stream of all reported issues, live-updating on INSERT/UPDATE via Supabase Realtime |
| **Issue Detail** | Full issue view with AI summary, media, stats, real-time comments, official authority responses |
| **Analytics Dashboard** | Category breakdown bar chart, 7-day reported vs resolved trend line, department performance table |
| **Admin Panel** | Issue queue with status management, full AI agent log viewer with expandable reasoning traces |
| **Trust & Gamification** | Citizen trust scores, achievement badges, community leaderboard |

### AI Agent Pipeline

Each report triggers this agent graph:

```
                    ┌─────────────────┐
                    │  Report Input   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
     ┌────────────────┐          ┌─────────────────┐
     │  speech_agent  │          │  vision_agent   │
     │ faster-whisper │          │  Qwen2.5-VL-7B  │
     └────────┬───────┘          └────────┬────────┘
              └──────────────┬────────────┘
                             ▼
                  ┌─────────────────────┐
                  │  translation_agent  │
                  │     IndicTrans2     │
                  └──────────┬──────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
  ┌───────────────────────┐    ┌─────────────────────┐
  │  classification_agent │    │     dedup_agent      │
  │    Qwen3 + CoT        │    │  Qdrant + bge-small  │
  └───────────┬───────────┘    └──────────┬──────────┘
              └──────────────┬────────────┘
                             ▼
                  ┌─────────────────────┐
                  │    routing_agent    │
                  │    Rule engine      │
                  └──────────┬──────────┘
                             ▼
                  ┌─────────────────────┐
                  │   priority_agent    │
                  │   Scoring formula   │
                  └──────────┬──────────┘
                             ▼
                  ┌─────────────────────┐
                  │    Issue Created    │
                  │    in Supabase      │
                  └─────────────────────┘
```

> **Note:** The current frontend uses a simulated agent stream (`useReasoningStream.ts`) since the FastAPI backend is not yet connected. The simulation accurately mirrors the real agent timing and thought patterns.

---

## Pages & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Hero section, feature cards, live stats bar (total/open/resolved issues from Supabase), recent issues grid |
| `/report` | `ReportPage` | 3-step wizard: (1) Capture with voice/photo/text + location, (2) AI agent reasoning stream, (3) Review AI result and confirm submission to Supabase |
| `/map` | `MapPage` | Full-screen Leaflet map with category/status filter sidebar, colour-coded CircleMarkers sized by urgency, slide-over drawer on click |
| `/feed` | `FeedPage` | Paginated issue card grid, live INSERT/UPDATE via Supabase Realtime channel |
| `/issue/:id` | `IssueDetailPage` | Full issue detail: AI summary, media, stats grid, priority gauge, real-time comments section, Supabase Realtime on issue + comments |
| `/analytics` | `AnalyticsPage` | KPI cards, Recharts BarChart (issues by category), Recharts LineChart (7-day trend), department performance table with LinearProgress |
| `/civicgpt` | `CivicGPTPage` | Chat interface with CivicGPT; queries loaded issues from Supabase; keyword-based RAG with source citations |
| `/admin` | `AdminPage` | Tabbed: Issues Queue (table with inline status dropdowns calling Supabase UPDATE) + Agent Logs (expandable accordion with full reasoning traces) |
| `/profile` | `ProfilePage` | Citizen profile card with trust score, badges list, community leaderboard table with civic scores |

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.x | UI framework |
| `react-dom` | 19.x | DOM renderer |
| `typescript` | 5.9.x | Type safety |
| `vite` | 8.x | Build tool + dev server with HMR |
| `@vitejs/plugin-react` | 6.x | React Fast Refresh in Vite |

### UI & Styling

| Package | Version | Purpose |
|---|---|---|
| `@mui/material` | 7.x | Component library (all UI elements) |
| `@mui/icons-material` | 7.x | Material icon set |
| `@emotion/react` | 11.x | MUI's CSS-in-JS engine |
| `@emotion/styled` | 11.x | MUI's styled components |
| `@fontsource/roboto` | 5.x | Local Roboto font (300/400/500/700 weights) |
| `framer-motion` | 12.x | Page transitions, list animations, chat messages |

### Data & Maps

| Package | Version | Purpose |
|---|---|---|
| `recharts` | 3.x | Bar charts, line charts, responsive containers |
| `leaflet` | 1.9.x | Interactive map engine |
| `react-leaflet` | 5.x | React bindings for Leaflet |
| `@types/leaflet` | 1.9.x | TypeScript types for Leaflet |

### Routing

| Package | Version | Purpose |
|---|---|---|
| `react-router-dom` | 7.x | Client-side routing, `useNavigate`, `useParams`, `useLocation` |

### Backend / Database

| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | 2.x | Supabase client — queries, auth, Realtime, storage |

### Dev Tools

| Package | Version | Purpose |
|---|---|---|
| `eslint` | 9.x | Linting |
| `typescript-eslint` | 8.x | TS-aware lint rules |
| `eslint-plugin-react-hooks` | 7.x | Hooks lint rules |
| `eslint-plugin-react-refresh` | 0.5.x | Vite Fast Refresh lint rules |

---

## Project Structure

```
JanNazar/
│
├── public/                          # Static assets served at root
│   ├── favicon.svg                  # JanNazar civic dome favicon
│   └── icons.svg                    # SVG icon sprite
│
├── src/                             # All application source code
│   │
│   ├── main.tsx                     # React 19 entry point
│   │                                # Mounts <App /> into #root
│   │                                # Imports Roboto font weights
│   │
│   ├── App.tsx                      # Root component
│   │                                # Wraps ThemeProvider + CssBaseline
│   │                                # Defines BrowserRouter + all Routes
│   │
│   ├── theme.ts                     # MUI dark theme configuration
│   │                                # Colour palette (purple/blue/green)
│   │                                # Typography (Inter + Roboto stack)
│   │                                # Component overrides (Card, Button,
│   │                                #   AppBar, TextField, Drawer, etc.)
│   │                                # Exports: theme (default),
│   │                                #          glassCard (sx object),
│   │                                #          accentGlow (fn)
│   │
│   ├── vite-env.d.ts                # Vite client type reference
│   │
│   ├── lib/
│   │   └── supabase.ts              # Supabase client singleton
│   │                                # Reads VITE_SUPABASE_URL +
│   │                                #   VITE_SUPABASE_ANON_KEY from env
│   │                                # Exports: supabase (createClient)
│   │
│   ├── types/
│   │   ├── issue.ts                 # All domain TypeScript types:
│   │   │                            #   IssueStatus, IssueUrgency,
│   │   │                            #   IssueCategory, Issue, IssueEvent,
│   │   │                            #   Comment, UserProfile, Department,
│   │   │                            #   AgentLog, Badge, AIPreview
│   │   │
│   │   └── agent.ts                 # AI agent types:
│   │                                #   AgentThought, AgentEvent, AIPreview
│   │
│   ├── hooks/
│   │   └── useReasoningStream.ts    # Hook: simulates the AI agent pipeline
│   │                                # Takes: reportId (string | null)
│   │                                # Returns: { thoughts, activeAgent,
│   │                                #   completed, isDone, issueId, reset }
│   │                                # Runs 7 agents sequentially, streaming
│   │                                #   thoughts with randomised delays
│   │
│   ├── components/
│   │   │
│   │   ├── analytics/
│   │   │   └── KPICard.tsx          # Metric card with icon, value, subtitle
│   │   │                            # Props: title, value, icon, color,
│   │   │                            #        subtitle, trend?
│   │   │
│   │   ├── issue/
│   │   │   └── IssueCard.tsx        # Clickable issue summary card
│   │   │                            # Props: issue (Issue), compact? (bool)
│   │   │                            # Shows: media thumbnail (non-compact),
│   │   │                            #   category badge, status pill,
│   │   │                            #   title, ai_summary, location,
│   │   │                            #   upvotes, verified_count, time ago,
│   │   │                            #   priority gauge, upvote button
│   │   │                            # Navigates to /issue/:id on click
│   │   │
│   │   ├── layout/
│   │   │   └── Navbar.tsx           # Fixed top navigation bar
│   │   │                            # Desktop: logo + nav buttons + CTA
│   │   │                            # Mobile: hamburger + right Drawer
│   │   │                            # Active route highlighted in purple
│   │   │                            # Routes: Map, Feed, Analytics,
│   │   │                            #   CivicGPT, Admin, Profile
│   │   │
│   │   ├── report/
│   │   │   └── ReasoningStream.tsx  # AI agent reasoning visualiser
│   │   │                            # Props: reportId, onComplete?
│   │   │                            # Uses useReasoningStream hook
│   │   │                            # Shows each of 7 agents with:
│   │   │                            #   spinner (active) / check (done) /
│   │   │                            #   circle (pending), streaming
│   │   │                            #   monospace thought lines
│   │   │
│   │   └── shared/
│   │       ├── CategoryBadge.tsx    # Coloured category label chip
│   │       │                        # Props: category, sx?
│   │       │                        # Exports: getCategoryColor(cat),
│   │       │                        #          getCategoryLabel(cat)
│   │       │                        # 9 categories with distinct colours
│   │       │
│   │       ├── PriorityGauge.tsx    # SVG circular progress gauge
│   │       │                        # Props: score (0-100), size?, showLabel?
│   │       │                        # Colour: green→amber→orange→red
│   │       │                        # Used in: IssueCard, AdminPage,
│   │       │                        #   IssueDetailPage, ProfilePage
│   │       │
│   │       └── StatusPill.tsx       # MUI Chip for status or urgency
│   │                                # Props: status? | urgency?, size?
│   │                                # Status: open/in_progress/resolved/
│   │                                #   closed/duplicate
│   │                                # Urgency: low/medium/high/critical
│   │                                # Critical has pulse animation
│   │
│   └── pages/
│       ├── LandingPage.tsx          # / — Hero, features, stats, recent issues
│       ├── ReportPage.tsx           # /report — 3-step report wizard
│       ├── MapPage.tsx              # /map — Full-screen Leaflet map
│       ├── FeedPage.tsx             # /feed — Realtime issue grid
│       ├── IssueDetailPage.tsx      # /issue/:id — Full issue + comments
│       ├── AnalyticsPage.tsx        # /analytics — Charts + dept table
│       ├── CivicGPTPage.tsx         # /civicgpt — AI chat interface
│       ├── AdminPage.tsx            # /admin — Queue + agent logs
│       └── ProfilePage.tsx          # /profile — Trust score + leaderboard
│
├── supabase/
│   └── migrations/
│       └── 20260626012032_jannazar_initial_schema.sql
│                                    # Complete database schema:
│                                    # PostGIS extension, 8 tables,
│                                    # RLS policies, indexes,
│                                    # department seed data
│
├── .env.example                     # Template for required env vars
├── .gitignore                       # Ignores node_modules, dist, *.local
├── index.html                       # HTML entry point
├── package.json                     # Dependencies + scripts
├── vite.config.ts                   # Vite config (React plugin)
├── tsconfig.json                    # Root TS config (project references)
├── tsconfig.app.json                # App TS config (src/ files)
├── tsconfig.node.json               # Node TS config (vite.config.ts)
└── eslint.config.js                 # ESLint flat config
```

---

## Component Reference

### `<KPICard />`

```tsx
import { KPICard } from './components/analytics/KPICard';

<KPICard
  title="Total Open"
  value={42}
  subtitle="active issues"
  icon={AssignmentOutlinedIcon}   // MUI SvgIconComponent
  color="#7c3aed"                  // accent colour for icon bg + text
  trend={{ value: 12, label: 'vs last week' }}  // optional
/>
```

### `<IssueCard />`

```tsx
import { IssueCard } from './components/issue/IssueCard';

<IssueCard issue={issue} />           // full card with image
<IssueCard issue={issue} compact />   // compact card (no image, no summary)
```

### `<CategoryBadge />`

```tsx
import { CategoryBadge, getCategoryColor } from './components/shared/CategoryBadge';

<CategoryBadge category="potholes" />
<CategoryBadge category={issue.category} sx={{ ml: 1 }} />

// Utility
const color = getCategoryColor('water');  // '#3b82f6'
```

**Category colours:**

| Category | Colour |
|---|---|
| potholes | `#f97316` (orange) |
| garbage | `#84cc16` (lime) |
| streetlight | `#f59e0b` (amber) |
| water | `#3b82f6` (blue) |
| flood | `#0ea5e9` (sky) |
| tree | `#10b981` (emerald) |
| animal | `#8b5cf6` (violet) |
| construction | `#6366f1` (indigo) |
| other | `rgba(255,255,255,0.4)` |

### `<StatusPill />`

```tsx
import { StatusPill } from './components/shared/StatusPill';

<StatusPill status="open" />
<StatusPill status="in_progress" />
<StatusPill status="resolved" />
<StatusPill urgency="critical" />   // pulses
<StatusPill urgency="high" />
```

### `<PriorityGauge />`

```tsx
import { PriorityGauge } from './components/shared/PriorityGauge';

<PriorityGauge score={68} />             // default 60px
<PriorityGauge score={68} size={36} />   // compact for tables
<PriorityGauge score={68} size={64} showLabel />
```

### `<ReasoningStream />`

```tsx
import { ReasoningStream } from './components/report/ReasoningStream';

<ReasoningStream
  reportId={reportId}          // string — triggers the stream
  onComplete={(issueId) => {}} // called when all 7 agents finish
/>
```

### `<Navbar />`

No props. Reads current route from `useLocation()` for active state. Responsive — collapses to hamburger below `md` breakpoint.

---

## Type Reference

### `Issue`

The central domain type. Every page works with this.

```ts
interface Issue {
  id: string;
  reporter_id: string | null;
  title: string;
  description_raw: string | null;    // original language
  description_en: string | null;     // translated to English
  category: IssueCategory | null;
  subcategory: string | null;
  status: IssueStatus;
  urgency: IssueUrgency;
  priority_score: number;            // 0–100, computed by priority_agent
  confidence: number | null;         // 0–1, AI classification confidence
  lat: number;
  lng: number;
  address: string | null;
  department: string | null;         // assigned municipal department
  assigned_to: string | null;        // UUID of assigned authority user
  duplicate_of: string | null;       // UUID of original if duplicate
  ai_summary: string | null;         // 1-sentence AI-generated summary
  estimated_eta: string | null;      // e.g. "5–7 days"
  upvotes: number;
  verified_count: number;
  media_urls: string[] | null;       // array of public URLs
  created_at: string;                // ISO timestamp
  updated_at: string;
  resolved_at: string | null;
}
```

### `IssueStatus`

```ts
type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed' | 'duplicate';
```

### `IssueUrgency`

```ts
type IssueUrgency = 'low' | 'medium' | 'high' | 'critical';
```

### `IssueCategory`

```ts
type IssueCategory =
  | 'potholes' | 'garbage' | 'streetlight' | 'water'
  | 'flood' | 'tree' | 'animal' | 'construction' | 'other';
```

### `Comment`

```ts
interface Comment {
  id: string;
  issue_id: string;
  user_id: string | null;
  body: string;
  is_official: boolean;   // true = authority response (shown with green badge)
  created_at: string;
}
```

### `Department`

```ts
interface Department {
  id: string;
  name: string;
  contact_email: string | null;
  avg_resolution_days: number | null;
  resolution_rate: number | null;    // 0–1 float
}
```

### `AgentThought`

```ts
interface AgentThought {
  agent: string;    // e.g. 'speech_agent'
  thought: string;  // e.g. 'Detected language: Hindi'
  ts: number;       // Date.now() timestamp
}
```

---

## Hooks Reference

### `useReasoningStream(reportId)`

Simulates the 7-agent AI pipeline, streaming thoughts with realistic timing.

```ts
const {
  thoughts,      // AgentThought[] — all streamed thoughts so far
  activeAgent,   // string | null — currently running agent name
  completed,     // string[] — agent names that have finished
  isDone,        // boolean — true when all 7 agents complete
  issueId,       // string | null — set to reportId when done
  reset,         // () => void — resets all state
} = useReasoningStream(reportId);
```

**Agent sequence and timing:** Each thought is delivered 400–1000ms apart. Agents are sequential at the orchestrator level but Speech and Vision are described as parallel in the UI (future: true parallelism when FastAPI backend is connected).

---

## Database Schema

### Overview

8 PostgreSQL tables, all with Row Level Security enabled. Managed via Supabase.

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Matches `auth.uid()` |
| `email` | TEXT UNIQUE | |
| `full_name` | TEXT | |
| `phone` | TEXT | |
| `avatar_url` | TEXT | |
| `trust_score` | INTEGER | Default 50, max 100 |
| `role` | TEXT | `citizen` / `authority` / `admin` |
| `created_at` | TIMESTAMPTZ | |

#### `issues`
| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `reporter_id` | UUID → users | Nullable (anon reports) |
| `title` | TEXT | Max 120 chars recommended |
| `description_raw` | TEXT | Original language |
| `description_en` | TEXT | English translation |
| `category` | TEXT | IssueCategory enum values |
| `subcategory` | TEXT | |
| `status` | TEXT | Default `open` |
| `urgency` | TEXT | Default `medium` |
| `priority_score` | INTEGER | 0–100 |
| `confidence` | FLOAT | 0–1 |
| `lat` | FLOAT | Required |
| `lng` | FLOAT | Required |
| `address` | TEXT | Human-readable |
| `department` | TEXT | Assigned dept name |
| `assigned_to` | UUID → users | |
| `duplicate_of` | UUID → issues | Self-reference |
| `ai_summary` | TEXT | 1-sentence summary |
| `estimated_eta` | TEXT | e.g. "5–7 days" |
| `upvotes` | INTEGER | Default 0 |
| `verified_count` | INTEGER | Default 0 |
| `media_urls` | TEXT[] | Array of URLs |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `resolved_at` | TIMESTAMPTZ | Nullable |

**Indexes:** `status`, `category`, `created_at DESC`, `(lat, lng)`

#### `issue_events`
Immutable audit log. Event types: `created`, `status_change`, `comment`, `vote`, `assigned`, `resolved`, `proof_uploaded`.

#### `comments`
Threaded comments on issues. `is_official: true` = authority response (rendered with green badge).

#### `votes`
Unique constraint on `(issue_id, user_id, type)` prevents double-voting. Vote types: `upvote`, `verified`, `resolved_confirmed`.

#### `agent_logs`
Full per-run logs for every AI agent. Stores `input`, `output`, `thoughts[]`, `duration_ms`.

#### `departments`
Pre-seeded with 8 municipal departments including SLA stats.

**Seeded departments:**
- Roads & Infrastructure — 8.5 days avg, 74% resolution
- Sanitation & Waste — 3.2 days avg, 88% resolution
- Water & Sewerage — 5.1 days avg, 71% resolution
- Electricity & Streetlights — 2.8 days avg, 91% resolution
- Parks & Horticulture — 6.3 days avg, 65% resolution
- Animal Control — 1.5 days avg, 93% resolution
- Building & Construction — 12.0 days avg, 58% resolution
- Flood & Drainage — 4.7 days avg, 69% resolution

#### `badges`
Gamification badges awarded to citizens. Badge types: `first_report`, `verified_citizen`, `top_reporter`, `streak`.

### Row Level Security Summary

| Table | anon SELECT | auth INSERT | auth UPDATE | auth DELETE |
|---|---|---|---|---|
| users | ✅ (public profiles) | own row only | own row only | own row only |
| issues | ✅ | reporter_id = uid | reporter_id = uid | reporter_id = uid |
| issue_events | ✅ | actor_id = uid | actor_id = uid | actor_id = uid |
| comments | ✅ | user_id = uid | user_id = uid | user_id = uid |
| votes | ✅ | user_id = uid | user_id = uid | user_id = uid |
| agent_logs | ✅ | any auth user | any auth user | any auth user |
| departments | ✅ | any auth user | any auth user | any auth user |
| badges | ✅ | any auth user | any auth user | any auth user |

---

## Environment Variables

Create a file named `.env.local` in the project root (never commit this file):

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

| Variable | Where to find it | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → Project API Keys → `anon` `public` | ✅ Yes |

> **Important:** Variables must be prefixed with `VITE_` to be exposed to the browser by Vite. Never put the `service_role` key in a `.env.local` file — that key bypasses RLS and must only be used server-side.

---

## Windows Setup — Step by Step

This is a complete guide to get JanNazar running on Windows from zero. Follow every step in order.

---

### Step 1 — Install Node.js

1. Go to **https://nodejs.org**
2. Download the **LTS** version (the left green button — do not download "Current")
3. Run the downloaded `.msi` installer
4. On the "Tools for Native Modules" screen, check **"Automatically install the necessary tools"** if prompted
5. Click through and finish the installation
6. **Verify:** Open a new **Command Prompt** (Win + R → type `cmd` → Enter) and run:
   ```cmd
   node --version
   npm --version
   ```
   You should see version numbers like `v22.x.x` and `10.x.x`. If you get `'node' is not recognized`, restart your computer and try again.

---

### Step 2 — Install Git (if you don't have it)

1. Go to **https://git-scm.com/download/win**
2. Download and run the installer
3. During install, select **"Git from the command line and also from 3rd-party software"** when asked about PATH
4. Everything else can stay as default
5. **Verify:** In Command Prompt:
   ```cmd
   git --version
   ```
   Should show `git version 2.x.x`

---

### Step 3 — Get the project files

**Option A — If you have the ZIP file:**

1. Right-click the ZIP file → **Extract All...**
2. Choose a destination like `C:\Projects\JanNazar`
3. Click Extract

**Option B — If you are cloning from Git:**

```cmd
git clone https://github.com/your-org/jannazar.git
cd jannazar
```

---

### Step 4 — Open the project in a terminal

1. Open **File Explorer** and navigate to your project folder (e.g. `C:\Projects\JanNazar\JanNazar-main`)
2. In the address bar at the top, click once to select it, type `cmd`, and press Enter
   - This opens a Command Prompt **already in the right folder**
3. Alternatively: open Command Prompt and type:
   ```cmd
   cd C:\Projects\JanNazar\JanNazar-main
   ```

---

### Step 5 — Install dependencies

In the Command Prompt (inside the project folder), run:

```cmd
npm install
```

This downloads all packages listed in `package.json` into a `node_modules` folder. It may take 1–3 minutes on first run. You will see a lot of output — this is normal.

When it finishes you should see something like:
```
added 847 packages in 45s
```

If you see errors, see the [Troubleshooting](#troubleshooting) section below.

---

### Step 6 — Create your environment file

1. In File Explorer, make sure **"Show hidden items"** and **"File name extensions"** are turned on:
   - Open File Explorer → View → tick "Hidden items" and "File name extensions"
2. In the project folder, find the file `.env.example`
3. Copy it (Ctrl+C) and paste it (Ctrl+V) in the same folder
4. Rename the copy to `.env.local`
   - Right-click → Rename → type `.env.local` → press Enter
   - If Windows warns you about changing the extension, click Yes
5. Open `.env.local` with Notepad (right-click → Open with → Notepad)
6. You will see:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
7. Replace the placeholder values with your real Supabase credentials (see [Supabase Setup](#supabase-setup--step-by-step) below)
8. Save the file (Ctrl+S) and close Notepad

---

### Step 7 — Set up Supabase

See the full [Supabase Setup](#supabase-setup--step-by-step) section below, then come back here.

---

### Step 8 — Start the development server

In your Command Prompt (in the project folder):

```cmd
npm run dev
```

You should see output like:

```
  VITE v8.x.x  ready in 800 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

Open your browser and go to **http://localhost:5173**

You should see the JanNazar landing page with the purple gradient hero. If you have set up Supabase correctly, the stats bar at the bottom of the hero will show live numbers from your database.

---

### Step 9 — Keep the server running

The development server runs until you close the Command Prompt or press `Ctrl + C`. Leave it open while you work. Vite has Hot Module Replacement (HMR) — changes to files appear in the browser instantly without a full reload.

---

## Supabase Setup — Step by Step

### 1. Create a Supabase account and project

1. Go to **https://supabase.com** and click **Start your project**
2. Sign up with GitHub, Google, or email
3. Click **New project**
4. Fill in:
   - **Name:** `JanNazar` (or anything you like)
   - **Database Password:** choose a strong password and **save it somewhere** — you will need it if you use the CLI later
   - **Region:** choose the closest to you (e.g. South Asia if you are in India)
5. Click **Create new project**
6. Wait 1–2 minutes for the project to provision — you will see a progress screen

---

### 2. Get your API credentials

1. In your Supabase project, click the **Settings** icon (gear) in the left sidebar
2. Click **API**
3. You will see:
   - **Project URL** — looks like `https://abcdefghijklmnop.supabase.co`
   - **Project API Keys** section with two keys:
     - `anon` `public` — this is your `VITE_SUPABASE_ANON_KEY`
     - `service_role` `secret` — **do not use this one in the frontend**
4. Copy the **Project URL** into `.env.local` as `VITE_SUPABASE_URL`
5. Copy the **anon / public** key into `.env.local` as `VITE_SUPABASE_ANON_KEY`

---

### 3. Run the database migration

This creates all 8 tables, enables RLS, creates indexes, and seeds the departments data.

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/migrations/20260626012032_jannazar_initial_schema.sql` from the project folder in Notepad
4. Select all the content (Ctrl+A), copy it (Ctrl+C)
5. Paste it into the Supabase SQL Editor (Ctrl+V)
6. Click the green **Run** button (or press Ctrl+Enter)
7. You should see `Success. No rows returned` at the bottom
8. Verify: click **Table Editor** in the left sidebar — you should see all 8 tables listed

---

### 4. Enable Realtime

Supabase Realtime must be explicitly enabled per table for live updates to work.

1. In your Supabase project, click **Database** in the left sidebar
2. Click **Replication**
3. Under **Tables**, find `issues` and toggle it **ON**
4. Also toggle **ON** for `comments` and `issue_events`
5. Click **Save**

This enables the `postgres_changes` events that the Feed, Map, and IssueDetail pages subscribe to.

---

### 5. (Optional) Add seed issue data

To see the map and feed working immediately with sample data, run this in the SQL Editor:

```sql
INSERT INTO issues (title, description_en, category, status, urgency, priority_score, lat, lng, address, department, ai_summary, upvotes, verified_count, media_urls)
VALUES
  ('Large pothole on MG Road causing accidents', 'A deep pothole has formed near the traffic signal. Multiple vehicles have been damaged.', 'potholes', 'open', 'high', 72, 12.9716, 77.5946, 'MG Road, Bengaluru', 'Roads & Infrastructure', 'Major road damage near arterial junction requiring urgent repair.', 14, 6, ARRAY['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400']),
  ('Overflowing garbage bin near market', 'The bin outside City Market has not been collected in 5 days. Severe smell.', 'garbage', 'in_progress', 'medium', 45, 12.9634, 77.5855, 'City Market, Bengaluru', 'Sanitation & Waste', 'Uncollected waste causing health hazard near public market.', 8, 3, NULL),
  ('Streetlight out on 100 Feet Road', 'Three consecutive streetlights are off. The stretch is very dark at night.', 'streetlight', 'open', 'medium', 38, 12.9850, 77.6101, '100 Feet Road, Indiranagar', 'Electricity & Streetlights', 'Multiple streetlights non-functional creating safety risk on busy road.', 5, 2, NULL),
  ('Water pipe burst flooding footpath', 'A water main has burst near the bus stop. Footpath is completely flooded.', 'water', 'open', 'critical', 89, 12.9551, 77.6012, 'Koramangala 5th Block', 'Water & Sewerage', 'Burst water main flooding pedestrian area — immediate intervention required.', 23, 11, NULL),
  ('Fallen tree blocking road', 'A large tree has fallen across the road after last night rain. Road blocked.', 'tree', 'in_progress', 'high', 81, 12.9901, 77.5901, 'Sadashivanagar, Bengaluru', 'Parks & Horticulture', 'Fallen tree blocking vehicular traffic on residential road.', 19, 8, NULL);
```

---

### 6. (Optional) Set up Storage for media uploads

If you want the media upload feature to actually store files (currently it uses a placeholder Unsplash URL):

1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it `issue-media`
4. Check **Public bucket** (so media URLs are publicly accessible)
5. Click **Save**

Then update the bucket policy — in the SQL Editor:

```sql
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'issue-media');

CREATE POLICY "Auth upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'issue-media');
```

---

## Running the Project

### Development

```cmd
npm run dev
```

Opens at **http://localhost:5173** with Hot Module Replacement.

### Build for production

```cmd
npm run build
```

Outputs to `dist/`. The build runs TypeScript type checking first (`tsc -b`) then Vite bundling.

### Preview the production build

```cmd
npm run preview
```

Serves the `dist/` folder locally at **http://localhost:4173** to test the production build before deploying.

### Lint

```cmd
npm run lint
```

Runs ESLint across all TypeScript files.

---

## Available Scripts

| Script | Command | What it does |
|---|---|---|
| `dev` | `vite` | Start dev server with HMR at localhost:5173 |
| `build` | `tsc -b && vite build` | Type-check then bundle to `dist/` |
| `preview` | `vite preview` | Serve `dist/` at localhost:4173 |
| `lint` | `eslint .` | Lint all TS/TSX files |

---

## Troubleshooting

### `npm install` fails with permission errors on Windows

Run Command Prompt as Administrator: Start menu → search "cmd" → right-click → **Run as administrator** → navigate to project folder → `npm install`

---

### `npm install` fails with network/registry errors

Try switching npm to use a different registry:
```cmd
npm install --registry https://registry.npmjs.org
```

Or if you are behind a corporate proxy, you may need to configure npm's proxy settings.

---

### `'node' is not recognized as an internal or external command`

Node.js is not on your system PATH. Reinstall Node.js from https://nodejs.org and make sure to restart your computer after installation.

---

### The page loads but shows no data / blank cards

Your `.env.local` file is either missing, has wrong values, or is named incorrectly.

1. Check the file is named exactly `.env.local` (not `.env.local.txt`)
2. Check there are no spaces around the `=` sign
3. Check the URL does not have a trailing slash
4. Restart `npm run dev` after editing `.env.local` — Vite does not hot-reload env files

---

### The map does not load / shows grey tiles

This is a Leaflet CSS issue. Make sure `import 'leaflet/dist/leaflet.css'` is present in `MapPage.tsx` (it is, by default). If tiles are grey, check your internet connection — tiles are loaded from CartoDB's CDN.

---

### `VITE_SUPABASE_URL is not defined` error in the browser console

Your `.env.local` file is not being picked up. Ensure:
- The file is in the **project root** (same folder as `package.json`)
- The file name starts with a dot: `.env.local`
- You restarted `npm run dev` after creating it

---

### Supabase returns `new row violates row-level security policy`

This happens when trying to insert without being authenticated, or with the wrong `user_id`. The current app does not have a login flow yet — inserts that require `reporter_id = auth.uid()` will fail for anonymous users. The `ReportPage` currently sends `reporter_id` as null, which is allowed by the schema. If you see this error, check the specific policy for the table you are writing to.

---

### TypeScript errors on `npm run build`

Run `npm run lint` first to see all issues. Common causes:
- A variable used before it could be null — add a null check
- Missing `await` on an async Supabase call
- Type mismatch between API response and interface — check `types/issue.ts`

---

### Port 5173 already in use

Either close the other terminal running `npm run dev`, or start on a different port:
```cmd
npm run dev -- --port 3000
```

---

## Roadmap

- [ ] Authentication — login/signup with Supabase Auth (email + Google OAuth)
- [ ] FastAPI backend — connect the real AI agent pipeline (speech, vision, classification)
- [ ] Supabase Storage — upload actual images/videos instead of placeholder URLs
- [ ] Auth guards — protect `/admin` and `/report` for authenticated users only
- [ ] Push notifications — Supabase Realtime → toast notifications for issue updates
- [ ] PWA — make the app installable on Android/iOS for field reporters
- [ ] Multilingual UI — i18n for Hindi, Kannada, Tamil interface text
- [ ] Department portal — separate view for authority users to manage their queue
- [ ] Export — CSV/PDF export of issues and analytics

---

## License

MIT — free to use, modify, and distribute.

---

<div align="center">

Built with ❤️ for civic transparency

**जननज़र — Every issue, seen. Every agent, auditable.**

</div>
