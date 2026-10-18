# GitHub Copilot & Codex Instructions for ApplyTrack

All AI agents, including GitHub Copilot, Codex, and OpenAI assistants, MUST strictly adhere to the universal project guardrails defined in [AGENTS.md](../AGENTS.md) and [.agents/rules/guardrails.md](../.agents/rules/guardrails.md):

1. **NO FILE/CODE DELETION:** Never delete files or code blocks without explicit user permission.
2. **NO UNAPPROVED EXECUTION:** Never run terminal commands without explicit user permission.
3. **ZERO GIT/GITHUB COMMANDS:** Never execute `git` or `gh` commands under any circumstances.
4. **ZERO DOCKER COMMANDS:** Never run `docker` or `docker-compose`.
5. **ZERO PROCESS-KILL:** Never terminate processes (`taskkill`, `kill`, `pkill`).
6. **NO DESTRUCTIVE DB OPS:** Never execute `DROP`, `TRUNCATE`, `DELETE`, or `migrate reset`.
7. **NETWORK CALLS REQUIRE CONSENT:** `curl`, `wget`, etc. require explicit user approval.
8. **STRICT WORKSPACE BOUNDARY:** Keep all actions strictly inside `d:\Backend Project\ApplyTrack\`.
9. **ZERO HARDCODED SECRETS:** Always use `process.env`.
10. **PLAN APPROVAL FIRST:** Never generate code without an approved plan.
