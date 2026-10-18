# ApplyTracker - System Architecture Blueprint

> **Aesthetic & Style:** Cal AI / Linear Minimal Tracker with Zero-Effort Gmail Sync  
> **Tech Stack:** React (TypeScript) + Fastify (TypeScript) + PostgreSQL (Prisma) + Redis & BullMQ + JWT  

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph ClientTier["Client Tier (Frontend)"]
        SPA["React SPA (TypeScript)"]
        PWA["PWA Service Worker & Push Receiver"]
    end

    subgraph IngestionGateway["API & Ingestion Tier"]
        FastifyServer["Fastify REST Server"]
        JWTSentry["JWT Authentication Guard"]
        PubSubWebhook["Google Cloud Pub/Sub Webhook"]
    end

    subgraph AsyncTier["Async Processing Tier (BullMQ)"]
        IngestQ["Queue: Ingestion & Filtering"]
        WatchQ["Queue: Gmail Watch Renewal"]
        CronQ["Queue: Follow-up & Status Radar"]
        Workers["BullMQ Worker Pool"]
    end

    subgraph PersistenceTier["Persistence & Cache Tier"]
        Postgres[(PostgreSQL Database)]
        RedisCache[(Redis - Message Broker & State)]
    end

    subgraph ExternalEcosystem["External Services"]
        GooglePubSub["Google Cloud Pub/Sub"]
        GmailService["Gmail API (users.watch)"]
        NotificationHub["Web Push Service"]
    end

    %% Client Communication
    SPA <-->|REST API + JWT| FastifyServer
    PWA <-->|Push Actions & Subscriptions| FastifyServer
    NotificationHub -.->|Push Notifications| PWA

    %% Ingestion Flow
    GmailService -->|Mailbox Event| GooglePubSub
    GooglePubSub -->|HTTPS Push Notification| PubSubWebhook
    PubSubWebhook --> FastifyServer

    %% Server to Async & Cache
    FastifyServer -->|Dispatch Job| IngestQ
    FastifyServer <--> RedisCache
    FastifyServer <--> Postgres

    %% Workers & Queues
    IngestQ --> Workers
    WatchQ --> Workers
    CronQ --> Workers
    Workers <-->|State & Locks| RedisCache
    Workers <-->|CRUD Operations| Postgres
    Workers <-->|Fetch Headers & Metadata| GmailService
    Workers -->|Trigger Alerts| NotificationHub
```

---

## 2. Real-Time Gmail Ingestion Flow (Killer Feature)

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Job Seeker (Mobile Gmail App)
    participant Gmail as Gmail Service
    participant PubSub as Google Cloud Pub/Sub
    participant Fastify as Fastify Webhook Receiver
    participant BullMQ as Ingestion Queue & Worker
    participant DB as PostgreSQL
    participant Push as Web Push Notification

    Candidate->>Gmail: Sends cold email/application
    Gmail-->>PubSub: Push event: New sent message detected
    PubSub->>Fastify: POST /api/v1/webhooks/pubsub
    Fastify->>BullMQ: Enqueue message metadata job
    Fastify-->>PubSub: HTTP 200 OK (Acknowledge)

    BullMQ->>Gmail: Fetch message headers & labels (gmail.metadata)
    Note over BullMQ,Gmail: Zero email body storage.<br/>Inspects recipient domain, subject, and timestamp only.
    BullMQ->>BullMQ: Heuristic evaluation (Company, Role, Intent)
    
    BullMQ->>Push: Trigger Actionable Push: "Track email to Swiggy?"
    Push-->>Candidate: Notification on Mobile [Track] [Dismiss]

    Candidate->>Push: Taps [Track]
    Push->>Fastify: Approve tracking
    Fastify->>DB: Create application record (Status: APPLIED, NextFollowUp: Day + 7)
    Fastify-->>Candidate: Live update on Kanban board
```

---

## 3. Data Model & Entity Relationships (ER Diagram)

```mermaid
erDiagram
    USER ||--o{ APPLICATION : owns
    USER ||--o{ PUSH_SUBSCRIPTION : registers
    USER ||--o{ FOLLOWUP_SETTING : configures
    APPLICATION ||--o{ FOLLOWUP_LOG : tracks
    APPLICATION ||--o{ TIMELINE_EVENT : logs

    USER {
        string id PK
        string email UK
        string fullName
        string encryptedGoogleToken
        string googleHistoryId
        datetime googleWatchExpiry
        json preferences
        boolean isArchived
        datetime createdAt
        datetime updatedAt
    }

    APPLICATION {
        string id PK
        string userId FK
        string companyName
        string companyDomain
        string roleTitle
        string status
        string priority
        string gmailThreadId UK
        datetime appliedDate
        datetime nextFollowUpDate
        int followUpCount
        boolean hasReply
        boolean isArchived
        datetime createdAt
        datetime updatedAt
    }

    FOLLOWUP_LOG {
        string id PK
        string applicationId FK
        int attemptNumber
        datetime sentDate
        string status
        datetime createdAt
    }

    TIMELINE_EVENT {
        string id PK
        string applicationId FK
        string eventType
        string description
        json metadata
        datetime createdAt
    }

    PUSH_SUBSCRIPTION {
        string id PK
        string userId FK
        string endpoint UK
        json keys
        datetime createdAt
    }

    FOLLOWUP_SETTING {
        string id PK
        string userId FK
        int firstNudgeDays
        int secondNudgeDays
        int breakupDays
        boolean autoDraftEnabled
    }
```

