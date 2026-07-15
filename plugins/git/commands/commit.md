---
name: commit
description: "Creates git commits with conventional commit messages (type(scope): subject + why-focused body). Analyzes changes, proposes logical splits, and requires approval before executing. Do NOT use for pushing, creating PRs, or amending published commits."
allowed-tools: [Bash, Read, Glob, Grep, AskUserQuestion, TaskCreate, TaskUpdate]
---

Generate well-crafted commit messages and create Git commits following The Seven Rules of Great Commits.

## Hard Rules

- Every `git commit` command must include a conventional type prefix (e.g., `feat:`, `fix(scope):`)
- Never add a `Co-Authored-By` trailer unless the user explicitly requests it.
- Warn before staging files that look like secrets (.env, \*.pem, id_rsa, credentials, tokens, keys).
- Do not write a body that restates the diff. The diff is already visible and a body that describes what changed adds zero information. If you cannot articulate the why, omit the body and write a subject-only commit.
- When motivation is unclear, default to a subject-only commit rather than describing what changed. A body that says "refactored X" is indistinguishable from no body at all. Only ask the user about motivation if they have explicitly requested a body or the change is large enough that future readers will clearly need context. Use the body to explain what and why vs. how. Assume the code explains the how;
  the message must explain the context and reasoning.
- Match the existing commit style in the repository when possible.
- When describing commands (`npm run`, `curl -X`, etc) wrap them in backticks so they appear as Markdown code
- The user gets final say on wording in their editor. Present commit messages by opening them in the user's configured editor — a native `git commit -e` for a single commit, or one combined review file for a multi-commit split (see Executing the Commit) — not by describing them in chat or asking for approval with `AskUserQuestion`. Whatever the user saves is what gets committed.

## Process

### Phase 1: Analyze Changes

1. Run `git status` to check for staged and unstaged changes
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to analyze ALL changes
3. Run `git log --oneline -10` to understand the repository's commit message style

### Phase 2: Plan Commit Strategy

4. **Evaluate if changes should be split** into multiple logical commits (see Splitting Commits below). Default to a single commit unless the diff clearly spans unrelated concerns (e.g. a bug fix in one module plus a feature in another). Tightly related changes — even across several files — should stay together.
5. Only if the diff clearly contains multiple unrelated changes, use `AskUserQuestion` to confirm the proposed split:
   - Option per proposed grouping (e.g. "Commit 1: auth refactor, Commit 2: payment fix")
   - Option to keep as single commit
   - User can select "Other" to describe a different split
     Otherwise, proceed as a single commit without prompting.
6. **If there are 2 or more planned commits**, create a Task for each one using TaskCreate. This is critical for multi-commit workflows — they often happen at the end of a session when context is low and Tasks survive compaction. Include in each task the files to stage, draft subject line, and motivation (if known). For a single commit, skip Task creation.
7. For each planned commit, draft a subject line and body following the rules in Phase 3

### Phase 3: Draft Messages and Determine Motivation

8. For each commit, determine the **motivation** (the _why_) by examining these sources in order:
   - **Session context** — the conversation history is your richest source of _why_. What did the user ask for? What problem were they solving? What decisions were made and why? If context has been compacted, check the session summary. You can also check handoff.md, if one exists.
   - **Task descriptions** — if work was tracked via Tasks during the session, they often capture intent
   - **PR descriptions, issue references, or TODO comments** in the diff
   - **The broader repository context** — why this approach was chosen over alternatives
9. **If the motivation is still unclear**, default to a subject-only commit. Do not guess at a body, and do not prompt the user unless the change is large or non-obvious enough that a future reader will clearly need the context. A clear subject is better than an interruption.
10. Draft each commit message with the subject and, only when motivation is known, a body that explains the _why_
11. **Update each commit's Task** with the final draft message (TaskUpdate), if Tasks were created

### Phase 4: Execute

Branch on how many commits are planned. The editor is the approval step in both cases — never prompt for message approval in chat.

**Single commit** — use the native git editor:

12. Stage the relevant files (`git add <specific-files>` or `git add -p`).
13. Write the drafted message to a temp file in the scratchpad and have the user open it for final approval by running `! git commit -F <tempfile> -e` (see Single-Commit Approval below).

