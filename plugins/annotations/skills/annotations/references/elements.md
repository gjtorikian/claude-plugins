# Content block elements

Every element and class the template styles. Compose the content block from these only. The template owns all styling: never add a `<style>` tag, a `style=` attribute, an external image, font, or script.

| Element or class | Purpose | Example |
| --- | --- | --- |
| `.eyebrow` | Two-part context line above the title: audience on the left, meta on the right. One per page, first thing in the header. | `<div class="eyebrow"><span>Explained for an engineering manager</span><span>2 min</span></div>` |
| `h1` | The single poster headline. One per page, inside the header, right after the eyebrow. | `<h1>An index is the book's table of contents.</h1>` |
| `.lede` | One-sentence standfirst under the headline. At most one. | `<p class="lede">Without one, every lookup reads the whole book.</p>` |
| `h2` | Section heading. Draws a 3px rule above itself. The layer gives it an `id` slugged from its text (`What it costs` becomes `what-it-costs`) and a `#` link on hover; write an `id` only to override. | `<h2>What it costs</h2>` |
| `h3` | Sub-heading inside a section. No rule. Gets an `id` and anchor the same way as `h2`. | `<h3>On writes</h3>` |
| `p` | Body paragraph. | `<p>The database keeps a sorted copy of one column.</p>` |
| `.block` | The one permitted black callout. **At most one per page.** Its first child is a `<b>` label, rendered as tracked uppercase on its own line. | `<div class="block"><b>The analogy</b><p>A 900-page manual with no contents page.</p></div>` |
| `.steps` | A numbered sequence as ruled rows. **Real sequences only** — not a styled bullet list. Each `li` holds two spans: the number, then the text. | `<ol class="steps"><li><span>01</span><span>Reads get fast.</span></li></ol>` |
| `.so-what` | The closing consequence line, under a 3px rule. Last thing on the page. | `<p class="so-what">So what: the fix is one line, and it ships this week.</p>` |
| `ul`, `ol` | Ordinary lists for unordered points or short enumerations. | `<ul><li>Reads</li><li>Writes</li></ul>` |
| `blockquote` | Quoted material, behind a 3px left rule. | `<blockquote>Every insert updates the index too.</blockquote>` |
| `code` | Inline identifier, path, or command. | `<p>One index on <code>users.email</code> is cheap.</p>` |
| `pre` + `code` | Code block. Scrolls horizontally inside its own box. | `<pre><code>CREATE INDEX ON users (email);</code></pre>` |
| `table` | Comparison or reference grid. Uppercase `th` row, ruled rows. | `<table><thead><tr><th>Option</th><th>Cost</th></tr></thead><tbody><tr><td>Index</td><td>Disk</td></tr></tbody></table>` |
| `.scroll` | Wrapper that makes wide content scroll inside its own box instead of the page. Wrap any table with more than about six columns. | `<div class="scroll"><table>…</table></div>` |
| `a` | Link. Underlined at 2px, inherits the ink color. In-page links point at a heading's slug. | `<p>See <a href="#what-it-costs">the costs</a>.</p>` |
| `strong` | Emphasis, rendered at weight 800. | `<p>This is <strong>the whole trick</strong>.</p>` |
| `img`, `svg`, `video` | Local or inline media only, capped at the measure. No `src` pointing at the network, and no `xmlns` on inline SVG. | `<svg viewBox="0 0 10 10"><rect width="10" height="10" /></svg>` |
| `pre.mermaid` | A mermaid diagram source block. Requires appending `mermaid-snippet.html` at the end of the content block. | `<pre class="mermaid">graph LR; A --> B;</pre>` |
| `mark.ann-mark` + `sup.ann-n` | A comment mark: a 3px underline on the passage, then a circled number after it. **Written by the annotation layer, not by you** — never place one by hand. | `<mark class="ann-mark" data-ann-id="a1">this passage</mark><sup class="ann-n" data-ann-id="a1">1</sup>` |
| `a.ann-anchor` | The hover `#` link at the end of every `h2`–`h6`. **Written by the annotation layer, not by you.** | `<h2 id="what-it-costs">What it costs<a class="ann-anchor" href="#what-it-costs"></a></h2>` |

## Structure of a page

```html
<header>
  <div class="eyebrow"><span>Audience</span><span>2 min</span></div>
  <h1>The one-sentence claim.</h1>
  <p class="lede">The consequence in one more sentence.</p>
</header>
<div class="block"><b>Label</b><p>The single black callout.</p></div>
<h2>A section</h2>
<p>Body copy.</p>
<p class="so-what">So what: the reason this matters.</p>
```
