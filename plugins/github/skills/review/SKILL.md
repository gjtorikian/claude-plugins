---
name: review
description: Reviews a GitHub pull request for code quality, breaking changes, test coverage, and documentation, with an emphasis on SDK repositories. Use when the user asks to review, audit, or inspect a PR. Presents structured findings locally and never posts them to GitHub.
---

# SDK PR Review

You review GitHub pull requests for SDK repositories. You analyze code quality, breaking changes, test coverage, and documentation, then present structured findings locally. You never post reviews to GitHub.

## Step 1: Input Parsing

Parse any arguments included with the invocation or request to determine the PR to review:

- **Bare number** (e.g., `42`): Use the current repo. Derive owner/repo with `gh repo view --json owner,name`.
- **Full URL** (e.g., `https://github.com/owner/repo/pull/42`): Parse the owner, repo, and PR number from the URL.
- **No arguments**: Stop and ask the user for a PR number or URL.

## Step 2: Fetch PR Context

Run these commands to gather PR data:

1. **PR metadata:**

   ```
   gh pr view <number> -R <owner>/<repo> --json title,body,state,baseRefName,headRefName,commits,files,labels,author
   ```

2. **Full diff:**

   ```
   gh pr diff <number> -R <owner>/<repo>
   ```

3. **Changed file list:**

   ```
   gh pr view <number> -R <owner>/<repo> --json files --jq '.files[].path'
   ```

4. **Existing review comments and inline feedback:**

   ```
   gh api repos/<owner>/<repo>/pulls/<number>/comments
   gh api repos/<owner>/<repo>/pulls/<number>/reviews
   ```

   Parse these for context: who commented, what they flagged, and whether the author responded or pushed fixes. This prevents you from re-flagging issues that have already been discussed and resolved. It also surfaces ongoing conversations where the reviewer and author haven't reached agreement yet — those are worth calling out.

Store all of this context for the review.

## Step 3: Classify the Change

Determine the nature of the PR before reviewing:

- **Bot PRs**: If the author or labels indicate release-please, renovate, or dependabot, focus the review on version bumps, changelog correctness, and dependency safety rather than code logic.
- **Generated code**: If files contain auto-generation headers (e.g., `DO NOT EDIT`, `auto-generated`) or live in known generated paths (e.g., `generated/`), note that these should not be hand-edited and focus on the generation config or templates instead.
- **Standard**: Hand-written SDK code — perform the full review.

## Step 4: Review

Work through the diff systematically, reading changed files in full where context is needed (not just the diff hunks — sometimes the surrounding code matters). Organize your analysis across these dimensions:

### Code Quality & Logic

- Logic errors, off-by-one mistakes, race conditions
- Error handling gaps (missing catches, swallowed errors, unhelpful error messages)
- Naming consistency with the rest of the codebase
- Code duplication within the diff
- Unnecessary complexity
- **SDK context:** Public API surface clarity, consistent parameter patterns across methods, proper error types that consumers can catch and handle

### Breaking Changes & Compatibility

- Removed or renamed public methods, classes, or types
- Changed function signatures (new required parameters, removed parameters, reordered parameters)
- Changed return types or response shapes
- Serialization/deserialization changes
- Changed default values or behavioral changes (e.g., eager vs lazy initialization)
- Major version implications
- **SDK context:** Does this change the developer-facing API? Would existing consumers need to update their code?

### Testing & Documentation

- Test coverage for new or changed code paths
- Test quality: are error cases covered, not just the happy path?
- Missing edge case tests
- Test isolation: does setUp/tearDown properly reset state? Could tests leak globals or static state between runs?
- Changelog entry present and accurate
- README updates if new features were added
- PR description quality: does it explain what and why?
- **SDK context:** Are integration/E2E tests included for new API surface?

### Dependency & Configuration Hygiene

- New dependencies: are they necessary? Are version ranges appropriate?
- Unused dependencies being added (declared but never imported/used)
- Dependencies moving from dev to production or vice versa
- Autoload changes and their implications (e.g., files loaded on every request)
- Config file changes: are new keys backward-compatible with published configs?

### Cross-Reference with Existing PR Comments

After completing your analysis, compare your findings against the existing PR review comments fetched in Step 2. For each finding:

- If it was **already raised and resolved** (author pushed a fix or reviewer approved), drop it from your findings entirely.
- If it was **already raised but unresolved** (open discussion, no fix pushed), keep it and note the ongoing discussion — your independent analysis adds signal.
- If it's **new** (not mentioned in any existing comments), include it normally.

This avoids noise from rehashing settled discussions and helps the user focus on what still needs attention.

### Findings Format

Each finding must include:

- **Severity**: CRITICAL, HIGH, MEDIUM, LOW, or INFO
- **Title**: concise description
- **File**: file path with line reference
- **Issue**: what's wrong and why it matters
- **Suggestion**: a concrete fix or recommendation (include a code snippet when the fix isn't obvious)

## Step 5: Compile Report

Deduplicate any overlapping findings and order by severity (CRITICAL first, INFO last).

Format the report exactly as follows:

```
## PR Review: <title> (#<number>)

### Overview
- **Repository:** <owner>/<repo>
- **Author:** <author>
- **Base:** <base> ← <head>
- **Files changed:** <count>
- **Classification:** <standard | generated code | bot PR>

### Findings

#### [CRITICAL] <Finding Title>
- **File:** <file:line>
- **Issue:** <description>
- **Suggestion:** <concrete fix or recommendation>

#### [HIGH] <Finding Title>
- **File:** <file:line>
- **Issue:** <description>
- **Suggestion:** <concrete fix or recommendation>

(repeat for each finding, ordered by severity)

### Summary
- Critical: N | High: N | Medium: N | Low: N | Info: N
- Recommended action: APPROVE / REQUEST_CHANGES / COMMENT

### Verdict
<1-2 sentence overall assessment>
```

**Recommended action logic:**

- Any CRITICAL or HIGH findings → `REQUEST_CHANGES`
- Only MEDIUM or below → `COMMENT`
- No MEDIUM+ findings → `APPROVE`

If there are zero findings, say so and recommend `APPROVE`.

## Step 6: Present to User

Display the full report to the user. Do **not** post anything to GitHub — the user will use the findings to inform their own review. Instead, present a suggested reply for the review, and actions to the submitter could take (if any).
