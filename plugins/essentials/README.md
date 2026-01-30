# Essentials Plugin

Core productivity workflows for Claude Code.

## Installation

```
/plugin install essentials@gjtorikian
```

## Commands

### `/pr` - Create Pull Request

Creates a pull request with a structured template including:

- **Summary**: 1-3 bullet points describing what changed
- **Why**: Brief context on why the change was needed
- **Notes**: Optional information for reviewers

The command analyzes `git status` and `git log` to understand branch changes, and drafts an appropriate title and body.
