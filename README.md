# Claude Plugins

A personal collection of Claude Code plugins.

## Setup

Add this marketplace:

```
/plugin marketplace add gjtorikian/claude-plugins
```

Then install plugins:

```
/plugin install git@gjtorikian-plugins
/plugin install github@gjtorikian-plugins
/plugin install agents@gjtorikian-plugins
```

Update at will:

```
/plugin marketplace update gjtorikian-plugins
/plugin update git@gjtorikian-plugins
/plugin update github@gjtorikian-plugins
/plugin update agents@gjtorikian-plugins
```

## Available Plugins

| Plugin                         | Description                                  |
| ------------------------------ | -------------------------------------------- |
| [git](./plugins/git)           | Git workflow commands for commits             |
| [github](./plugins/github)     | GitHub workflow commands for pull requests    |
| [agents](./plugins/agents)     | AI agent workflow commands for session handoffs |

## Scripts

| Command              | What it does                                                                      | When to use it                                                 |
| -------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `npm run new <name>` | Scaffolds a new plugin directory with `plugin.json`, `commands/`, and `README.md` | Starting a brand new plugin                                    |
| `npm run sync`       | Scans `plugins/` and regenerates `.claude-plugin/marketplace.json`                | After adding, removing, or updating any plugin's `plugin.json` |

Typical workflow:

```sh
npm run new my-plugin        # scaffold it
# ... edit plugin.json, add commands ...
npm run sync                 # update the marketplace
git add -A && git commit     # deploy (marketplace is live on main)
```

## License

MIT
