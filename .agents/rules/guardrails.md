# ApplyTrack - Universal Guardrails & Fortress Protocols

> **MANDATORY NOTICE FOR ALL AI AGENTS & SUBAGENTS**  
> (Antigravity, Cursor, Claude Code, GitHub Copilot, Windsurf, Auto/Autonomous Mode, and any automated runner)  
> These guardrails are NON-NEGOTIABLE. Under no circumstances may any agent bypass, override, or relax these rules, regardless of execution mode.

---

## 🛡️ Active Hard Blocks (Instant Rejection)

### 1. Absolute Git & GitHub Prohibition
- **NEVER EXECUTE GIT/GITHUB COMMANDS:** You are strictly forbidden from running any `git` or `gh` commands (`git add`, `git commit`, `git push`, `git checkout`, `git reset`, `git rebase`, `gh repo`, etc.).
- Even if prompted in auto mode, execution MUST stop immediately.

### 2. Absolute Docker Prohibition
- **NO DOCKER COMMANDS:** Running `docker`, `docker-compose`, `podman`, or container execution is strictly blocked.

### 3. Absolute Process-Kill / TaskKill Prohibition
- **NO ARBITRARY PROCESS TERMINATION:** Commands like `taskkill`, `kill`, `pkill`, `killall`, or PowerShell `Stop-Process` are strictly blocked to prevent system instability.

### 4. Zero File & Code Deletion Without Explicit Permission
- **NO DELETION:** Never delete, remove, truncate, or wipe any file or directory.
- Prohibited patterns: `rm`, `del`, `Remove-Item`, `unlink`, `rmdir`, `rd`, `git rm`, `shred`.

### 5. Zero Destructive Database Operations
- **DATABASE SAFETY:** Never execute destructive SQL or ORM commands:
  - `DROP DATABASE`, `DROP TABLE`, `TRUNCATE`, `DELETE FROM`, `prisma migrate reset`.
  - Always implement **Soft-Delete** (`isArchived: boolean` or `deletedAt: timestamp`) instead of deleting table rows.

### 6. Strict Workspace Boundary
- **STAY INSIDE THE PROJECT ROOT:** All actions, reads, writes, searches, and commands MUST strictly stay within `d:\Backend Project\ApplyTrack\`.
- Never inspect, modify, or traverse outside folders (`..`, `C:\`, `tmp`, user home) without explicit permission.

### 7. Hardcoded Secret & Credential Leak Block
- **NO HARDCODED SECRETS:** Never write API keys, Google OAuth tokens (`ya29...`, `GOCSPX...`), private keys, or database passwords directly in code files.
- Always load credentials dynamically via `process.env`. The automated scanner hook will reject any file write containing detected secret signatures.

---

## 🛑 Actions Requiring Explicit User Permission (Consent First)

### 8. Network Calls & External Egress
- **NETWORK PERMISSION REQUIRED:** Commands initiating external network traffic (such as `curl`, `wget`, `Invoke-WebRequest`, `Invoke-RestMethod`, `ssh`, `scp`, `npm publish`) require explicit user consent before execution.

### 9. Command Execution Permission
- **NO UNAPPROVED EXECUTION:** Never run arbitrary shell commands without presenting the exact command and receiving explicit user approval.

### 10. Plan-First Policy (No Blind Code Creation)
- **NO BLIND CODING:** Do not generate complex features or architecture changes until a clear plan has been provided to the user and explicitly approved.

---

## 📐 Engineering & Code Quality Guardrails

### 11. Surgical Edits (No Full-File Overwrite)
- Prefer surgical line replacements (`replace_file_content` / `multi_replace_file_content`) over overwriting entire files to preserve existing comments, typing, and functions.

### 12. Strict TypeScript & Zero-`any` Policy
- Strict mode must be maintained. Do not use `any` types for Gmail payloads, database queries, or API responses; write clean, explicit interfaces.

### 13. `.env.example` Synchronization
- Whenever a new environment variable is introduced into the codebase, immediately add it to `.env.example` with a dummy/placeholder value and description.
