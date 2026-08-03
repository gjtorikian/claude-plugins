# Agent Plugins

A collection of portable coding-agent workflows for (at least) Codex, Claude Code, and Pi.

The reusable workflows follow the [Agent Skills specification](https://agentskills.io/specification): each one lives in a `skills/<name>/SKILL.md` directory. Host-specific manifests only package those shared skills. Repository guidance lives in [AGENTS.md](./AGENTS.md), following the [AGENTS.md standard](https://agents.md/).

## Install for Claude Code

Add the marketplace, then install the plugins you want:

```text
/plugin marketplace add gjtorikian/agent-plugins
/plugin install git@gjtorikian-plugins
/plugin install github@gjtorikian-plugins
/plugin install agents@gjtorikian-plugins
```

Claude namespaces installed skills by plugin, for example `/git:commit` and `/github:review`.

## Install for Codex

Add the repository marketplace and install the plugins you want:

```sh
codex plugin marketplace add gjtorikian/agent-plugins
codex plugin add git@gjtorikian-plugins
codex plugin add github@gjtorikian-plugins
codex plugin add agents@gjtorikian-plugins
```

Start a new Codex session after installation, then select a skill with `/skills` or mention it directly, such as `$commit` or `$review`.

## Install for Pi

Install the repository as one Pi package:

```sh
pi install git:github.com/gjtorikian/agent-plugins
```

Pi loads every shared skill declared in `package.json`. Invoke one with `/skill:commit`, `/skill:review`, or another listed skill name.

## Repository layout

```text
AGENTS.md                         # Canonical repository instructions
CLAUDE.md                         # Claude compatibility pointer
.agents/plugins/marketplace.json  # Codex marketplace
.claude-plugin/marketplace.json   # Claude marketplace
plugins/<plugin>/
├── .claude-plugin/plugin.json    # Claude package adapter
├── .codex-plugin/plugin.json     # Codex package adapter
└── skills/<skill>/SKILL.md       # Shared Agent Skill source
```

## Development

```sh
npm run new -- my-plugin
npm run sync
npm run check
```

- `npm run new -- <name>` scaffolds both host manifests and one portable skill.
- `npm run sync` regenerates both marketplaces from the plugin manifests.
- `npm run check` validates skills, manifest parity, and generated marketplaces without writing files.
