---
name: pr
description: Analyzes branch commits, generates a structured PR description, then creates the PR via the GitHub CLI. Use when the user asks to open, create, or submit a pull request or push a branch for review. Do not use for creating commits; use the commit skill for that.
---

Create GitHub pull requests with structured descriptions via `gh` CLI.

## Arguments

- `[base-branch]` — the branch to target (defaults to the repository's default branch).
- `--force` — skip the editor approval step entirely: create the PR immediately using the generated title and description as-is.

## Hard Rules

- Do not create the PR without the user approving the title and description — the description is the primary deliverable. Prefer the user's configured editor when it can be launched safely; otherwise present the draft in chat and ask for explicit approval. Use exactly what the user approves. **Exception:** when `--force` is passed, use the generated draft verbatim.
- Always push the branch before creating the PR (`gh pr create` requires a remote-tracking branch).
- Pass the PR body via `--body-file` (not `--body`) so the user's edited Markdown is preserved verbatim.
- Resolve the base branch before analyzing commits. Honor a base supplied by the user; otherwise use the repository's default branch.
- Do not add a "Test" header section.
- Never add a `Co-Authored-By` trailer to the body of the PR.

## Process

### Phase 1: Validate State

1. Resolve `<base>` from the supplied argument. If none was supplied, run `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'`. If that fails, infer `main` or `master` from local branches; ask the user only if the base remains ambiguous.
2. Check the current branch. If it is `<base>`, stop and ask the user to create a feature branch.
3. Run `git log <base>..HEAD --oneline` to see commits included in this PR. If empty, stop and inform the user there are no commits ahead of `<base>`.
4. Check if an open PR already exists for this branch (`gh pr list --head $(git branch --show-current)`). If so, return its URL and ask whether the user wants to update it; do not attempt to create a duplicate PR.

### Phase 2: Analyze Changes

5. Run `git diff <base>...HEAD --stat` to see file changes.
6. Run `git log <base>..HEAD --format="%s%n%b"` to read all commit messages and bodies — these contain the _why_ for each change.
7. Record the PR workflow with the host's task-tracking feature when available so the PR URL and approval state survive context compaction.

### Phase 3: Generate Description

8. Analyze all changes and generate a PR title and description:
   - **Title**: Must start with a conventional commit type prefix — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, or `style:`. Append `!` before the colon for breaking changes (e.g., `feat!:`). Choose the type that best describes the _overall_ PR:
     - If all commits share the same type, use that type
     - If commits mix types, pick the most significant one (features outweigh chores, fixes outweigh style)
     - A scope is optional: `feat(auth): Add OAuth2 login`
     - Keep the full title under 70 characters, imperative mood
   - **Summary**: 3-5 bullet points of what changed and _why_ (pull motivation from commit bodies and session context)
9. Write the draft to a temporary file — **title on line 1**, a blank line, then the Markdown body. **If `--force` was passed, skip approval entirely** and proceed to step 10. Otherwise obtain approval using one of these paths:

   First resolve the editor to a concrete command — `git config --get core.editor`, else `$VISUAL`, else `$EDITOR` — then pick the launch path by editor type:
   - **GUI editor (`code`, `subl`, `zed`, …):** launch it non-blocking. Strip any `--wait` or `-w` flag, tell the user where the draft is open, and ask them to reply when they have saved it. If launching fails, use the chat-review path.
   - **Terminal editor (`vim`, `nano`, `hx`, …):** do not launch it through a non-interactive tool call. Give the user the literal, fully resolved command with the file path quoted, then wait for confirmation.

     ```
     vim "/path/to/temp/pr-draft.md"
     ```

   - **Chat review:** show the full title and body, then ask the user to approve, edit, or cancel.

   On either path, do not read the file back until the user confirms they've saved.

10. Read `pr-draft.md` back (immediately with `--force`; otherwise after the user saves and confirms):
   - First non-empty line → the PR **title**. Everything after the following blank line → the PR **body**.
   - If the file is empty (user cleared it to cancel), report the cancellation and stop.
   - Confirm the title still starts with a conventional type prefix; if the user removed it, re-add the most appropriate one.
   - Write the body portion to its own file (e.g. `pr-body.md`) for `--body-file`.

### Phase 4: Push and Create

11. Push with `git push -u origin HEAD`. Show the command output.
12. Run `gh pr create --base <base>` with the edited title and body:

    ```bash
    gh pr create --base <base> --title "feat(auth): Add OAuth2 login support" --body-file /path/to/temp/pr-body.md
    ```

13. If `gh pr create` fails, show the full error output and stop. Do not retry.
14. Update the tracked task with the PR URL and mark it complete, if task tracking is available.
15. Return the PR URL to the user.

GUI editors can launch from a non-interactive command, but terminal editors need the user's TTY. In either case, do not read the file back or create the PR until the user confirms approval.