**Multiple commits** — review the whole batch's wording in ONE editor, then commit in order:

12. Write every drafted message into a single review file in the scratchpad, separated by per-commit markers that name each commit's files (see Multi-Commit Approval below). Have the user open that one file in their editor (via a `!`-prefixed launch) so they can review and edit all the messages together.
13. When the editor closes, parse the file back into per-commit messages, then for each commit in chronological order: stage its files (`git add <specific-files>`) and commit with `git commit -F <group-msg-file>` — no `-e`, since the editing already happened.

Then, for either path:

14. **Mark each commit's Task as completed** (TaskUpdate with status `completed`), if Tasks were created.
15. Show the final result. Print the **full committed message** so the user sees exactly what landed even if they missed the editor tab — `git show -s --format=%B HEAD` for a single commit, or `git log --oneline` for a multi-commit batch. State that the commit is local and unpushed, and offer to amend the wording on request. To revise, re-post the launch as a `!` command (e.g. `! git commit --amend`) or take dictated edits and amend with `-F` yourself.

## Executing the Commit

The user's editor is the final say on wording. Always draft each message **with a conventional type prefix already present** (e.g. `feat:`, `fix(scope):`) so the commit-msg hook passes when the editor closes.

**Launch the editor through the session `!` prefix — not a Bash tool call.** Post the launch command for the user to run in their terminal (e.g. `! git commit -F <tempfile> -e`) and wait for them to save, close, and confirm. The Bash tool runs in a detached, non-interactive shell with no controlling terminal, and a `--wait` editor cannot block there: with no terminal session, `code --wait` returns 0 *immediately* without opening, so git commits your unedited draft and the user never sees it (and a terminal editor like `vim` has no TTY at all). The `!` prefix runs in the user's real interactive terminal, where `--wait` actually blocks and terminal editors get a TTY. Only launch it yourself from a Bash tool call if the editor is known to open and block in this environment.

**Before launching the editor, post a one-line heads-up in chat** so the user knows to look for it — e.g. "Opening the commit message in VS Code now — switch to it, edit if you like, then **save and close the tab** to commit." A GUI tab can open behind the terminal unnoticed; without this warning the user may close it (or it auto-closes) without realizing it was the commit editor, silently committing your unreviewed draft.

**After the editor closes, always echo the full committed message back in chat** (see step 15) — this is the reliable checkpoint even when the editor tab was missed. Never treat `git log --oneline` alone as sufficient confirmation.

This `!`-prefix launch covers **every** editor — GUI (`code --wait`, `subl --wait`) and terminal (`vim`, `nano`) alike. Do not special-case GUI editors as "safe to background": `code`/`subl` are often shell **aliases** absent from a non-interactive shell, and even as `PATH` binaries their `--wait` won't block without a real terminal session. If you ever do launch from a Bash tool call, treat exit 127, or an instant return with the committed message byte-for-byte identical to your draft, as "the editor never opened" and fall back to the `!` prefix.

### Single-Commit Approval

Write the draft to a temp file, then have the user run the commit via the `!` prefix. The `-e` opens the configured editor prefilled with the draft plus git's standard status comments; on save, git commits with the edited wording and strips comment lines automatically.

```
! git commit -F /path/to/scratchpad/commit-msg.txt -e
```

The temp file holds the subject on line 1, a blank line, then the body (if any):

```
feat(auth): Add OAuth2 support for GitHub login

GitHub is the primary VCS for 90% of our users. Supporting
OAuth2 login eliminates the separate account creation step
that was causing 40% drop-off during onboarding.
```

After the user runs the launch, confirm what happened:

- **Success** → committed. Echo the full final message back to the user (step 15). If the committed message is byte-for-byte identical to your draft, the user likely never saw the editor tab — say so explicitly and offer to reopen the editor or amend from dictated edits, rather than assuming silent approval.
- **Non-zero with "empty commit message"** → the user cleared the message to cancel. Do not retry; report the cancellation and stop.
- **Non-zero from the commit-msg hook** (e.g. the user removed the conventional prefix) → show the hook output and let the user decide; do not silently re-add and re-run.

### Multi-Commit Approval