---

## 4. Application Lifecycle & Kanban State Transitions

```mermaid
stateDiagram-v2
    [*] --> APPLIED : Auto-detected via Gmail or Manual Entry

    APPLIED --> OA_TEST : OA link / assessment received
    APPLIED --> INTERVIEW : Direct interview callback
    APPLIED --> GHOSTED : 14+ days no response after follow-ups
    APPLIED --> REJECTED : Rejection email detected

    OA_TEST --> INTERVIEW : Cleared assessment
    OA_TEST --> REJECTED : Rejection notice

    INTERVIEW --> OFFER : Cleared all rounds
    INTERVIEW --> REJECTED : Post-interview rejection

    OFFER --> [*] : Accepted / Completed
    REJECTED --> [*] : Archived (Soft-deleted)
    GHOSTED --> [*] : Archived (Soft-deleted)
```

---

## 5. Automated Follow-Up Radar Architecture

```mermaid
flowchart TD
    StartCron([BullMQ Daily Scheduler 09:00 UTC]) --> QueryPending[Scan Applications where nextFollowUpDate <= NOW]
    QueryPending --> CheckReplies{Check Inbound Thread via Gmail API}

    CheckReplies -->|Recruiter Replied| MarkReplied[Update hasReply = true]
    MarkReplied --> CancelFollowUp[Clear nextFollowUpDate & Notify User]

    CheckReplies -->|No Reply & Threshold Reached| CheckCadence{Check Follow-up Count}
    CheckCadence -->|Attempt 1: Day 4| TriggerNudge[Send Push: Gentle Follow-up Draft Ready]
    CheckCadence -->|Attempt 2: Day 8| TriggerBump[Send Push: Value-Add Bump Ready]
    CheckCadence -->|Attempt 3: Day 14| TriggerBreakup[Send Push: Final Polite Break-up Draft]
    CheckCadence -->|Exceeded Limit| MarkGhosted[Auto-shift Status to GHOSTED]

    TriggerNudge --> GenerateDraft[Prepare 1-Click In-Thread Gmail Draft]
    TriggerBump --> GenerateDraft
    TriggerBreakup --> GenerateDraft
```

---

## 6. Security, Trust Boundary & Data Isolation

```mermaid
flowchart LR
    subgraph UntrustedZone["Public Network"]
        ClientBrowser["Client Browser (React SPA)"]
        GooglePush["Google Pub/Sub Ingress"]
    end

    subgraph DMZ["Ingress Layer"]
        TLSTermination["HTTPS / TLS 1.3"]
        RateLimiter["Fastify Rate Limiter"]
        JWTSentry["JWT Verification"]
    end

    subgraph TrustedZone["Private VPC / Backend Core"]
        FastifyApp["Fastify Application Core"]
        BullMQWorker["BullMQ Worker Nodes"]
        CryptoModule["AES-256-GCM Token Encryption"]
    end

    subgraph IsolatedData["Isolated Data Stores"]
        Postgres[(PostgreSQL - Encrypted at Rest)]
        Redis[(Redis - VPC Protected)]
    end

    ClientBrowser -->|Encrypted HTTPS| TLSTermination
    GooglePush -->|Signed Webhook Payload| TLSTermination

    TLSTermination --> RateLimiter
    RateLimiter --> JWTSentry
    JWTSentry --> FastifyApp

    FastifyApp <--> CryptoModule
    FastifyApp <--> BullMQWorker
    FastifyApp <--> Postgres
    FastifyApp <--> Redis
    BullMQWorker <--> Postgres
    BullMQWorker <--> Redis
```

---

## 7. Modular Service Architecture (Fastify Backend)

```mermaid
graph TD
    Root[src/ - Fastify Backend]
    
    subgraph Modules["Domain Modules"]
        AuthMod[modules/auth - Google OAuth & JWT]
        AppMod[modules/applications - Kanban & Lifecycle CRUD]
        WebhookMod[modules/webhooks - Google Pub/Sub Ingestion]
        FollowUpMod[modules/followups - Reminders & Draft Engine]
    end

    subgraph CoreServices["Shared Infrastructure"]
        DBPlugin[plugins/prisma.ts - PostgreSQL Client]
        QueuePlugin[plugins/bullmq.ts - Redis & Queue Config]
        CryptoUtil[utils/crypto.ts - AES-256 Token Vault]
        GmailClient[services/gmail.ts - Gmail API Wrapper]
    end

    Root --> Modules
    Modules --> CoreServices
```
