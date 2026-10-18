# Universal Agent Guidelines (AGENTS.md)

This file is the single source of truth for all AI agents working on **ApplyTrack** (Antigravity, Cursor, Claude Code, GitHub Copilot, Windsurf, Auto/Autonomous Mode, etc.).

---

## 🚨 MANDATORY GUARDRAILS (ALL AGENTS & SUBAGENTS MUST COMPLY)

Regardless of execution mode (interactive, autonomous, or subagent), these rules are strictly enforced:

1. **NO FILE/CODE DELETION:** Never delete any file or code block without explicit user approval.
2. **NO EXECUTION WITHOUT PERMISSION:** Never execute terminal/shell commands without user confirmation.
3. **ZERO GIT/GITHUB COMMANDS:** Never run `git` (`git add`, `git commit`, `git push`, etc.) or `gh` commands under any circumstances.
4. **ZERO DOCKER COMMANDS:** Never run `docker`, `docker-compose`, or `podman` commands.
5. **ZERO PROCESS-KILL / TASKKILL:** Never terminate processes (`taskkill`, `kill`, `pkill`, `Stop-Process`).
6. **NO DESTRUCTIVE DB OPERATIONS:** Never run `DROP`, `DELETE`, `TRUNCATE`, or `prisma migrate reset`. Always use soft-deletes (`isArchived`).
7. **NETWORK CALLS REQUIRE CONSENT:** Commands making external network calls (`curl`, `wget`, `Invoke-WebRequest`, `npm publish`) require explicit permission.
8. **STRICT WORKSPACE BOUNDARY:** Never access, read, or modify files outside `d:\Backend Project\ApplyTrack\`.
9. **ZERO HARDCODED SECRETS:** Never hardcode tokens, API keys, or connection URIs. Load exclusively via `process.env`.
10. **PLAN-FIRST POLICY:** Do not write code or create architectural components until a plan is shared and approved by the user.
11. **SURGICAL EDITS ONLY:** Use precise surgical replacements; do not blindly overwrite existing files.
12. **ENV SYNCHRONIZATION:** Any new environment variable must be immediately documented in `.env.example`.
13. **STRICT TYPES (ZERO `any`):** No shortcut `any` types; define strong interfaces for all domain entities.

See full definitions in [`.agents/rules/guardrails.md`](file:///d:/Backend%20Project/ApplyTrack/.agents/rules/guardrails.md).

---

## 1. Project Philosophy
- **ApplyTrack** is a Cal AI / Linear-style minimal tracker with Gmail Sync (Zero Manual Effort).
- Keep changes clean, minimal, modular, and well-typed.

## 2. Shared Agent Conventions
- **Shared Rules:** Check `.agents/rules/` and `.cursor/rules/` for domain-specific guidelines.
- **Shared Hooks:** Lifecycle hooks are configured in [`.agents/hooks.json`](file:///d:/Backend%20Project/ApplyTrack/.agents/hooks.json).
- **Tool Compatibility:**
  - **Antigravity:** Automatically discovers `.agents/` and `AGENTS.md`.
  - **Cursor:** Reads `.cursorrules` and `.cursor/rules/`.
  - **Claude Code:** Reads `CLAUDE.md` and points to universal rules.
