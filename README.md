# 🎯 ApplyTrack

> **A Cal AI / Linear-style minimal job application tracker with Zero-Effort Gmail Sync, AI Follow-Up Ghostwriter, and PWA Mobile Share Target.**

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://apply-track-1h5z.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://applytrack-580j.onrender.com/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black?style=flat&logo=fastify)](https://www.fastify.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Postgres-Neon-00E599?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Upstash Redis](https://img.shields.io/badge/Redis-Upstash-00E599?style=flat&logo=redis)](https://upstash.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20Llama%203.3-F55036?style=flat)](https://groq.com/)

---

## 🌐 Live Production Links

| Service | Platform | URL | Status |
| :--- | :--- | :--- | :--- |
| **Frontend PWA** | Vercel | [https://apply-track-1h5z.vercel.app](https://apply-track-1h5z.vercel.app) | ![Status](https://img.shields.io/badge/Live-Vercel-success) |
| **Backend REST API** | Render | [https://applytrack-580j.onrender.com](https://applytrack-580j.onrender.com) | ![Status](https://img.shields.io/badge/Live-Render-success) |
| **API Health Check** | Render | [https://applytrack-580j.onrender.com/health](https://applytrack-580j.onrender.com/health) | `{"status":"ok"}` |

---

## ⚡ The Problem & The Solution

### The Pain Point
Job seekers apply to 30–50+ roles across LinkedIn, careers pages, and cold emails.
- **90% of cold emails die** because candidates forget to follow up on time.
- **Manual spreadsheets are boring** and get abandoned within days.
- **Tracking on mobile is broken**: Chrome extensions do not work when you send emails from the Gmail mobile app.

### The ApplyTrack Way (Zero Manual Effort)
1. **Gmail Auto-Sync (Killer Feature):** Connect Gmail once. When you send a cold application from your phone or desktop, ApplyTrack detects it in real-time via Google Cloud Pub/Sub and prompts: *"Track email to Swiggy?"* — 1 tap to track.
2. **Linear-Inspired Kanban Board:** Minimal, keyboard-first, distraction-free board (`Applied` ➔ `Screening` ➔ `OA / Technical` ➔ `Interview` ➔ `Offer` / `Rejected`).
3. **AI Follow-Up Ghostwriter:** Powered by **Groq Llama 3.3 70B**. Automatically monitors threads. If no reply arrives by Day 4, Day 8, or Day 14, it generates a hyper-personalized follow-up draft citing your real projects and skills.
4. **Resume AI Context Vault:** 1-click in-memory PDF parsing (`pdf-parse`). Extracts your target role, top skills, and portfolio projects into AI context — with **Zero Permanent File Storage** for maximum privacy.
5. **Mobile-First PWA & Share Target:** Installable on Android & iOS. Direct **Android Web Share Target** integration lets you share job links directly from LinkedIn or Chrome into ApplyTrack.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Frontend)"]
        SPA["React SPA (TypeScript + Vite)"]
        PWA["PWA Service Worker + Push Receiver"]
        ShareTarget["Android Web Share Target"]
    end

    subgraph IngestionGateway["API & Ingestion Gateway (Render)"]
        FastifyServer["Fastify REST Server"]
        JWTSentry["JWT Sentry Guard"]
        PubSubWebhook["Google Cloud Pub/Sub Webhook"]
    end

    subgraph AsyncTier["Async Queue Workers (BullMQ)"]
        IngestQ["Queue: Email Ingestion & Noise Filtering"]
        WatchQ["Queue: Gmail Watch Renewal Worker"]
        CronQ["Queue: Follow-up & Radar Worker"]
    end

    subgraph PersistenceTier["Persistence & Cache"]
        Postgres[(Neon PostgreSQL - Prisma ORM)]
        RedisCache[(Upstash Serverless Redis)]
    end

    subgraph ExternalEcosystem["External Services"]
        GooglePubSub["Google Cloud Pub/Sub"]
        GmailAPI["Gmail API (metadata / users.watch)"]
        GroqAI["Groq AI (Llama 3.3 70B Versatile)"]
    end

    %% Client Communication
    SPA <-->|REST API + JWT| FastifyServer
    PWA <-->|Push Subscriptions| FastifyServer
    ShareTarget --> SPA

    %% Ingestion Flow
    GmailAPI -->|Mailbox Delta Notification| GooglePubSub
    GooglePubSub -->|Push Webhook| PubSubWebhook
    PubSubWebhook --> FastifyServer

    %% Server to Async & Cache
    FastifyServer -->|Dispatch Ingest Job| IngestQ
    FastifyServer <--> RedisCache
    FastifyServer <--> Postgres
    FastifyServer <--> GroqAI

    %% Workers
    IngestQ --> IngestionGateway
    WatchQ --> GmailAPI
    CronQ --> GroqAI
```

---

## 🚀 Key Feature Pillars

### 1. 📬 Zero-Manual Gmail Sync
- Listens to mailbox events via Gmail `users.watch()` and Google Cloud Pub/Sub.
- Built-in **Domain Filter & Noise Blocker**: Ignores GitHub, Google, LinkedIn notifications, promotions, and newsletter noise.
- **Privacy-First**: Uses restricted `gmail.metadata` scope. **Never stores your email body text** — only thread IDs, timestamps, company names, and status updates.

### 2. 📋 Minimalist Kanban Board
- Cal AI / Linear dark aesthetics with subtle micro-animations.
- Drag-and-drop state transitions with optimistic updates.
- Quick filters, global search (`Ctrl + K`), and job stage metrics (Total, Active, Response Rate).

### 3. ✍️ AI Follow-Up Ghostwriter
- Multi-tier intelligent cadences:
  - **Day 4:** Gentle 3-sentence bump.
  - **Day 8:** Value-add project highlight.
  - **Day 14:** Polite closure / break-up email.
- Pulls live candidate skills & recent projects from the Profile Context Vault.
- 1-click in-thread drafting directly in Gmail.

### 4. 📄 In-Memory Resume Vault
- Upload your PDF resume once.
- Parsed completely in-memory using `pdf-parse` + Groq AI structuring.
- Automatically extracts Target Role, Top 4 Skills, Portfolio Link, and Project Summaries.
- **Zero permanent disk storage** to prevent document leaks.

### 5. 📱 Installable PWA & Share Target
- Works offline with service worker caching.
- Add to Home Screen on iOS & Android.
- Native Android Share Sheet target: Browse LinkedIn ➔ Tap "Share" ➔ Select "ApplyTrack" ➔ Job details automatically populated.

---

## 🛠️ Tech Stack Breakdown

### Frontend (`client/`)
- **Framework:** React 18 with TypeScript & Vite
- **Styling:** Custom Vanilla CSS Design System (Linear dark mode, zero bulky CSS frameworks)
- **Icons:** Lucide React
- **PWA:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Android Share Target API
- **Deployment:** Vercel SPA (`client/vercel.json`)

### Backend (`server/`)
- **Runtime & Framework:** Node.js 24 + Fastify (high-throughput, ultra-low overhead)
- **Validation:** Zod (fail-fast environment and payload validation)
- **Background Jobs:** BullMQ + Upstash Redis
- **Security:** AES-256-GCM token encryption for OAuth refresh tokens, Fastify JWT session management
- **AI Engine:** Groq SDK (`llama-3.3-70b-versatile`)
- **Deployment:** Render Web Service (`render.yaml`)

### Database (`packages/database/`)
- **Engine:** PostgreSQL (Neon Serverless)
- **ORM:** Prisma 6 with strict TypeScript client generation
- **Data Integrity:** Strict soft-delete architecture (`isArchived`), foreign key cascade protection

---

## 📁 Repository Structure

```
ApplyTrack/
├── client/                     # Frontend React SPA & PWA
│   ├── public/                 # Icons, manifest.json, sw.js
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, MobileBottomNav
│   │   ├── features/
│   │   │   ├── applications/   # Kanban Board, List View, Add Modal
│   │   │   ├── auth/           # LoginModal, OAuth hooks, Token Vault
│   │   │   ├── followups/      # AI Ghostwriter cards, Cadence tracker
│   │   │   └── profile/        # Resume Parser Popover & Context Vault
│   │   ├── styles/             # Global Linear-inspired Design System
│   │   └── config/             # Dynamic API base URL resolution
│   └── vercel.json             # Vercel SPA routing & PWA headers
│
├── server/                     # Backend Fastify API & Workers
│   ├── src/
│   │   ├── modules/
│   │   │   ├── applications/   # Job CRUD & status pipeline
│   │   │   ├── auth/           # Google & GitHub OAuth controllers
│   │   │   ├── followups/      # Groq AI generation & cadence engine
│   │   │   └── profile/        # In-memory PDF parser & context API
│   │   ├── queues/             # BullMQ background workers
│   │   ├── services/           # Gmail API & Web Push services
│   │   ├── plugins/            # JWT, Prisma, CORS plugins
│   │   └── config/             # Zod environment schema & sanitization
│   └── Dockerfile              # Container definition for server
│
├── packages/
│   └── database/               # Shared Prisma Schema & Client
│       └── prisma/
│           └── schema.prisma   # PostgreSQL Schema (User, Job, Followup)
│
├── render.yaml                 # Render Blueprint for zero-downtime deploy
├── ARCHITECTURE.md             # Detailed engineering design specs
└── README.md                   # Project documentation
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js:** `v20.x` or `v24.x`
- **npm:** `v10.x`+
- **PostgreSQL Database:** Local Postgres or Neon DB URL
- **Redis:** Local Redis or Upstash Redis instance

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/LalitWagh34/ApplyTrack.git
cd ApplyTrack
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `server/` to `.env`:
```bash
cp server/.env.example server/.env
```
Fill in the required variables:
```env
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL (Neon)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"

# Redis (Upstash)
REDIS_URL="rediss://default:password@host:6379"

# Security Keys
JWT_SECRET="your-32-char-random-jwt-secret-key"
TOKEN_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:4000/api/v1/auth/google/callback"

# Groq AI
GROQ_API_KEY="gsk_your_groq_api_key"
GROQ_MODEL="llama-3.3-70b-versatile"
```

In `client/` create `.env`:
```env
VITE_BACKEND_URL=http://localhost:4000/api/v1
```

### 3. Database Migration
```bash
npm run generate --workspace=@applytrack/database
npm run migrate --workspace=@applytrack/database
```

### 4. Run Both Client & Server
```bash
# Start backend server (port 4000)
npm run dev --workspace=applytrack-server

# In a separate terminal, start frontend (port 3000)
npm run dev --workspace=applytrack-client
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Deployment

### Backend (Render)
1. Fork or push this repository to GitHub.
2. In Render, select **"New Web Service"** and connect the repository.
3. Configure settings:
   - **Root Directory:** `server`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
   - Or deploy via root using:
     - **Build Command:** `npm run build:server`
     - **Start Command:** `npm run start:server`
4. Set Environment Variables in Render Dashboard matching `server/.env`.
5. Ensure `CLIENT_URL` is set to `https://apply-track-1h5z.vercel.app`.

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   - `VITE_BACKEND_URL` = `https://applytrack-580j.onrender.com/api/v1`
5. Click **Deploy**.

---

## 🔒 Security & Privacy Commitments
- **Zero Email Body Storage:** ApplyTrack never reads, stores, or logs the contents of your emails. Only metadata (sender, timestamp, thread ID) is processed.
- **AES-256-GCM Vault:** User OAuth refresh tokens are encrypted at rest using an AES-256-GCM cipher before writing to the database.
- **In-Memory Resume Parsing:** Uploaded PDF resumes are parsed in volatile RAM buffer memory and immediately discarded. No resumes are written to disk or public buckets.
- **Soft Deletions Only:** All deletions are handled non-destructively via `isArchived = true` to preserve user history integrity.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
