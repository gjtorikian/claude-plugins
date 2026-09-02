# annotations

Renders agent output — an explanation, review, report, or comparison — as a self-contained black-and-white HTML page and opens it in your browser. Pages are written to `.agents/artifacts/` in the current project (never committed; the directory ignores itself), styled entirely by the skill's own template, and carry an in-page annotation layer: mark a passage, leave a note, press **Copy for agent**, and paste the markdown digest back into the session to have the page revised.

| Skill | Claude Code | Codex | Pi |
| --- | --- | --- | --- |
| `annotations` | `/annotations:annotations` | `$annotations` | `/skill:annotations` |

Install it alongside the other plugins in this marketplace:

```text
/plugin install annotations@gjtorikian-plugins
```

```sh
codex plugin add annotations@gjtorikian-plugins
```
