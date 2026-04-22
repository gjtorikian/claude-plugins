---
name: pr
description: Analyzes branch commits, generates a structured PR description with summary and test plan, then creates the PR via gh CLI. Use when the user asks to "open a PR", "create a pull request", "submit a PR", or push a branch for review. Do NOT use for creating commits — use /commit for that.
allowed-tools: [Bash, Read, Glob, Grep, AskUserQuestion, TaskCreate, TaskUpdate]
argument-hint: "[base-branch]"
---

Create GitHub pull requests with structured descriptions via `gh` CLI.

## Hard Rules

- Do not create the PR without showing the generated description and getting explicit user approval via `AskUserQuestion` — the description is the primary deliverable.
- Always push the branch before creating the PR (`gh pr create` requires a remote-tracking branch).
- Use HEREDOC syntax for PR body to preserve formatting.
- If the base branch is not main or master, use `AskUserQuestion` to ask which branch to target before generating the description.

## Process

### Phase 1: Validate State

1. Check current branch — if on main/master, stop and ask user to create a feature branch.
2. Run `git log main..HEAD --oneline` to see commits included in this PR. If empty, stop and inform the user there are no commits ahead of main.
3. Check if an open PR already exists for this branch (`gh pr list --head $(git branch --show-current)`). If so, inform the user and ask whether to update the existing PR or create a new one.

### Phase 2: Analyze Changes

4. Run `git diff main...HEAD --stat` to see file changes
5. Run `git log main..HEAD --format="%s%n%b"` to read all commit messages and bodies — these contain the _why_ for each change
6. Create a Task for the PR workflow (TaskCreate) with status `in_progress` — this ensures the PR URL and approval state survive context compaction at end of session.

### Phase 3: Generate Description

7. Analyze all changes and generate a PR title and description:
   - **Title**: Short (under 70 chars), imperative mood, captures the overall change
   - **Summary**: 3-5 bullet points of what changed and _why_ (pull motivation from commit bodies and session context)
   - **Test plan**: Checklist of verification steps
8. Use `AskUserQuestion` to present the title and description for approval. Use the `preview` field to show the full formatted output. Options:
   - "Create PR as shown" — proceed
   - "Edit title" — user provides new title via Other
   - "Edit description" — user provides new description via Other
   - "Cancel" — abort

### Phase 4: Push and Create

9. Push with `git push -u origin HEAD`. Show the command output.
10. Run `gh pr create` with the approved title and description:

```bash
gh pr create --title "the pr title" --body "$(cat <<'EOF'
## Summary
- Change 1
- Change 2

## Test plan
- [ ] Verify change 1
- [ ] Verify change 2
EOF
)"
```

12. If `gh pr create` fails, show the full error output and stop. Do not retry.
13. Update the Task with the PR URL and mark as completed (`TaskUpdate`).
14. Return the PR URL to the user.
