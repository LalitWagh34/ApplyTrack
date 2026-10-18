/**
 * ApplyTrack Guardrail Enforcer
 * Lifecycle hook running on PreToolUse to intercept, validate, and block prohibited operations.
 * Operates across ALL execution modes (including autonomous/auto mode).
 */

const fs = require('fs');
const path = require('path');

// Read JSON payload from stdin
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = inputData.trim() ? JSON.parse(inputData) : {};
    const toolCall = payload.toolCall || {};
    const toolName = (toolCall.name || '').toLowerCase();
    const args = toolCall.args || {};

    const WORKSPACE_DIR = 'd:\\backend project\\applytrack';

    // =========================================================================
    // 1. INTERCEPT COMMAND EXECUTIONS (run_command)
    // =========================================================================
    if (toolName === 'run_command') {
      const commandLine = (args.CommandLine || '').trim();
      const cwd = (args.Cwd || '').toLowerCase();

      // Guard 1: Git & GitHub operations (ABSOLUTE HARD BLOCK)
      if (/\b(git(\.exe)?|gh(\.exe)?)\b/i.test(commandLine)) {
        return respond('deny', 'BLOCKED BY GUARDRAIL: Git and GitHub commands are strictly forbidden in ApplyTrack.');
      }

      // Guard 2: Docker / Container commands (ABSOLUTE HARD BLOCK)
      if (/\b(docker(\.exe)?|docker-compose(\.exe)?|podman(\.exe)?)\b/i.test(commandLine)) {
        return respond('deny', 'BLOCKED BY GUARDRAIL: Docker and container commands are strictly blocked.');
      }

      // Guard 3: Process Termination / TaskKill (ABSOLUTE HARD BLOCK)
      if (/\b(taskkill(\.exe)?|kill(\.exe)?|pkill|killall|Stop-Process)\b/i.test(commandLine)) {
        return respond('deny', 'BLOCKED BY GUARDRAIL: Killing processes or taskkill is strictly prohibited.');
      }

      // Guard 4: File Deletion operations (ABSOLUTE HARD BLOCK)
      if (/\b(rm\s|del\s|remove-item\s|unlink\s|rmdir\s|rd\s|shred\s)/i.test(commandLine) ||
          /\b(rmdir|Remove-Item)\b/i.test(commandLine)) {
        return respond('deny', 'BLOCKED BY GUARDRAIL: File deletion commands are prohibited without explicit user permission.');
      }

      // Guard 5: Destructive Database operations (ABSOLUTE HARD BLOCK)
      if (/\b(drop\s+table|drop\s+database|truncate\s+table|delete\s+from|migrate\s+reset)\b/i.test(commandLine)) {
        return respond('deny', 'BLOCKED BY GUARDRAIL: Destructive database operations (DROP/TRUNCATE/DELETE/RESET) are strictly prohibited.');
      }

      // Guard 6: Workspace Boundary Check (ABSOLUTE HARD BLOCK)
      if (cwd && !cwd.replace(/\\/g, '/').startsWith(WORKSPACE_DIR.replace(/\\/g, '/'))) {
        return respond('deny', `BLOCKED BY GUARDRAIL: Command execution outside workspace (${args.Cwd}) is prohibited.`);
      }

      // Guard 7: External Network Calls (FORCE USER PERMISSION)
      if (/\b(curl(\.exe)?|wget(\.exe)?|invoke-webrequest|iwr|invoke-restmethod|irm|ssh|scp|sftp|nc|netcat|nmap|npm\s+publish)\b/i.test(commandLine)) {
        return respond('force_ask', `External network call detected (${commandLine}). Explicit user permission required.`);
      }

      // Default for any other command execution: Force ask user permission
      return respond('force_ask', `User permission required before running command: ${commandLine}`);
    }

    // =========================================================================
    // 2. INTERCEPT FILE WRITES & MODIFICATIONS (write_to_file, replace, multi_replace)
    // =========================================================================
    if (['write_to_file', 'replace_file_content', 'multi_replace_file_content'].includes(toolName)) {
      const targetFile = (args.TargetFile || '').toLowerCase();

      // Guard 8: Workspace Boundary Check for Files
      if (targetFile) {
        const normTarget = targetFile.replace(/\//g, '\\');
        if (!normTarget.startsWith(WORKSPACE_DIR)) {
          return respond('deny', `BLOCKED BY GUARDRAIL: File operations outside workspace (${args.TargetFile}) are strictly prohibited.`);
        }
      }

      // Guard 9: Secret & API Key Leak Scanner
      // Scan written content for leaked credentials unless it is an example/dummy file (.env.example)
      const isExampleFile = targetFile.endsWith('.env.example') || targetFile.endsWith('.md');
      const contentToScan = [
        args.CodeContent,
        args.ReplacementContent,
        ...(Array.isArray(args.ReplacementChunks) ? args.ReplacementChunks.map(c => c.ReplacementContent) : [])
      ].filter(Boolean).join('\n');

      if (!isExampleFile && contentToScan) {
        // Check for Google OAuth tokens, GCP keys, private keys, connection strings with passwords
        const secretPatterns = [
          { pattern: /AIza[0-9A-Za-z-_]{35}/, name: 'Google API Key' },
          { pattern: /ya29\.[0-9A-Za-z-_]+/, name: 'Google OAuth Access Token' },
          { pattern: /GOCSPX-[0-9A-Za-z-_]+/, name: 'Google OAuth Client Secret' },
          { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, name: 'Private Key' },
          { pattern: /postgres(ql)?:\/\/[^:]+:[^@\s]+@[^:]+:[0-9]+/, name: 'PostgreSQL Connection URI with Password' },
          { pattern: /(jwt_secret|jwtSecret|api_key|apiKey|client_secret)\s*[:=]\s*['"][a-zA-Z0-9_\-\.]{20,}['"]/, name: 'Hardcoded Secret/Token' }
        ];

        for (const { pattern, name } of secretPatterns) {
          if (pattern.test(contentToScan)) {
            return respond('deny', `BLOCKED BY GUARDRAIL: ${name} detected in code. Never hardcode secrets; use environment variables (process.env).`);
          }
        }
      }

      // Guard 10: Accidental Full File Overwrite Check
      if (toolName === 'write_to_file' && args.Overwrite === true) {
        const filePath = args.TargetFile;
        // If file already exists and has substantial content, prompt user to prevent accidental wiping
        try {
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const isDoc = filePath.endsWith('.md') || filePath.endsWith('.json');
            // If existing code file > 500 bytes is being completely overwritten
            if (stats.size > 500 && !isDoc) {
              return respond('force_ask', `Overwriting existing file (${path.basename(filePath)}, size: ${stats.size} bytes). User confirmation required.`);
            }
          }
        } catch (_) {
          // Ignore fs error and proceed safely
        }
      }

      // Guard 10: Force explicit user permission before creating or modifying ANY file
      return respond('force_ask', `User permission required before writing or modifying file: ${args.TargetFile}`);
    }

    // Default: Allow safe read-only operations (view_file, list_dir, grep_search)
    return respond('allow');
  } catch (err) {
    // If parsing fails, default to safe ask
    return respond('ask', 'Guardrail validation encountered an error. Asking user verification.');
  }
});

function respond(decision, reason) {
  const output = { decision };
  if (reason) output.reason = reason;
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}
