---
name: handoff
description: Creates or resumes session handoff documents for seamless context transfer between AI coding sessions. Use when the user asks to hand off, save state, pause, wrap up, resume, load a handoff, or continue previous work. Also suggest it after extensive edits or major architectural decisions.
---

Create or resume session handoff documents so a fresh coding-agent session can continue work with zero ambiguity. Store new handoffs in `.agents/handoffs/` at the project root.

## Hard Rules

- Never include secrets, API keys, passwords, tokens, or credentials in handoff documents. If you encounter them in context, redact them.
- Always show the complete draft and obtain explicit user confirmation before writing it. This is the user's record of their work.
- Store handoff documents as `.agents/handoffs/YYYY-MM-DD-HHMMSS-<slug>.md`. Create the directory if it does not exist.
- When resuming, verify that referenced files and branches still exist before acting on the handoff. A handoff is a snapshot in time — trust the current codebase over stale references.
- Do not auto-continue work after resuming. Present the next steps and wait for user direction.

## Process

Determine the mode based on the user's request or argument:

- **create** (default): Save current session state for a future session
- **resume**: Load a previous handoff and prepare to continue

---

### Mode: CREATE

#### Phase 1: Gather Context

1. Run `git branch --show-current` to capture the active branch
2. Run `git log --oneline -20` to capture recent commit history
3. Run `git status --short` to capture working tree state (staged, unstaged, untracked)
4. Run `git diff --stat` to summarize uncommitted changes
5. Review the conversation history and any active Tasks for work completed and decisions made during this session

#### Phase 2: Draft Handoff Document

6. Generate a slug from the primary task (e.g., `auth-refactor`, `fix-payment-bug`). Ask the user if the task focus is unclear.
7. Draft the handoff document using this structure:

```markdown
# Session Handoff

## Metadata

- **Created**: YYYY-MM-DD HH:MM (local time)
- **Project**: <project path>
- **Branch**: <current branch>
- **Continues from**: <path to previous handoff, if chaining — otherwise remove this line>

## Current State

<One paragraph summarizing where things stand right now. Be specific — what works, what doesn't, what's half-done.>

## Work Completed

- [ ] <task 1 — checked if done, unchecked if partial>
- [ ] <task 2>

### Files Modified

| File              | Change                |
| ----------------- | --------------------- |
| `path/to/file.ts` | Added auth middleware |
| `path/to/test.ts` | Tests for auth flow   |

### Decisions Made

| Decision               | Rationale                     |
| ---------------------- | ----------------------------- |
| Used JWT over sessions | Stateless scaling requirement |

## Pending Work

### Immediate Next Steps

1. <Most important thing to do next — be specific with file paths>
2. <Second priority>
3. <Third priority>

### Blockers / Open Questions

- [ ] <Any unresolved question or dependency>

### Deferred Items

- <Things explicitly punted to later>

## Context for Resuming Agent

### Important Context

<The most critical section. Include anything a fresh session MUST know that is not obvious from the code: architectural constraints, gotchas, non-obvious coupling, user preferences expressed during the session.>

### Assumptions

- <Assumptions made during this session that should be verified>

### Potential Gotchas

- <Things that could trip up a fresh session>

## Environment State

- **Required tools/services**: <anything that must be running>
- **Env vars needed**: <variable names only, never values>

## Related Resources

- <Links to issues, PRs, docs, or external references discussed>
```

#### Phase 3: Review and Write

8. Present the full draft for approval using the host's user-input mechanism when available, or ask in chat. Offer to save it as shown, edit it, or cancel.
9. Create `.agents/handoffs/` if it does not exist.
10. Write the approved document to `.agents/handoffs/YYYY-MM-DD-HHMMSS-<slug>.md`.
11. If there are uncommitted changes and the user might want to preserve them, mention that they may want to commit or stash before ending the session
12. Report the file path and a one-line summary of next steps

---

### Mode: RESUME

#### Phase 1: Find Handoff

1. List `.agents/handoffs/*.md` sorted by most recent. If that directory has no handoffs, also check the legacy `.claude/handoffs/*.md` location.
2. If no handoffs exist, inform the user and stop
3. If the user specified a file, use that. Otherwise, show the five most recent handoffs and let the user pick.

#### Phase 2: Validate Freshness

4. Read the selected handoff document
5. Check staleness indicators:
   - How old is the handoff? (compare timestamp in filename to now)
   - Run `git log --oneline --since="<handoff date>"` to see how many commits have landed since
   - Run `git branch --show-current` and compare to the branch in the handoff
   - Spot-check that 2-3 files listed in "Files Modified" still exist
6. Report staleness to the user:
   - **Fresh** (< 24h, same branch, few new commits): safe to follow as-is
   - **Slightly stale** (1-3 days, some new commits): review "Assumptions" before starting
   - **Stale** (3+ days, significant commits or branch divergence): warn that context may be outdated, suggest scanning recent commits before starting
7. If a "Continues from" link exists, read the predecessor handoff for additional context

#### Phase 3: Present and Prepare

8. Summarize the handoff for the user:
   - Current state (one line)
   - Number of pending items
   - First action item from "Immediate Next Steps"
   - Any blockers or open questions
9. Do NOT auto-start work. Wait for user direction on which next step to begin.
