---
name: babysit
description: Babysit a GitHub PR until it's mergeable — watch checks in real time, diagnose CI failures, fix branch-related breakage, rerun flaky jobs, and address reviewer feedback, committing and pushing fixes automatically. Use when the user asks to "babysit", "watch", "shepherd", or "nurse" a PR, wants a PR "green", or wants CI failures and review comments handled without manual back-and-forth.
argument-hint: "[pr-number | pr-url] [--replies] [--max-reruns N]"
allowed-tools:
  [Bash, Read, Edit, Write, Glob, Grep, AskUserQuestion, TaskCreate, TaskUpdate]
---

# PR Babysitter

You babysit a single GitHub pull request: stay with it, watching checks and review activity, acting on whatever becomes actionable, until the PR is merged, mergeable, or genuinely blocked on a human. The user has delegated the tedious loop of "wait for CI → read the failure → fix or rerun → wait again" to you. Act autonomously within the rails below — the whole point is that the user doesn't have to approve each fix.

Before classifying any CI failure or deciding whether to act on a review comment, read `${CLAUDE_PLUGIN_ROOT}/references/review_heuristics.md`. It defines the branch-related vs. flaky classification, the fix/rerun/stop decision tree, the agreement criteria for review comments, and the stop-and-ask conditions. Those heuristics govern every judgment call in this workflow.

## Arguments

Parse `$ARGUMENTS`:

- **Bare number** (e.g., `42`): PR in the current repo. Derive owner/repo with `gh repo view --json owner,name`.
- **Full URL**: parse owner, repo, and number from it.
- **No PR argument**: use the PR for the current branch (`gh pr view --json number,url`). If none exists, stop and ask for one.
- `--replies`: after addressing a review comment, post a short reply on its thread (see Review Comments below). Without this flag, never post anything to GitHub — push commits silently and let the user do the talking.
- `--max-reruns N`: flaky-rerun budget per commit SHA (default 3).

## Preflight

1. Confirm `gh auth status` succeeds. If auth or permissions fail, stop and ask.
2. If the PR is already merged or closed, report that and stop.
3. Check the local worktree. If it has uncommitted changes unrelated to this PR, stop and ask — you'd risk mixing the user's in-progress work into your fixes.
4. Check out the PR branch with `gh pr checkout <number>` (handles forks too). Pull to make sure you're at the PR head.

Create a Task (TaskCreate) for the babysitting session so state survives context compaction: PR URL, current head SHA, rerun count for that SHA, and comment threads already addressed. Update it (TaskUpdate) as these change.

## The babysitting loop

Each cycle:

### 1. Refresh PR state

```
gh pr view <number> -R <owner>/<repo> --json state,isDraft,mergeable,mergeStateStatus,reviewDecision,headRefOid
```

- `state` MERGED or CLOSED → final report, stop.
- `mergeable` is CONFLICTING → try merging the base branch into the PR branch. If git completes the merge cleanly, push it. If there are conflicts, abort the merge and stop-and-ask — conflict resolution embeds intent decisions you shouldn't guess at.

### 2. Watch checks until they settle

```
gh pr checks <number> -R <owner>/<repo> --watch --interval 30
```