Write all drafted messages into ONE review file so the user edits the whole batch's wording in a single editor pass. Separate commits with a marker line that names the commit's files (informational — it is stripped on parse):

```
# ===== Commit 1 · src/auth.ts =====
feat(auth): Add OAuth2 support for GitHub login

Why this change was needed, wrapped at 72 chars.

# ===== Commit 2 · src/ui/banner.tsx, src/ui/api.ts =====
fix(ui): Show retry banner on token refresh failure
```

Have the user open that file via the `!` prefix. Resolve the editor to a concrete command first — `git config --get core.editor`, else `$VISUAL`, else `$EDITOR` — then post it literally with the path quoted; do **not** paste an unquoted `${EDITOR}` expansion, since zsh (a common default) does not word-split it and would try to run `code --wait` as a single command name → `command not found`:

```
! code --wait "/path/to/scratchpad/commit-batch.txt"
```

When the editor closes, parse the file back:

- A line matching `^# =+ Commit \d+ ·` starts a new commit block. Everything from after that marker up to the next marker (or EOF) is that commit's message; trim surrounding blank lines and drop the marker lines themselves.
- If the **entire file is empty**, the user cancelled the whole batch — commit nothing and stop.
- If a **single block's message is empty** (cleared but others remain), skip that one commit, tell the user it was skipped, and continue with the rest. Never create an empty commit.
- Each parsed subject must still start with a conventional prefix; if a block lost it, report it and let the user decide rather than silently re-adding.

Then, for each non-empty block in order, write it to its own file and commit (no `-e`):

```bash
git add src/auth.ts
git commit -F /path/to/scratchpad/commit-msg-1.txt
git add src/ui/banner.tsx src/ui/api.ts
git commit -F /path/to/scratchpad/commit-msg-2.txt
```

## Splitting Commits

**Every commit should represent ONE logical change.** Before committing, analyze whether changes should be split.

### When to Split

Split changes into separate commits when you see:

- **Multiple unrelated fixes** - Bug fix in auth AND bug fix in payments = 2 commits
- **Feature + refactor** - New feature AND cleanup of existing code = 2 commits
- **Multiple files for different purposes** - Config change AND code change = likely 2 commits
- **Distinct logical steps** - Add migration, then add model, then add API = 3 commits

### Chronological Ordering

Commits should follow the logical order of development:

1. **Infrastructure first** - Dependencies, config, migrations
2. **Core changes second** - Models, business logic, services
3. **Surface changes last** - UI, API endpoints, tests for new behavior
4. **Cleanup at the end** - Refactors, removals, formatting (if any)

### How to Split

1. Use `git add -p` or `git add <specific-files>` to stage only related changes via git hunks
2. Commit that logical unit with a focused message
3. Stage the next logical unit
4. Repeat until all changes are committed

### Examples

**Bad**: One commit with message "Update auth and fix payment bug and add tests"

**Good**: Three commits:

```
fix(payments): Handle null amount in refund calculation
feat(auth): Add session timeout configuration
test(auth): Add tests for session timeout behavior
```

### When NOT to Split

Keep changes together when:

- They are tightly coupled (changing a function signature + all its callers)
- One change doesn't make sense without the other
- Splitting would leave the codebase in a broken intermediate state

## The Six Rules of Great Commits

