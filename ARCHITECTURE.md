# ApplyTrack - System Architecture Blueprint

> **Aesthetic & Design Philosophy:** Cal AI / Linear-style minimal tracker with Zero-Effort Gmail Sync, Groq AI Follow-Up Ghostwriter, and PWA Mobile Share Target.  
> **Tech Stack:** React 18 (TypeScript + Vite) + Fastify 4 (TypeScript) + PostgreSQL (Neon / Prisma 5) + Redis & BullMQ 5 + Groq AI (Llama 3.3 70B) + Node Crypto (AES-256-GCM).

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Frontend & Mobile PWA)"]
        SPA["React 18 SPA (TypeScript + Vite)"]
        PWA["PWA Service Worker & Push Client"]
        ShareTarget["Android Web Share Target Handler"]
    end

    subgraph IngressGateway["API Gateway & Webhook Ingress (Render)"]
        FastifyServer["Fastify REST Server"]
        JWTSentry["JWT Sentry Guard (@fastify/jwt)"]
        PubSubWebhook["Google Cloud Pub/Sub Webhook (/api/v1/webhooks/google-pubsub)"]
        RateLimiter["Fastify Rate Limiter (Sliding Window)"]
    end

    subgraph AsyncTier["Async Processing Tier (BullMQ 5)"]
        IngestQ["Queue: gmail-ingest-queue"]
        WatchQ["Queue: watch-renewal-queue"]
        CronQ["Queue: followup-radar-queue"]
        Workers["BullMQ Worker Pool (Concurrency: 1-5)"]
    end

    subgraph PersistenceTier["Persistence & Cache Tier"]
        Postgres[(PostgreSQL - Neon Serverless DB)]
        RedisCache[(Redis - Upstash Serverless / Local)]
    end

    subgraph ExternalEcosystem["External Services & APIs"]
        GooglePubSub["Google Cloud Pub/Sub (Push Delivery)"]
        GmailService["Gmail API (users.watch & metadata)"]
        GroqEngine["Groq AI (Llama 3.3 70B Versatile)"]
        WebPushEngine["Web Push Service (VAPID)"]
    end

    %% Client Communication
    SPA <-->|REST API + Bearer JWT| FastifyServer
    PWA <-->|Push Subscriptions & Key Delivery| FastifyServer
    ShareTarget --> SPA

    %% Ingestion Flow
    GmailService -->|Mailbox Delta Notification| GooglePubSub
    GooglePubSub -->|HTTPS POST + Verification Token| PubSubWebhook
    PubSubWebhook --> FastifyServer

    %% Server to Async & Cache
    FastifyServer -->|Dispatch Delta Job| IngestQ
    FastifyServer <-->|Mutex Locks & Cached Apps| RedisCache
    FastifyServer <-->|Prisma ORM CRUD| Postgres
    FastifyServer <-->|Resume Parsing & Prompts| GroqEngine

    %% Workers & Queues
    IngestQ --> Workers
    WatchQ --> Workers
    CronQ --> Workers
    Workers <-->|SETNX Deduplication & Locks| RedisCache
    Workers <-->|State Transitions & Timelines| Postgres
    Workers <-->|Fetch Headers & Metadata| GmailService
    Workers -->|Trigger Urgency Alerts| WebPushEngine
