# Repository guidance

## Project overview

This repository distributes reusable coding-agent workflows to Codex, Claude Code, and Pi. The portable source of truth is the Agent Skills content under `plugins/*/skills/*/SKILL.md`. Host-specific plugin manifests and marketplaces are packaging adapters, not separate workflow implementations.

## Repository layout

- `plugins/<plugin>/skills/<skill>/SKILL.md`: portable workflow instructions following the Agent Skills specification.
- `plugins/<plugin>/skills/<skill>/references/`: detailed material loaded only when that skill calls for it.
- `plugins/<plugin>/.claude-plugin/plugin.json`: Claude Code plugin manifest.
- `plugins/<plugin>/.codex-plugin/plugin.json`: Codex plugin manifest.
- `.claude-plugin/marketplace.json`: generated Claude Code marketplace.
- `.agents/plugins/marketplace.json`: generated Codex marketplace.
- `package.json#pi.skills`: Pi package discovery for all plugin skill directories.
- `scripts/new-plugin.ts`: creates a cross-host plugin scaffold.
- `scripts/sync.ts`: validates plugins and synchronizes both marketplaces.

## Setup and checks

- No install step is required for normal edits; scripts run through `npx tsx`.
- Create a plugin: `npm run new -- <plugin-name>`.
- Regenerate marketplaces: `npm run sync`.
- Validate without writing: `npm run check`.
- Validate a Claude adapter directly: `claude plugin validate plugins/<plugin-name>`.

Run `npm run sync` after adding, removing, renaming, or changing plugin metadata. Run `npm run check` before finishing every change.

## Skill authoring rules

- Keep each skill in `skills/<name>/SKILL.md`; the frontmatter `name` must match the parent directory.
- Include only portable Agent Skills frontmatter unless a host-specific field is essential. `name` and `description` are required.
- Make `description` state both what the skill does and when it should trigger.
- Write host-neutral workflow instructions. Refer to capabilities generically, such as "ask the user" or "use task tracking when available," instead of naming one host's tools.
- Do not rely on host-only argument placeholders such as `$ARGUMENTS`. Describe how to parse arguments supplied with the invocation or user request.
- Use paths relative to the skill directory for supporting files. Keep detailed reference material one level below `SKILL.md` in `references/`.
- Keep `SKILL.md` under 500 lines. Move supporting detail to references rather than adding more always-loaded context.
- New handoff documents belong in `.agents/handoffs/`. Read the legacy `.claude/handoffs/` location only as a migration fallback.

## Manifest rules

- Keep `name`, `version`, and `description` identical between the Claude and Codex manifests for a plugin.
- Keep manifest paths relative to the plugin root and prefixed with `./`.
- Point both adapters at the same `./skills/` directory.
- Do not hand-edit generated marketplace entries. Change plugin manifests, then run `npm run sync`.
- When plugin content changes, bump the same semantic version in both manifests. CI performs patch bumps on `main`, but manual version changes must also stay in lockstep.
- Add Pi discovery through the existing `./plugins/*/skills` glob; do not duplicate skills under a Pi-specific directory.

## Style and safety

- TypeScript uses four-space indentation, single quotes, and semicolons.
- Keep generated JSON deterministically sorted by plugin name and terminated by a newline.
- Preserve unrelated worktree changes. In particular, do not treat a directory as a plugin unless both host manifests are present.
- Never add credentials, tokens, or generated dependency directories.