Based on [Chris Beam's definitive guide](https://cbea.ms/git-commit/).

### 1. Separate Subject from Body with a Blank Line

```
type(scope): subject line here

Body starts after blank line. Explains the WHY, never the what.
```

### 2. Limit Subject to 50 Characters

- 50 characters is the target for readability
- 72 characters is the hard limit (GitHub truncates beyond this)
- Forces concise, meaningful summaries

### 3. Do Not End Subject with a Period

- Periods waste space and are unnecessary for headlines
- Write `fix: Resolve login timeout` not `fix: Resolve login timeout.`

### 4. Use Imperative Mood in Subject

Write commands, not descriptions of what happened:

- **Good**: `Add`, `Fix`, `Update`, `Remove`, `Refactor`
- **Bad**: `Added`, `Fixed`, `Updated`, `Removed`, `Refactored`

**Test**: "If applied, this commit will _[your subject line]_" should be grammatically correct.

### 5. Wrap Body at 72 Characters

- Manually wrap body text at 72 characters
- Allows room for Git's indentation in various tools

### 6. Use Body to Explain WHY, Never the What

This is the most important rule and the one most often violated.

- The **diff** shows _what_ changed and _how_ — never restate it in the body
- The **body** must answer: **Why was this change necessary?**
- Think of the body as a note to a future developer reading `git log` — they can see the code, but they can't see your reasoning

**The body must contain motivation, not description.** Ask yourself:

- What problem existed before this commit?
- Why was this particular approach chosen?
- What alternatives were considered and rejected?
- What non-obvious consequences does this change have?

**Good body** (explains why):

```
The app crashed on first run because no config file existed.
A default config eliminates the first-run failure without
requiring manual setup.
```

**Bad body** (restates the diff):

```
Added a check for the config file. If it doesn't exist,
creates a new one with default values. Updated the init
function to call createDefaultConfig().
```

**When the body adds nothing beyond the subject, omit it entirely.** A clear subject like `fix: Remove unused CSS import` needs no body.

## Commit Message Format

```
type(scope): imperative subject under 50 chars

The motivation for this change: what problem existed, why it
needed solving, and why this approach was chosen. Wrapped at
72 characters. Never restate what the diff already shows.

Optional footers like:
Fixes #123
BREAKING CHANGE: description of breaking change
```

## Commit Types

| Type       | Use For                                       |
| ---------- | --------------------------------------------- |
| `feat`     | New feature visible to users                  |
| `fix`      | Bug fix for existing functionality            |
| `docs`     | Documentation only changes                    |
| `style`    | Formatting, whitespace (no code logic change) |
| `refactor` | Code restructuring without behavior change    |
| `perf`     | Performance improvements                      |
| `test`     | Adding or updating tests                      |
| `build`    | Build system or external dependencies         |
| `ci`       | CI/CD configuration changes                   |
| `chore`    | Maintenance tasks (tooling, configs)          |
| `revert`   | Reverting a previous commit                   |

## Breaking Changes

For changes that break backward compatibility:

```
feat!: Remove deprecated authentication method

BREAKING CHANGE: The `legacyAuth()` function has been removed.
Migrate to `newAuth()` before upgrading. See migration guide
in docs/migration-v2.md.
```

## Examples

### Good Commit Messages

```
feat(auth): Add OAuth2 support for GitHub login

GitHub is the primary VCS for 90% of our users. Supporting
OAuth2 login eliminates the separate account creation step
that was causing 40% drop-off during onboarding.

Closes #234
```

```
fix: Prevent crash when config file is missing

The app crashed on first run because it expected a config
file that doesn't exist yet. Creating a default config
eliminates the first-run failure without requiring manual
setup from the user.
```

```
refactor: Extract validation logic into separate module

Validation was duplicated across 4 controllers, causing
bugs when rules were updated in one place but not others.
Centralizing ensures consistency and makes policy changes
atomic.
```

### Bad Commit Messages

```
fixed stuff                      # Too vague, not imperative
Updated the code.                # Says nothing useful
feat: added new feature.         # Not imperative, has period
WIP                              # Meaningless
```

### Bad Bodies (describe the what, not the why)

```
feat(auth): Add OAuth2 support for GitHub login

Added a new OAuth2 client configuration. Updated the auth
controller to handle GitHub callbacks. Added a new route
for /auth/github. Updated the user model to store GitHub
tokens.
```

This body just restates the diff. It tells you nothing about _why_ GitHub OAuth was added or what problem it solves.

## Edge Cases

### Amending Commits

Only offer to amend if:

- The previous commit was made in the current session
- It hasn't been pushed to remote
- User explicitly requests it

Otherwise, create a new commit.

### Empty Commits

Never create empty commits unless explicitly requested for CI triggers.

### Large Changesets

If there are many changed files, follow the Splitting Commits section above to break them into logical units.

### Generated Files

Warn if committing generated files (node_modules, dist/, build/, \*.min.js) that are typically gitignored.

### Trivial Changes

For truly mechanical changes (formatting, import sorting, dependency bumps), a subject-only message with no body is fine. The _why_ is self-evident.
