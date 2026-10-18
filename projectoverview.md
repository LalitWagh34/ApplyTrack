PROBLEM STATEMENT
Students and early professionals apply to 30-50+ jobs via LinkedIn, Internshala, company career pages, and cold emails. There is no central system.

Result:

They forget where they applied
Cold emails sent from Gmail are impossible to track on mobile
They never follow up on time, so 90% cold emails die
Existing trackers are manual Excel sheets - boring and no one updates them
The real pain is not "applying", it's "remembering and following up".

OUR SOLUTION - ApplyTracker
A Cal AI-style, minimal tracker with Gmail Sync - Zero Manual Effort.

How we solve it:

Auto-Track Cold Mails (Killer Feature): User connects Gmail once. Whenever they send a job application mail from their Gmail app, ApplyTracker auto-detects it in the background and sends a notification: "Track mail to Swiggy?" - One tap to track. No extension needed, works perfectly on mobile.
Kanban Board for Applications: Linear-inspired minimal dark board: Applied -> OA/Test -> Interview -> Offer. Drag and drop. Clean, pro, dev-friendly.
Auto Follow-up Engine: If a company hasn't replied in 7 days after a cold mail, the app reminds you and generates a follow-up email in one click.
Why we are different from 100 other trackers:
Other trackers ask you to manually enter data. We track where the work actually happens - inside Gmail. Mobile-first, not Chrome-extension-first.

ADDITIONAL CORE FEATURES & INTELLIGENCE

1. Smart Reply & Rejection Radar:
- Auto-stops follow-up countdowns when a recruiter replies.
- Parses incoming OA (Online Assessment) / interview invites and rejection keywords to auto-suggest moving cards on the Kanban board.

2. Follow-Up Cadence & AI Ghostwriter:
- Multi-tier follow-up templates (Day 4 gentle bump, Day 8 value-add update, Day 14 polite break-up).
- 1-click in-thread draft creation directly in Gmail.

3. Mobile Notification Channels (Zero Friction):
- Actionable Web Push (PWA) + optional Telegram bot ping for instant 1-tap approvals ("Track to Swiggy? [Yes] [Ignore]").

4. Privacy-First Commitment:
- Zero email body persistence: only stores thread ID, timestamp, company name, and status.
- Restricted scope usage (`gmail.metadata` / `gmail.readonly`) to protect user trust.

TECHNICAL ARCHITECTURE OVERVIEW
- Core Backend: Node.js / TypeScript with modular REST APIs.
- Database & ORM: PostgreSQL with Prisma (soft-deletes only via `isArchived`).
- Ingestion & Webhooks: Google Cloud Pub/Sub with Gmail `users.watch()` for real-time sent-mail notifications.
- Worker Queues: Redis / BullMQ for cron checks, follow-up scheduling, and token renewals.
- Frontend: Linear / Cal AI-inspired minimal dark UI with smooth micro-interactions.