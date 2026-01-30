# Claude Plugins

A personal collection of Claude Code plugins.

## Setup

Add this marketplace:

```
/plugin marketplace add gjtorikian/claude-plugins
```

Then install plugins:

```
/plugin install essentials@gjtorikian
```

## Available Plugins

| Plugin | Description |
|--------|-------------|
| [essentials](./plugins/essentials) | Core productivity workflows including PR creation |

## Adding New Plugins

1. Create a new directory under `plugins/`
2. Add a `.claude-plugin/plugin.json` configuration file
3. Add commands in `commands/` directory as markdown files

## License

MIT