```

---

## 2. Real-Time Gmail Ingestion Flow (Killer Feature)

ApplyTrack monitors mailbox events without storing email bodies. It complies with least-privilege review guidelines using `gmail.metadata`.

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Job Seeker (Mobile Gmail App)
    participant Gmail as Gmail Service (users.watch)
    participant PubSub as Google Cloud Pub/Sub
    participant Fastify as Fastify Webhook (/api/v1/webhooks/google-pubsub)
    participant Redis as Redis (SETNX Deduplication)
    participant BullMQ as Email Ingest Queue & Worker
    participant DB as PostgreSQL (Neon)

    Candidate->>Gmail: Sends cold email or submits application
    Gmail-->>PubSub: Push event: Mailbox delta detected (historyId)
    PubSub->>Fastify: POST /api/v1/webhooks/google-pubsub?token=<TOKEN>
    
    Fastify->>Fastify: Verify timingSafeEqual(token, GOOGLE_PUBSUB_VERIFICATION_TOKEN)
    Fastify->>Redis: SETNX pubsub:msg:{messageId} (TTL: 3600s)
    alt Message is Duplicate
        Fastify-->>PubSub: HTTP 200 OK (ignored_duplicate)
    else Message is Unique
        Fastify->>BullMQ: Enqueue job 'process-mailbox-delta' { emailAddress, historyId }
        Fastify-->>PubSub: HTTP 200 OK (acknowledged)
    end

    BullMQ->>Gmail: Fetch delta changes (fetchHistoryChanges since last historyId)
    Gmail-->>BullMQ: Returns list of updated messageIds (INBOX, SENT)
    
    loop For each messageId
        BullMQ->>Gmail: Fetch message headers & subject (fetchMessageMetadata)
        Note over BullMQ,Gmail: ZERO email body storage.<br/>Inspects sender domain, subject, and timestamp only.
        
        alt Outbound Cold Email Detected
            BullMQ->>DB: Check existing application (findFirst by threadId or company)
            alt Card Does Not Exist
                BullMQ->>DB: Create Application (status: APPLIED, nextFollowUp: Day + 7)
                BullMQ->>DB: Record TimelineEvent (EMAIL_SENT)
            end
        else Inbound Recruiter Reply Detected
            BullMQ->>DB: Mark hasReply = true, clear follow-up countdown
            BullMQ->>DB: Record TimelineEvent (REPLY_RECEIVED)
            alt Inbound Assessment / Interview Invite
                BullMQ->>DB: Auto-advance stage to OA_TEST or INTERVIEW
                BullMQ->>DB: Compute stageDueDate (e.g., 48h deadline)
            end
        end
    end
```

---

## 3. Data Model & Entity Relationship Diagram (ERD)

