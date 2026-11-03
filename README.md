# 🎯 ApplyTrack

> **Cal AI / Linear-style minimal job application tracker with Zero-Effort Gmail Sync, Groq AI Follow-Up Ghostwriter, and Mobile PWA Share Target.**

[![Live Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat&logo=vercel)](https://apply-track-1h5z.vercel.app/)
[![Backend API](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render&logoColor=white)](https://applytrack-580j.onrender.com/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black?style=flat&logo=fastify)](https://www.fastify.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Postgres-Neon-00E599?style=flat&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Upstash Redis](https://img.shields.io/badge/Redis-Upstash-00E599?style=flat&logo=redis)](https://upstash.com/)
[![Groq AI](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-F55036?style=flat)](https://groq.com/)

---

## 🌐 Live Production Deployments

| Service | Platform | URL | Health / Verification |
| :--- | :--- | :--- | :--- |
| **Frontend PWA** | Vercel | [https://apply-track-1h5z.vercel.app](https://apply-track-1h5z.vercel.app) | ![Status](https://img.shields.io/badge/Status-Live-success) |
| **Backend REST API** | Render | [https://applytrack-580j.onrender.com](https://applytrack-580j.onrender.com) | ![Status](https://img.shields.io/badge/Status-Live-success) |
| **API Health Check** | Render | [https://applytrack-580j.onrender.com/health](https://applytrack-580j.onrender.com/health) | `{"status":"ok", "dependencies":{"database":"connected","redis":"connected"}}` |
| **Pub/Sub Push Webhook** | Google Cloud | `POST /api/v1/webhooks/google-pubsub?token=<TOKEN>` | HMAC Timing-Safe Verification |

---

## ⚡ The Problem & The Solution

### The Core Pain Point
Job applicants send 30–50+ cold emails and portal applications across LinkedIn, Internshala, and career boards:
* **90% of cold applications die** because applicants forget to follow up at the right cadence.
* **Manual spreadsheet tracking is tedious**, requiring copy-pasting links, dates, and statuses.
* **Mobile email tracking is broken**: Chrome extensions are useless when sending cold emails from the Gmail mobile app on iOS or Android.

### The ApplyTrack Way (Zero Manual Effort)
1. **Gmail Auto-Sync (Killer Feature):** Connect Gmail once via OAuth. Whenever you send a job application from your desktop or phone Gmail app, ApplyTrack auto-detects it via Google Cloud Pub/Sub and tracks it seamlessly in the background.
2. **Strict Privacy (`gmail.metadata`):** Operates under restricted Google API scopes. **Zero email body text is ever read, transferred, or stored.** Only metadata (sender domain, subject, timestamp, thread ID) is processed.
3. **Linear-Inspired Kanban Board:** Keyboard-friendly, high-contrast dark aesthetic (`Applied` ➔ `OA / Assessment` ➔ `Interview` ➔ `Offer` / `Rejected` / `Ghosted`).
4. **AI Follow-Up Ghostwriter:** Powered by **Groq Llama 3.3 70B**. Monitors threads for replies. If no response arrives by Day 4, Day 8, or Day 14, it drafts tailored in-thread follow-up emails referencing your real projects.
5. **In-Memory Resume AI Context Vault:** Upload a PDF resume to extract target roles, skills, and project summaries via in-memory parsing (`pdf-parse`) and Groq AI structuring — with **zero permanent document storage**.
6. **Mobile PWA & Android Web Share Target:** Installable on Android & iOS. Direct Android Share Sheet integration allows 1-tap card creation directly from LinkedIn or Chrome into ApplyTrack.

---

## 🏗️ High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Frontend)"]
        SPA["React 18 SPA (TypeScript + Vite)"]
        PWA["PWA Service Worker + Push Client"]
        ShareTarget["Android Web Share Target"]
    end

    subgraph IngressTier["API Gateway & Webhooks (Render)"]
        FastifyServer["Fastify REST Server"]
        JWTSentry["JWT Authentication Sentry"]
        PubSubWebhook["Google Cloud Pub/Sub Webhook (/api/v1/webhooks/google-pubsub)"]
    end

    subgraph AsyncTier["Background Worker Pool (BullMQ)"]
        IngestQ["Queue: Email Ingest & Noise Filter"]
        WatchQ["Queue: Daily Gmail Watch Renewal"]
        CronQ["Queue: Follow-up & Deadline Radar"]
    end

    subgraph StorageTier["Persistence & Caching"]
        Postgres[(PostgreSQL - Neon Serverless)]
        RedisCache[(Redis - Upstash Serverless)]
    end

    subgraph CloudEcosystem["External Services"]
        GooglePubSub["Google Cloud Pub/Sub (Push)"]
        GmailAPI["Gmail API (users.watch & metadata)"]
        GroqAI["Groq AI (Llama 3.3 70B Versatile)"]
        WebPush["Web Push (VAPID Service)"]
    end

    %% Client Traffic
    SPA <-->|REST API + Bearer JWT| FastifyServer
    PWA <-->|Web Push Subscriptions| FastifyServer
    ShareTarget --> SPA

    %% Ingestion Traffic
    GmailAPI -->|Mailbox Delta Notification| GooglePubSub
    GooglePubSub -->|Push HTTP POST with Token| PubSubWebhook
    PubSubWebhook -->|Verify & Deduplicate| FastifyServer

    %% Async Dispatch
    FastifyServer --> IngestQ
    FastifyServer <--> RedisCache
    FastifyServer <--> Postgres
    FastifyServer <--> GroqAI

    %% Worker Operations
    IngestQ --> FastifyServer
    WatchQ --> GmailAPI
    CronQ --> WebPush
```

---

## 🛠️ Tech Stack & Infrastructure

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Zero bulky UI frameworks, custom Linear-style CSS design tokens, Lucide icons |
| **Mobile & PWA** | Web App Manifest, Service Worker | Offline caching, installable home screen icon, Android Web Share Target API |
| **Backend API** | Fastify 4, Node.js 24 | High throughput, modular plugins, strict Zod schema validation, Helmet security |
| **Database** | PostgreSQL (Neon Serverless) | Prisma 5 ORM, soft-delete pattern (`isArchived`), foreign key cascade protection |
| **Queue & Cache** | BullMQ 5 + Upstash Redis | Message deduplication (SETNX), 60s mutex locks, cron jobs, async mailbox delta ingest |
| **AI Ghostwriter** | Groq SDK (`llama-3.3-70b-versatile`) | Ultra-fast inference (<500ms) for resume parsing & follow-up draft generation |
| **Security** | Node Crypto (AES-256-GCM) | User OAuth refresh tokens and applicant company notes encrypted at rest |
| **Notifications** | Web Push (VAPID) | Cross-platform actionable browser push notifications without proprietary SDKs |

---

## 📁 Repository Structure (Monorepo)

```text
ApplyTrack/
├── client/                              # Frontend React SPA & PWA
│   ├── public/                          # Web app manifest, service worker, icons
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, MobileBottomNav, Modal
│   │   ├── features/
│   │   │   ├── applications/            # Kanban board, List view, Filters, Metrics
│   │   │   ├── auth/                    # OAuth modal, AuthProvider context, Session hooks
│   │   │   ├── followups/               # AI Ghostwriter cards, Cadence tracker
│   │   │   └── profile/                 # Resume Parser & Profile Context Vault
│   │   ├── styles/                      # Linear dark design system tokens & animations
│   │   └── config/                      # Dynamic API base URL & environment resolution
│   └── vercel.json                      # Vercel SPA routing & security headers
│
├── server/                              # Backend Fastify API & Workers
│   ├── src/
│   │   ├── config/                      # Zod environment schema, BullMQ queue definitions
│   │   ├── modules/
│   │   │   ├── applications/            # Kanban CRUD, status transitions, /sync-gmail
│   │   │   ├── auth/                    # Google & GitHub OAuth exchange & session
│   │   │   ├── followups/               # Groq AI draft generation & reminder engine
│   │   │   ├── notifications/           # VAPID key delivery & push subscriptions
│   │   │   ├── profile/                 # In-memory PDF parser & context management
│   │   │   └── webhooks/                # Google Cloud Pub/Sub push receiver & validator
│   │   ├── plugins/                     # Fastify plugins (JWT, Redis, Prisma, PubSub, Rate-limit)
│   │   ├── queues/                      # BullMQ background workers (email, watch, follow-up)
│   │   ├── services/                    # Gmail API client, Crypto vault, AI Ghostwriter
│   │   ├── bootstrap.ts                 # Lifecycle initializer & graceful shutdown
│   │   └── server.ts                    # Entrypoint runner
│   └── Dockerfile                       # Multi-stage container definition
│
├── packages/
│   └── database/                        # Shared Database Workspace (@applytrack/database)
│       └── prisma/
│           ├── schema.prisma            # PostgreSQL models, indexes & enums
│           └── migrations/              # Version-controlled migration history
│
├── render.yaml                          # Render Blueprint for automated zero-downtime deployment
├── ARCHITECTURE.md                      # Detailed technical engineering specifications
├── Techstack.md                         # Architecture and technology matrix
└── README.md                            # Project documentation
```

---

## 📡 Complete REST API Reference

All protected endpoints require authorization header: `Authorization: Bearer <JWT_TOKEN>`.

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/google` | Public | Initiates Google OAuth consent flow (`access_type: offline`) |
| `GET` | `/google/callback` | Public | Google OAuth redirect receiver, issues short-lived exchange code |
| `GET` | `/github` | Public | Initiates GitHub OAuth flow |
| `GET` | `/github/callback` | Public | GitHub OAuth redirect receiver |
| `POST` | `/exchange` | Public | Exchanges single-use auth code for standard Bearer JWT token |
| `GET` | `/me` | Bearer JWT | Returns current authenticated user profile and connected providers |
| `POST` | `/logout` | Bearer JWT | Invalidates client session |

### 2. Applications & Kanban (`/api/v1/applications`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Bearer JWT | Lists active job applications with optional status/search filters |
| `GET` | `/metrics` | Bearer JWT | Returns aggregate stage counts (Total, Active, Response Rate) |
| `GET` | `/:id` | Bearer JWT | Returns detailed application record with full timeline audit log |
| `POST` | `/` | Bearer JWT | Creates new manual application record with 7-day initial follow-up |
| `PATCH`| `/:id/status` | Bearer JWT | Updates Kanban stage status with timeline history event |
| `PATCH`| `/:id` | Bearer JWT | Updates application metadata (company, role, salary, notes) |
| `DELETE`| `/:id` | Bearer JWT | Soft-deletes application card (`isArchived = true`) |
| `POST` | `/batch-delete` | Bearer JWT | Soft-deletes multiple applications simultaneously |
| `POST` | `/sync-gmail` | Bearer JWT | On-demand Gmail scan (protected with 60-second Redis Mutex lock) |

### 3. Webhooks (`/api/v1/webhooks`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/google-pubsub` | Query / Header Token | Receives push events from Google Pub/Sub topic for mailbox updates |

> **Webhook Push URL Pattern:**  
> `https://<YOUR_API_HOST>/api/v1/webhooks/google-pubsub?token=<GOOGLE_PUBSUB_VERIFICATION_TOKEN>`

### 4. AI Follow-Up Radar (`/api/v1/followups`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/pending` | Bearer JWT | Returns all dormant applications requiring follow-up action |
| `POST` | `/:id/draft` | Bearer JWT | Generates Groq Llama 3.3 in-thread follow-up draft (Day 4/8/14) |
| `POST` | `/:id/dismiss` | Bearer JWT | Snoozes or dismisses current follow-up reminder |
| `POST` | `/:id/sent` | Bearer JWT | Logs follow-up attempt, schedules next nudge, and updates cadence count |

### 5. Profile & Resume AI Context (`/api/v1/profile`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Bearer JWT | Returns AI user preferences, target roles, top skills, and portfolio projects |
| `PUT` | `/` | Bearer JWT | Updates profile context and AI configuration |
| `POST` | `/resume` | Bearer JWT | Streams PDF base64, parses in-memory (`pdf-parse`), and extracts AI context via Groq |

### 6. Notifications (`/api/v1/notifications`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/vapid-key` | Bearer JWT | Delivers public VAPID key to browser service worker |
| `POST` | `/subscribe` | Bearer JWT | Registers Web Push subscription endpoint & client keys |
| `DELETE`| `/unsubscribe`| Bearer JWT | Deletes browser push subscription |
| `POST` | `/test` | Bearer JWT | Dispatches immediate test push ping to verify device notification support |

---

## ⚙️ Environment Variables Matrix

Create `.env` in `server/` by copying `server/.env.example`:

| Variable | Required | Description | Example Format |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | Server port (defaults to 4000) | `4000` |
| `NODE_ENV` | Yes | Runtime environment (`development`, `production`, `test`) | `production` |
| `CLIENT_URL` | Yes | Frontend application origin for CORS & OAuth redirects | `https://apply-track-1h5z.vercel.app` |
| `DATABASE_URL` | Yes | PostgreSQL connection URI (Neon Serverless with SSL) | `postgresql://user:pass@host/db?sslmode=require` |
| `REDIS_URL` | Yes | Redis connection string (Upstash over rediss://) | `rediss://default:token@host:6379` |
| `JWT_SECRET` | Yes | Minimum 32-character secret for signing JWT bearer tokens | `c63fae6750c53234c2529ba5fa2abf8f...` |
| `TOKEN_ENCRYPTION_KEY` | Yes | 64-character hex string (32 bytes) for AES-256-GCM cipher | `cb929623c9f46a6505f5eecded14c479...` |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth 2.0 Web Client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth 2.0 Client Secret | `GOCSPX-xxxxxxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth callback endpoint on the server | `https://applytrack-580j.onrender.com/api/v1/auth/google/callback` |
| `GOOGLE_PUBSUB_TOPIC` | Yes | Google Cloud Pub/Sub Topic Resource Path | `projects/<project-id>/topics/gmail-notifications` |
| `GOOGLE_PUBSUB_VERIFICATION_TOKEN` | Yes | Secret query token verifying inbound Pub/Sub webhooks | `custom-secure-pubsub-webhook-token` |
| `GITHUB_CLIENT_ID` | Optional | GitHub OAuth App Client ID | `Iv1.xxxxxxxxxxxx` |
| `GITHUB_CLIENT_SECRET`| Optional | GitHub OAuth App Client Secret | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `GITHUB_REDIRECT_URI` | Optional | GitHub OAuth callback endpoint | `https://applytrack-580j.onrender.com/api/v1/auth/github/callback` |
| `GROQ_API_KEY` | Yes | Groq Cloud API key for Llama 3.3 70B inference | `gsk_xxxxxxxxxxxxxxxxxxxxxxxx` |
| `GROQ_MODEL` | Optional | Groq model tag (defaults to `llama-3.3-70b-versatile`) | `llama-3.3-70b-versatile` |
| `VAPID_PUBLIC_KEY` | Optional | Public VAPID key for Web Push notifications | Base64 URL-encoded key |
| `VAPID_PRIVATE_KEY`| Optional | Private VAPID key for Web Push signing | Base64 URL-encoded key |
| `VAPID_SUBJECT` | Optional | Mailto link identifying sender in Web Push headers | `mailto:support@applytrack.dev` |

In `client/.env`:
```env
VITE_BACKEND_URL=https://applytrack-580j.onrender.com/api/v1
```

---

## 💻 Local Development Setup

### 1. Prerequisites
* **Node.js:** `v20.x` or `v24.x`
* **npm:** `v10.x`+
* **PostgreSQL:** Local PostgreSQL or free [Neon DB](https://neon.tech/)
* **Redis:** Local Redis or free [Upstash Redis](https://upstash.com/)

### 2. Installation
```bash
git clone https://github.com/LalitWagh34/ApplyTrack.git
cd ApplyTrack
npm install
```

### 3. Generate Encryption Keys
Generate your 32-byte encryption key for `TOKEN_ENCRYPTION_KEY`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup & Migration
```bash
# Generate Prisma Client types
npm run db:generate

# Apply migrations locally
npm run db:migrate
```

### 5. Run Development Servers
```bash
# Terminal 1: Backend API (runs on port 4000)
npm run dev:server

# Terminal 2: Frontend Client (runs on port 3000)
npm run dev:client
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Deployment Guide

### 1. Backend (Render)
1. In Render, create a **New Web Service** connected to your repository.
2. Select **Blueprint** to use `render.yaml`, or configure manually:
   * **Root Directory:** *(leave blank for root workspace)*
   * **Build Command:** `npm install && npm run build:server`
   * **Start Command:** `npm run start:server`
   * **Health Check Path:** `/health`
3. Add all required environment variables in the Render Dashboard.
4. Apply Prisma migrations to production Neon database:
   ```bash
   npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
   ```

### 2. Frontend (Vercel)
1. Import repository into Vercel.
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Vite`.
4. Configure environment variable:
   * `VITE_BACKEND_URL` = `https://applytrack-580j.onrender.com/api/v1`
5. Click **Deploy**.

### 3. Google Cloud Pub/Sub Push Subscription Setup
1. In Google Cloud Console, open **Pub/Sub** ➔ **Topics**.
2. Grant **Pub/Sub Publisher** (`roles/pubsub.publisher`) role on your topic to:  
   `gmail-api-push@system.gserviceaccount.com`
3. Create a **Subscription** with:
   * **Delivery Type:** Push
   * **Endpoint URL:** `https://applytrack-580j.onrender.com/api/v1/webhooks/google-pubsub?token=<YOUR_GOOGLE_PUBSUB_VERIFICATION_TOKEN>`

---

## 🔒 Security & Privacy Guarantees

* **Zero Email Body Access:** Strictly complies with Google least-privilege review guidelines using `gmail.metadata`. Email body contents are never requested or parsed.
* **AES-256-GCM Vault:** User refresh tokens, application notes, and company metadata are encrypted at rest with authenticated ciphers.
* **In-Memory PDF Handling:** Uploaded resumes exist strictly in volatile RAM for parsing and are wiped immediately following Groq context generation.
* **Defensive Concurrency:** Webhook requests are deduplicated using atomic Redis `SETNX` locks to prevent duplicate job processing.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
