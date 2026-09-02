---
name: annotations
description: "Render agent output (an explanation, review, report, or comparison) as a self-contained black-and-white HTML page in the browser, with an in-page annotation layer that hands comments back as a markdown digest. Use when the user asks for output 'as a page', 'as an artifact', 'in the browser', 'render this', 'make this a doc I can mark up', or pastes a '# Page annotations' digest to act on. Not for terminal-sized answers."
---

# Annotations

You turn content into a finished page the user can read in a browser and mark up. The design is already decided and already written: a template ships with this skill, and your only job is to compose good HTML for the content region, drop it in, and open the result. Do not design anything.

## What you produce

One file: `.agents/artifacts/<slug>.html`, in the current project, opened in the user's browser.

Then one line in the terminal — the path, plus:

> Mark text on the page, press Copy for agent, and paste the result here.

Nothing else goes to the terminal. The page is the answer; the terminal line is the receipt.

## Arguments

Parse these from the invocation or the surrounding request. Never ask for what you can infer.

- **`title`** (required). The page's headline: one sentence, a claim rather than a label ("An index is the book's table of contents." beats "Database indexes"). If the user did not give one, write one from the content.
- **`content`** (required). What to render. Usually the answer you just gave, or the answer you are about to write. It can also be a file the user names, in which case read it first.
- **`eyebrow`** (optional). The context line above the headline, such as `Explained for an engineering manager`. Infer it from the request when the user described an audience; otherwise use a short descriptor of what the page is ("Code review", "Migration plan").

If the user says only "render this" or "as a page", the content is the previous answer in the conversation and the title is yours to write.

## Step 1: Compose the content block

Read [references/elements.md](references/elements.md) relative to this skill before composing. It is the complete vocabulary: every element and class the template styles, with an example of each.

Write semantic HTML using only what that file lists. Rules:

- **No styling of your own.** No `<style>` tag, no `style=` attribute, no class the reference does not list. The template owns the design, and a page that adds to it drifts from every other page.
- **No network references.** No external images, fonts, scripts, or stylesheets. The page must render with the machine offline.
- **At most one `.block`** — the black callout — per page. It is the one loud element; two of them cancel each other out.
- **`.steps` only for real sequences.** If the items are not ordered in time or dependency, use a plain `<ul>`.
- **The masthead goes inside the content block.** Open with a `<header>` holding the `.eyebrow`, the `<h1>`, and the `.lede`. Everything outside the content markers is identical on every page.
- **Close with `.so-what`** — one sentence on why this matters to the reader.
- **For a mermaid diagram**, write `<pre class="mermaid">…</pre>` where the diagram belongs, then append the entire contents of [references/mermaid-snippet.html](references/mermaid-snippet.html) at the *end of the content block*, still inside the markers. That snippet is the only place a network URL is allowed.

## Step 2: Render

1. **Slug.** Lowercase the title, replace every run of non-alphanumeric characters with a single hyphen, trim leading and trailing hyphens, cut to 60 characters. If nothing survives, use `page`.

2. **Directory.** Create the artifacts directory and, when it is absent, the ignore file that keeps rendered pages out of git:

   ```sh
   mkdir -p .agents/artifacts
   [ -f .agents/artifacts/.gitignore ] || printf '*\n' > .agents/artifacts/.gitignore
   ```

   Never touch the project's own `.gitignore` — the directory ignores itself.

3. **Copy the template.** Copy `references/template.html` (the file next to this SKILL.md, under `references/`) to `.agents/artifacts/<slug>.html` with a shell copy. Copy it; do not retype it, and do not read it in order to reproduce it.

4. **Make exactly three edits** with your file-edit capability:

   - Set the `<title>` to the page title.
   - Set the slug meta's `content` attribute: `<meta name="annotations-slug" content="<slug>">`.
   - Replace the two marker lines

     ```html
     <!-- ANNOTATIONS:CONTENT:START -->
     <!-- ANNOTATIONS:CONTENT:END -->
     ```

     with the START marker, your content block, and the END marker — both markers preserved exactly as written, character for character.

   Touch nothing else. Outside `<title>`, the slug meta, and the region between the markers, the page must stay byte-identical to the template.