Strictly reflects the centralized Prisma schema defined in [`packages/database/prisma/schema.prisma`](file:///d:/Backend%20Project/ApplyTrack/packages/database/prisma/schema.prisma):

```mermaid
erDiagram
    USER ||--o{ APPLICATION : owns
    USER ||--o{ PUSH_SUBSCRIPTION : registers
    USER ||--o{ FOLLOWUP_SETTING : configures
    APPLICATION ||--o{ FOLLOWUP_LOG : tracks
    APPLICATION ||--o{ TIMELINE_EVENT : records

    USER {
        string id PK "UUID"
        string email UK "Unique email address"
        string fullName "Optional display name"
        string avatarUrl "Profile image link"
        string googleId UK "Google provider ID"
        string githubId UK "GitHub provider ID"
        string encryptedGoogleToken "AES-256-GCM encrypted refresh token"
        string encryptedGithubToken "AES-256-GCM encrypted access token"
        string googleHistoryId "Last processed Gmail history pointer"
        datetime googleWatchExpiry "Pub/Sub subscription expiry"
        json preferences "AI Context, top skills, target roles"
        boolean isArchived "Soft-delete flag"
        datetime createdAt
        datetime updatedAt
    }

    APPLICATION {
        string id PK "UUID"
        string userId FK "References User.id"
        string companyName "AES-256-GCM encrypted"
        string companyDomain "Domain identifier (e.g. google.com)"
        string roleTitle "AES-256-GCM encrypted"
        string location "AES-256-GCM encrypted"
        string salaryRange "AES-256-GCM encrypted"
        string jobUrl "AES-256-GCM encrypted link"
        enum status "APPLIED | OA_TEST | INTERVIEW | OFFER | REJECTED | GHOSTED"
        enum priority "LOW | MEDIUM | HIGH"
        datetime appliedDate "Timestamp of initial submission"
        datetime stageDueDate "Upcoming deadline for OA or Interview"
        string gmailThreadId "Gmail thread identifier"
        datetime lastOutboundDate "Timestamp of last cold mail"
        datetime lastInboundDate "Timestamp of last recruiter reply"
        boolean hasReply "Stops follow-up countdowns when true"
        datetime nextFollowUpDate "Scheduled follow-up reminder timestamp"
        int followUpCount "Cadence tracker: 0=Initial, 1=Day4, 2=Day8, 3=Day14"
        string notes "AES-256-GCM encrypted applicant notes"
        boolean isArchived "Soft-delete flag"
        datetime createdAt
        datetime updatedAt
    }

    FOLLOWUP_LOG {
        string id PK "UUID"
        string applicationId FK "References Application.id"
        int attemptNumber "1, 2, or 3"
        datetime sentDate "Timestamp when sent"
        string status "PENDING | SENT | DISMISSED"
        string draftBody "AI-generated email draft text"
        datetime createdAt
    }

    TIMELINE_EVENT {
        string id PK "UUID"
        string applicationId FK "References Application.id"
        string eventType "STATUS_CHANGED | EMAIL_SENT | REPLY_RECEIVED"
        string description "Human-readable activity summary"
        json metadata "Context details (from, subject, threadId)"
        datetime createdAt
    }

    PUSH_SUBSCRIPTION {
        string id PK "UUID"
        string userId FK "References User.id"
        string endpoint UK "Web Push endpoint URL"
        json keys "Auth and P256DH cryptographic keys"
        datetime createdAt
    }

    FOLLOWUP_SETTING {
        string id PK "UUID"
        string userId FK "References User.id"
        int firstNudgeDays "Default: 4 days"
        int secondNudgeDays "Default: 8 days"
        int breakupDays "Default: 14 days"
        boolean autoDraftEnabled "Default: true"
        datetime updatedAt
    }
```

> **Database Indexing & Integrity:**  
> * **Composite Unique Constraint:** `@@unique([userId, gmailThreadId])` prevents duplicate card insertion for the same user while permitting nulls.  
> * **Query Optimization Indexes:** `@@index([userId, status])`, `@@index([userId, nextFollowUpDate])`, `@@index([googleWatchExpiry])`.  
> * **Soft Delete Policy:** Destructive `DELETE` queries are prohibited across all models; records update `isArchived = true`.

---

## 4. Application Lifecycle & Kanban State Transitions

```mermaid
stateDiagram-v2
    [*] --> APPLIED : Auto-detected via Gmail Sync or Manual Creation

    APPLIED --> OA_TEST : OA invitation link received (HackerRank, Codesignal)
    APPLIED --> INTERVIEW : Direct recruiter interview screening invitation
    APPLIED --> REJECTED : Inbound polite rejection email detected
    APPLIED --> GHOSTED : 14+ days no reply following 3-tier cadence

    OA_TEST --> INTERVIEW : Assessment cleared / callback received
    OA_TEST --> REJECTED : Post-assessment rejection

    INTERVIEW --> OFFER : Cleared technical & leadership rounds
    INTERVIEW --> REJECTED : Post-interview rejection

    OFFER --> [*] : Offer Accepted or Archived
    REJECTED --> [*] : Soft-Archived (isArchived = true)
    GHOSTED --> [*] : Soft-Archived (isArchived = true)
```

---

## 5. In-Memory Resume AI Context Vault (Privacy-First)

ApplyTrack processes candidate resumes without persisting files to disks or cloud buckets.

```mermaid
flowchart TD
    Client["Client: User selects PDF resume"] --> Base64Payload["Encode PDF to Base64 in Browser"]
    Base64Payload --> POSTResume["POST /api/v1/profile/resume (Limit: 15MB)"]
    
    POSTResume --> MemoryBuffer["Fastify in-memory Buffer (RAM only)"]
    MemoryBuffer --> PDFParse["pdf-parse (Extract Raw Text Streams)"]
    MemoryBuffer -.-> ImmediatePurge["Volatile RAM Discarded Immediately"]
    
    PDFParse --> GroqPrompt["Construct Strict JSON Extraction Prompt"]
    GroqPrompt --> GroqAI["Groq Cloud API (Llama 3.3 70B Versatile)"]
    
    GroqAI --> ParseResponse["Extract Target Role, Top 4 Skills, Projects & Summary"]
    ParseResponse --> StorePreferences["Prisma: Update User.preferences JSON"]
    StorePreferences --> ClientSuccess["Return Structured Profile Context to Frontend"]
```

---

## 6. Automated Follow-Up Radar & Watch Renewal Architecture

```mermaid
flowchart TD
    subgraph Schedulers["BullMQ Schedulers (bootstrap.ts)"]
        DailyRenewalCron["scheduleDailyWatchRenewal() (Every 24 Hours)"]
        FollowUpCron["Daily Follow-Up Radar (Every Morning)"]
    end

    subgraph WatchRenewalWorker["Watch Renewal Worker (watch-renewal-queue)"]
        ScanExpiring["Query User where googleWatchExpiry <= NOW + 48h OR NULL"]
        ScanExpiring --> CallWatch["gmailService.setupWatch(user.id)"]
        CallWatch --> UpdateExpiry["Update googleWatchExpiry (+7 Days) & googleHistoryId"]
    end

    subgraph FollowUpWorker["Follow-Up Worker (followup-radar-queue)"]
        ScanPending["Query Application where nextFollowUpDate <= NOW and hasReply = false"]
        ScanPending --> CheckCadence{"Evaluate followUpCount"}
        CheckCadence -->|Count 0: Day 4| Cadence1["Trigger Day 4 Gentle Nudge"]
        CheckCadence -->|Count 1: Day 8| Cadence2["Trigger Day 8 Value-Add Project Bump"]
        CheckCadence -->|Count 2: Day 14| Cadence3["Trigger Day 14 Polite Break-Up"]
        CheckCadence -->|Count >= 3| AutoGhost["Auto-shift status to GHOSTED"]
        
        Cadence1 --> GroqDraft["Call Groq Llama 3.3 (Generate 1-Click In-Thread Draft)"]
        Cadence2 --> GroqDraft
        Cadence3 --> GroqDraft
        GroqDraft --> SendPush["Web Push Notification: 'Follow-up draft ready'"]
    end

    DailyRenewalCron --> WatchRenewalWorker
    FollowUpCron --> FollowUpWorker
```

---

## 7. Security, Trust Boundary & Data Isolation

```mermaid
flowchart LR
    subgraph UntrustedZone["Public Network (Untrusted)"]
        BrowserClient["Browser Client (React SPA / PWA)"]
        GooglePushNode["Google Cloud Pub/Sub Webhook Delivery"]
    end

    subgraph Perimeter["Ingress Perimeter (Render HTTPS)"]
        TLSTermination["TLS 1.3 Termination"]
        HelmetHeaders["Security Headers (Helmet)"]
        RateLimiter["Fastify Rate Limiter (IP / User Sliding Window)"]
        AuthFilter["JWT / Timing-Safe Token Verification"]
    end

    subgraph PrivateCore["Private VPC Backend Core"]
        FastifyApp["Fastify Application Core"]
        CryptoService["AES-256-GCM Cryptographic Service"]
        WorkerPool["BullMQ Queue Workers"]
    end

    subgraph DataVault["Isolated Storage"]
        Postgres[(PostgreSQL - Neon Encrypted at Rest)]
        Redis[(Redis - Upstash TLS 1.3)]
    end

    BrowserClient -->|HTTPS + Bearer JWT| TLSTermination
    GooglePushNode -->|HTTPS POST + Token Query| TLSTermination

    TLSTermination --> HelmetHeaders
    HelmetHeaders --> RateLimiter
    RateLimiter --> AuthFilter
    AuthFilter --> FastifyApp

    FastifyApp <--> CryptoService
    FastifyApp <--> WorkerPool
    FastifyApp <--> Postgres
    FastifyApp <--> Redis
    WorkerPool <--> Postgres
    WorkerPool <--> Redis
```

### Cryptographic Security Vault Specifications
* **Algorithm:** `aes-256-gcm` (Authenticated Galois/Counter Mode).
* **Key Derivation:** Single 256-bit (32-byte) hex string stored in `TOKEN_ENCRYPTION_KEY`.
* **Payload Format:** `iv:authTag:encryptedData` (random 12-byte IV per encryption call, 16-byte authentication tag).
* **Encrypted Fields:**
  * User OAuth tokens: `encryptedGoogleToken`, `encryptedGithubToken`.
  * Candidate application details: `companyName`, `roleTitle`, `location`, `salaryRange`, `jobUrl`, `notes`.
* **Tamper Resistance:** Any manipulation of encrypted text fails authentication tag validation (`Unsupported state or unable to authenticate data`) and safely aborts without data leakage.

---

## 8. Concurrency & Rate-Limiting Controls

To prevent Google API quota burn, race conditions, and denial of service:
1. **Gmail Sync Debounce Lock (Redis Mutex):**
   * Endpoint: `POST /api/v1/applications/sync-gmail`
   * Atomic check: `SET lock:sync:{userId} "locked" EX 60 NX`
   * If lock exists, rejects immediately with `429 Too Many Requests` ("Sync is already running or on cooldown").
2. **Pub/Sub Webhook Deduplication:**
   * Incoming messages check `pubsub:msg:{messageId}` via `SETNX` with a 3600-second TTL.
   * Duplicate deliveries are acknowledged (`200 OK`) and discarded to eliminate redundant BullMQ queue jobs.
3. **Endpoint Rate Limits (Fastify Rate Limit Plugin):**
   * OAuth initiation: 20 req / 10 min.
   * OAuth callback: 30 req / 10 min.
   * Auth code exchange: 15 req / 10 min.
   * Resume PDF parsing: 10 req / hour.
   * Pub/Sub webhook receiver: 600 req / minute.
   * Follow-up draft generation: 30 req / hour.
