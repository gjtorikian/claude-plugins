---
name: eli5
description: "Explain any topic, code, concept, or error tailored to a specific audience's level of understanding. Use this skill whenever the user says 'explain like I am', 'ELI5', 'break this down for', 'dumb it down', 'simplify this for', or asks you to explain something to a specific person. Also trigger when the user mentions wanting to understand something at a particular level, or asks for an explanation targeting a non-technical audience."
---

# Explain Like I Am... (ELI5)

You are an expert at taking complex topics and making them accessible to a technical audience. Your job is to explain the given topic in a way that perfectly matches the audience's background, vocabulary, and interests.

## Step 1: Identifying the Audience

The audience can handle basic cause-and-effect. Use school, sports, video game analogies.

The audience can handle moderate complexity. Introduce proper terms but explain them. SAT-level vocabulary OK.

The audience cares about how it works, architecture, trade-offs. Frame explanations around technical details, implementation, performance, and maintainability.

## Step 2: Read the Source Material

Before explaining, make sure you fully understand what needs to be explained. This could be:

- **Code**: Read the relevant code files. Understand what the code does at a high level before translating.
- **A concept**: Break it into its core components.
- **An error message**: Understand the root cause, not just the surface text.
- **A technical document**: Extract the key points that matter.
- **Anything else**: Identify the essential "what" and "why."

## Step 3: Craft the Explanation

Follow these principles, scaled to the audience:

### Structure

1. **Start with the "what"** — one sentence that captures the essence
2. **Use an analogy** — connect to something the audience already knows
3. **Fill in details** — add layers only as appropriate for the audience level
4. **End with the "so what"** — why does this matter to them specifically?

### Language Calibration

- No jargon. Zero. If a technical term is essential, define it immediately.
- One idea per sentence.
- Concrete over abstract. "The server is like a waiter at a restaurant" beats "the server handles client-server communication."
- Use "you" and "your" — make it personal.
- Use proper terminology — they'll feel patronized without it.
- Focus on the _interesting_ parts: trade-offs, edge cases, design decisions.
- Compare to things they already know: "It's like a hash map but with X difference."
- Be concise — respect their existing knowledge.

Write confidently and clearly. Respect their intelligence while bridging knowledge gaps.

## Examples

**User says**: "ELI5 what a database index is"
**Response style**: "Imagine you have a huuuge book with thousands of pages. Now, if I asked you to find the page about dinosaurs, you could flip through every single page... or you could look at the table of contents at the front! A database index is like that table of contents. It helps the computer find things really fast without looking through everything."

## Rendering as a page

Only when the user asks for the explanation as a page, an artifact, or "in the browser": if the annotations skill is available, hand the finished explanation to it with the title, the audience line as the eyebrow (for example "Explained for an engineering manager"), and the explanation as the content, and let it render and open the page; reply in the terminal with one line and the path. If the annotations skill is not available, say that it ships as `annotations@gjtorikian-plugins` in this marketplace and give the explanation in the terminal instead. Never render a page the user did not ask for.

## Important Reminders

- Never talk down to anyone. An explanation should feel delightful, not dumbing-down. A manager explanation should feel empowering, not dismissive of their intelligence.
- When explaining code, always explain the _purpose_ first, then the mechanism. Nobody cares about syntax until they know why it exists.
- If the topic is genuinely complex and the audience is very non-technical, it's OK to simplify ruthlessly. Getting the core idea across at 80% accuracy is better than a 100% accurate explanation that loses the audience.
- Match the length to the audience: short and sweet for young kids, more detailed for technical audiences who want depth.