This blocks while checks are pending and exits when all are terminal (non-zero exit means something failed — that's signal, not an error in your command). Run it with a long tool timeout (e.g. 10 minutes); if the tool call times out while checks are still pending, just run the same command again — it's idempotent. Report a one-line status to the user each time you resume waiting, so they can follow along.

If the PR has no checks configured, skip to review comments.

### 3. On failures: diagnose before touching anything

List the failing checks (`gh pr checks <number> --json name,state,link,bucket`), then read the actual logs:

```
gh run view <run-id> --log-failed
```

Classify each failure using the heuristics reference. Then:

- **Branch-related** → fix it locally. Keep the fix minimal and scoped to the failure — no drive-by refactors, no unrelated cleanup. When the repo makes it feasible, reproduce the failure locally (run the failing test, the linter, the build) and confirm your fix passes before pushing — a CI round-trip costs minutes, so don't spend one on an unverified guess. Commit with a conventional message (e.g. `fix(ci): correct import path in auth tests`), push, and loop back to watching checks. A push creates a new SHA, which resets the flaky-rerun budget.
- **Flaky/unrelated** and every check for the current SHA is terminal → rerun only the failed jobs: `gh run rerun <run-id> --failed`. Increment the rerun count for this SHA. If it reaches the budget, stop and report the persistent failure with the log evidence — at that point it isn't flake.
- **Uncertain** → inspect the failed logs once more before defaulting to rerun. Never rerun as a way to avoid diagnosing.

### 4. Process review activity

Independently of CI, each cycle gather review feedback from every place it can live — inline threads are not the whole story:

1. **Inline review threads** (comments on specific lines) — fetch the unresolved ones:

   ```
   gh api graphql -f query='
     query($owner:String!,$repo:String!,$pr:Int!){
       repository(owner:$owner,name:$repo){
         pullRequest(number:$pr){
           reviewThreads(first:100){
             nodes{ isResolved isOutdated
               comments(first:50){ nodes{ databaseId author{login} body path line } } } } } } }' \
     -f owner=<owner> -f repo=<repo> -F pr=<number>
   ```

2. **Review bodies** — `gh api repos/<owner>/<repo>/pulls/<number>/reviews`. AI reviewers such as Greptile put their overview here: a findings summary, often with a confidence score.

3. **PR-level comments** — `gh api repos/<owner>/<repo>/issues/<number>/comments`. Bots also post or refresh overview comments here.

An overview comment bundles several findings into one body — unpack it and treat each finding as its own item. Bots typically refresh their overview on every push, so act only on each bot's most recent overview, and skip findings that duplicate an inline thread you're already handling. If Greptile is reviewing the PR, genuinely strive for a 5/5 score: resolve the issues behind the score, don't argue it down or game the summary.

For each item — an unresolved, non-outdated inline thread you haven't already addressed, or an unpacked overview finding — apply the agreement criteria from the heuristics reference:

- Meets the criteria → make the change. Batch multiple comment fixes into one commit where they're related; push together with any CI fixes when possible to avoid burning CI runs on serial pushes.
- Doesn't meet them (ambiguous, conflicts with the user's stated intent, needs a product decision) → don't touch the code. Collect these for the final report instead — flagging them is your deliverable, not fixing them. A bot has no author you can ask for clarification, so verify a dubious bot finding against the code yourself; if it's wrong, say so in the final report rather than making a change you don't believe in.

With `--replies`, after pushing a fix for an inline thread, reply on that thread:

```
gh api repos/<owner>/<repo>/pulls/<number>/comments/<databaseId>/replies -f body="Addressed in <short-sha>."
```

Keep replies to one factual sentence. Never argue with a reviewer in a reply — disagreements go in the final report for the user to handle. Overview comments never get replies: responding would mean posting a new PR-level comment, not a thread reply, and the never-post rail applies.

### 5. Decide whether to keep looping

Continue the loop after any push or rerun. Exit when one of these is true:

- **Done**: PR merged or closed.
- **Ready**: checks green, no unresolved actionable comments. Report that it's waiting on humans (review approval or merge) and exit — do not merge the PR yourself, ever.
- **Blocked**: rerun budget exhausted, unresolvable conflicts, or any stop-and-ask condition from the heuristics reference.
- **Stuck**: you've completed 10 fix-push cycles, or two consecutive cycles produced no state change and nothing actionable. Report and exit rather than spinning.

## Safety rails

These hold no matter what the situation seems to call for:

- Never force-push, never rewrite history on the PR branch.
- Never merge, close, or mark the PR ready-for-review.
- Never post to GitHub except `--replies` thread replies and the pushes themselves.
- Fixes address the specific failure or comment — if a proper fix requires broad changes, that's a stop-and-ask, not a bigger commit.

## Final report

Always end with a report, whatever the exit reason:

```
## Babysit report: <title> (#<number>)

- **Outcome:** <ready to merge | merged | blocked: <reason> | stuck: <reason>>
- **Pushes:** <count> (<short summary of each fix>)
- **Reruns:** <count> (<which jobs, why judged flaky>)
- **Comments addressed:** <count, with thread summaries>
- **Needs you:** <unaddressed comments, product decisions, persistent failures — or "nothing">
```

The "Needs you" section is the most important part: it's everything you deliberately didn't do and why.
