---
name: kb-lookup
description: Load the relevant entries from the engineering knowledge base before designing, implementing or reviewing anything architectural. Use when the task involves choosing a structure, adding a service or integration, handling failure, messaging, data access, observability, or deciding how to build something rather than just editing it. Also use when the user asks what the KB says about a topic.
allowed-tools: Read, Grep, Glob
---

# Look up the engineering KB

Retrieve the smallest useful slice of the knowledge base and apply it. Do **not** read the
whole `kb/` tree — that defeats the point.

## Steps

1. **Read the index**: `${CLAUDE_PLUGIN_ROOT}/index/INDEX.md`. One line per entry: status
   mark, title, and a summary written to be read out of context.

2. **Match the task.** Compare it against each `summary`, and for patterns against the
   `applies_when` line in the entry frontmatter. Filter on the status mark: `✓` stable is
   safe to apply, `·` draft is a starting point to flag rather than follow silently, `⚠`
   deprecated and `✕` superseded should not be applied to new work — mention them only if
   the user is looking at existing code that uses them.

   If the task is domain-shaped rather than problem-shaped ("what do we think about
   observability?"), use `${CLAUDE_PLUGIN_ROOT}/index/by-domain.md` instead.

3. **Load only the matches.** Typically three to five entries. If nothing matches, say so
   rather than stretching an entry to fit — a gap in the KB is useful information.

4. **Follow `related` ids only when the entry says the link matters.** Depth one, not a
   transitive crawl.

5. **Apply and attribute.** State which entries you're applying, by title. When an entry's
   *when it doesn't apply* section covers the current situation, say that and don't apply
   it. When two entries pull in different directions, surface the tension instead of
   silently picking one.

## Rules

- Quote the entry's own words for the constraint; don't paraphrase a rule into something
  weaker.
- A `draft` entry is an opinion in progress. Apply it, but tell the user it's draft.
- Never invent an entry. If you're recommending something the KB doesn't cover, label it as
  your own judgement, and offer to add it via `kb-author`.
