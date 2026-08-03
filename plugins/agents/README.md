# agents

Portable workflow skills for coding-agent session handoffs.

| Skill | Claude Code | Codex | Pi |
| --- | --- | --- | --- |
| `handoff` | `/agents:handoff` | `$handoff` | `/skill:handoff` |

New handoffs are stored in `.agents/handoffs/`. The skill can still resume existing handoffs from the legacy `.claude/handoffs/` location.
