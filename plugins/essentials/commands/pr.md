---
description: Create a pull request with a structured template
---

# Create Pull Request

**Note**: If we're on `main`, then create a new feature branch following this pattern: `gjtorikian/${feature}`.

Create a PR for the current branch following this template:

## Title

Concise description of the change.

## Body Template

```
## Summary
<!-- 1-3 bullet points describing WHAT changed -->

## Why
<!-- Brief context on WHY this change was needed -->

## Notes
<!-- Optional: anything reviewers should know -->
```

## Process

1. Check `git status` and `git log` to understand changes on this branch
2. Draft title and body following the template
3. Emit the title and body as a Markdown file
