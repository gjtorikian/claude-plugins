# agents

Agent workflow commands for session handoffs.

## Available Commands

### `/handoff`

Create or resume session handoff documents for seamless context transfer between AI sessions.

**Usage:**
- **Create**: `/handoff create` — Save current session state (branch, work completed, next steps, context) for a future session
- **Resume**: `/handoff resume` — Load a previous handoff document and prepare to continue work

Handoff documents are stored in `.claude/handoffs/` and include:
- Current project state and active branch
- Work completed and files modified
- Pending work and immediate next steps
- Important context and gotchas for the resuming agent
- Environment state and assumptions

**When to use:**
- Before ending a session with incomplete work
- When picking up work after a break
- When multiple people/sessions work on the same branch
- After significant progress to create a checkpoint
