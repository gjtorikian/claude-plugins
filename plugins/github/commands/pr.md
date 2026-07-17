---
name: pr
description: Analyzes branch commits, generates a structured PR description, then creates the PR via gh CLI. Use when the user asks to "open a PR", "create a pull request", "submit a PR", or push a branch for review. Do NOT use for creating commits — use /commit for that.
allowed-tools: [Bash, Read, Glob, Grep, AskUserQuestion, TaskCreate, TaskUpdate]
argument-hint: "[base-branch] [--force]"
---

Create GitHub pull requests with structured descriptions via `gh` CLI.

## Arguments

- `[base-branch]` — the branch to target (defaults to main/master).
- `--force` — skip the editor approval step entirely: create the PR immediately using the generated title and description as-is.

## Hard Rules

- Do not create the PR without the user approving the title and description in their editor — the description is the primary deliverable. Open the draft in the user's configured editor and use exactly what they save. Do not ask for approval in chat with `AskUserQuestion`. **Exception:** when `--force` is passed, skip the editor and use the generated draft verbatim.
- Always push the branch before creating the PR (`gh pr create` requires a remote-tracking branch).
- Pass the PR body via `--body-file` (not `--body`) so the user's edited Markdown is preserved verbatim.
- If the base branch is not main or master, use `AskUserQuestion` to ask which branch to target before generating the description.
- Do not add a "Test" header section.
- Never add a `Co-Authored-By` trailer to the body of the PR.

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
   - **Title**: Must start with a conventional commit type prefix — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`, or `style:`. Append `!` before the colon for breaking changes (e.g., `feat!:`). Choose the type that best describes the _overall_ PR:
     - If all commits share the same type, use that type
     - If commits mix types, pick the most significant one (features outweigh chores, fixes outweigh style)
     - A scope is optional: `feat(auth): Add OAuth2 login`
     - Keep the full title under 70 characters, imperative mood
   - **Summary**: 3-5 bullet points of what changed and _why_ (pull motivation from commit bodies and session context)
8. Write the draft to a temp file in the scratchpad — **title on line 1**, a blank line, then the Markdown body. **If `--force` was passed, skip the editor entirely**: proceed straight to step 9 using the draft as written. Otherwise open it in the user's editor for final approval, and use exactly what they save. The editor is the approval step — do not prompt for approval in chat.

   First resolve the editor to a concrete command — `git config --get core.editor`, else `$VISUAL`, else `$EDITOR` — then pick the launch path by editor type:
   - **GUI editor (`code`, `subl`, `zed`, …): launch it yourself from a Bash tool call, non-blocking.** Strip any `--wait`/`-w` flag — blocking is useless from a tool call (it would stall until the tool timeout while the user is still editing); the user's chat confirmation replaces it. Run e.g. `code "/path/to/scratchpad/pr-draft.md"`, tell the user the draft is open, and ask them to reply when they've saved (or to clear the file to cancel). If the command isn't found (exit 127 — the editor may be a shell alias), resolve it with `command -v <editor>` and retry with the real binary path; if the launch still fails, fall back to the `!` prefix path below.
   - **Terminal editor (`vim`, `nano`, `hx`, …): never launch it from a Bash tool call** — it needs a real TTY that only the user's terminal provides. Post the literal resolved command for the user to run with the session `!` prefix, file path quoted:

     ```
     ! vim "/path/to/scratchpad/pr-draft.md"
     ```

   - **Emit resolved commands literally; never paste an unquoted `${EDITOR}` expansion.** In zsh (a common default) unquoted parameter expansions are _not_ word-split, so `${EDITOR} file` runs the whole `code --wait` string as one command name → `command not found` (exit 127). Substitute the real value first.

   On either path, do not read the file back until the user confirms they've saved.

9. Read `pr-draft.md` back (immediately with `--force`; otherwise after the user saves and confirms):
   - First non-empty line → the PR **title**. Everything after the following blank line → the PR **body**.
   - If the file is empty (user cleared it to cancel), report the cancellation and stop.
   - Confirm the title still starts with a conventional type prefix; if the user removed it, re-add the most appropriate one.
   - Write the body portion to its own file (e.g. `pr-body.md`) for `--body-file`.

### Phase 4: Push and Create

10. Push with `git push -u origin HEAD`. Show the command output.
11. Run `gh pr create` with the edited title and body:

    ```bash
    gh pr create --title "feat(auth): Add OAuth2 login support" --body-file /path/to/scratchpad/pr-body.md
    ```

12. If `gh pr create` fails, show the full error output and stop. Do not retry.
13. Update the Task with the PR URL and mark as completed (`TaskUpdate`).
14. Return the PR URL to the user.

Why two launch paths: a GUI editor opens fine from a Bash tool call but cannot block there (`--wait` stalls the tool call while the user edits), so launch it non-blocking and let the user's chat reply signal "done" — the user shouldn't have to run a command themselves. Terminal editors are the opposite: they need a real TTY that only the user's terminal provides, so those go through the `!` prefix.