## Step 3: Open it

```sh
open "$f" 2>/dev/null || xdg-open "$f" 2>/dev/null || echo "Open this in your browser: file://$PWD/$f"
```

Where `$f` is the path you just wrote. If no launcher exists — a container, CI, some WSL setups — the printed `file://` path is the fallback, and the summary line always carries the path anyway.

## Re-rendering the same page

Same title means the same slug means the same file. Overwrite it and open it again. Tell the user the file was replaced rather than added, so a second page with a title they meant to be different does not silently vanish.

## Comments on the page

The template already carries the annotation layer, so you never write it and never mention it in the content. On the rendered page the reader selects any text inside the content, types a comment into the popover that appears, and saves it; the passage gains a 3px underline and a circled number, and clicking either one reopens that comment to edit or delete. A fixed **Copy for agent (N)** button in the corner puts every comment on the clipboard as one markdown digest. If the browser refuses the clipboard — a `file://` page often does — the layer opens a panel holding the same text to copy by hand.

The digest is what comes back to you:

```
# Page annotations

Page: An index is the book's table of contents. (an-index-is-the-book-s-table-of-contents)

1. > "Reads get fast because the lookup jumps straight to the page."

   Which table is this? Cite the migration.

(1 comment)
```

Comments live in memory only: a reload clears them, and nothing is written beside the page. The layer's API is `window.__annotations` — `add`, `remove`, `list`, and `digest` — available in the browser console when you need to inspect or drive the page yourself. The buttons on the page are the supported path for the reader.

## When the user pastes a digest

A digest begins with `# Page annotations` and continues as a numbered list, each item quoting a passage from the page and giving a comment on it.

Treat every item as feedback on that specific passage:

1. Locate the quoted passage in the content you rendered.
2. Decide what the comment asks for — a correction, a cut, an expansion, a rewrite. Ask only if an item is genuinely ambiguous.
3. Revise the content block accordingly.
4. Re-render to the same slug and open it again.
5. Summarize in one line per item what you changed, in the digest's numbering.

If an item asks for something you disagree with, say so in its line instead of silently ignoring it.

## Design rules

Black ink on white paper, inverted for dark mode. Poster-scale grotesk headline, 3px rules between sections, at most one black callout block, and no decoration beyond that — no color, no shadows, no rounded corners, no icons. Comment marks are a 3px underline plus a circled number. The template already contains all of it, so your content block adds no styling of any kind.

## Example

**User**: "ELI5 database indexes for my engineering manager, and render it as a page."

Title: `An index is the book's table of contents.` Slug: `an-index-is-the-book-s-table-of-contents`. Eyebrow: `Explained for an engineering manager`. The content block:

```html
<header>
  <div class="eyebrow"><span>Explained for an engineering manager</span><span>2 min</span></div>
  <h1>An index is the book's table of contents.</h1>
  <p class="lede">Without one, every lookup reads the whole book.</p>
</header>
<div class="block"><b>The analogy</b><p>A 900-page manual with no contents page. To find "billing," you flip every page. An index is the contents page the database keeps for one column.</p></div>
<ol class="steps">
  <li><span>01</span><span>Reads get fast because the lookup jumps straight to the page.</span></li>
  <li><span>02</span><span>Writes get slightly slower: every insert updates the contents page too.</span></li>
  <li><span>03</span><span>It costs disk. One index on <code>users.email</code> is cheap; forty are not.</span></li>
</ol>
<p class="so-what">So what: the fix for the slow customer search is one line, and it ships this week.</p>
```

Terminal afterward:

> `.agents/artifacts/an-index-is-the-book-s-table-of-contents.html` — Mark text on the page, press Copy for agent, and paste the result here.

## Important reminders

- The page is the deliverable. Do not also paste the full content into the terminal.
- Write for the page, not for a chat window: real headings, short paragraphs, one idea each.
- One `.block` per page. One `<h1>` per page. One `.lede` per page.
- Never invent a class. If the vocabulary in `references/elements.md` cannot express something, say it in plain paragraphs.
- Rendered pages are disposable. They live in `.agents/artifacts/`, are ignored by git, and are safe to delete.
