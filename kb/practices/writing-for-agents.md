---
id: practice.writing-for-agents
title: Writing engineering knowledge for agents
type: practice
status: draft
summary: Structure written knowledge so an agent can find and load the small relevant slice, rather than being handed everything or nothing.
domains: [agentic, delivery]
related: [principle.optimise-for-deletion]
created: 2026-08-24
updated: 2026-08-24
---

> **Seed entry.** This is the entry point for the agentic-practice section of the KB and
> currently covers the retrieval angle only. Planned siblings are listed under
> *Still to write*.

## What

Knowledge written for agents has a different shape from knowledge written for people. A
person skims a long document and takes what they need. An agent pays for every token it
loads, has no memory between sessions, and will confidently act on whatever it was given —
including the irrelevant parts.

So the unit of writing is not the document. It's the **retrievable entry**: small, tagged
with the condition under which it applies, and safe to load in isolation.

## Why

The two common failure modes are opposites:

- **Everything.** A 4,000-line rules file loaded on every task. It dilutes attention, the
  agent follows the first plausibly-matching rule, and the cost is paid on every turn.
- **Nothing.** Conventions that live only in people's heads, so the agent invents its own
  and produces plausible code that fits no existing pattern.

Both come from the same root cause: knowledge that isn't addressable. If it can't be
selected, it has to be all-or-nothing.

## How

1. **One idea per file.** If a file needs two summaries, it's two files.
2. **Write the trigger condition explicitly.** `applies_when` is not decoration — it's the
   field an agent matches a task against. "You must publish an event and commit a database
   write atomically" beats "for reliable messaging".
3. **Front-load a standalone summary.** It will be read out of context, in a list, next to
   fifty others. It has to make sense there.
4. **Keep a cheap index.** One line per entry is enough to decide what to load. Generate it
   — a hand-maintained index goes stale and then actively misleads.
5. **Progressive disclosure.** Index → matching entries → linked entries, only when the
   entry says the link matters. Never the whole tree.
6. **Say when it does not apply.** An agent given only positive guidance will apply it
   everywhere. The boundary is the most load-bearing part of the entry.
7. **Prefer instructions over description.** "Stage the event in the same transaction" is
   actionable. "The outbox pattern involves staging events" is trivia.
8. **Validate the metadata in CI.** Structure that isn't enforced degrades to prose within
   a month.

## Signals it's working

- Agent sessions load three to five entries for a task, not the repository.
- Output matches the conventions without them being re-explained in the prompt.
- New entries get written *because* an agent got something wrong — the KB grows from
  observed failures rather than speculation.

## Anti-patterns

- **The mega rules file.** Everything in one `CLAUDE.md`, growing monotonically, never
  pruned. It stops being read carefully long before it stops growing.
- **Documentation cosplay.** Rewriting library docs into the KB. Link out; keep only the
  judgement that's yours.
- **Tag soup.** Twenty domains, each used once. Controlled vocabulary or nothing.
- **Rules with no boundary.** "Always use X" with no exception clause produces X in places
  X is actively wrong, and you won't find out until review.

## When it doesn't apply

For a genuinely small body of knowledge — a handful of conventions for one repo — a single
plain file is correct, and this machinery is overhead. The structure earns its keep at the
point where you can no longer load all of it at once.

## Still to write

- Context engineering: what belongs in the system prompt vs a skill vs retrieved at runtime
- Skills vs subagents vs hooks — choosing the right extension point
- Evaluating agent output: what to review closely and what to trust
- Guardrails: which checks belong in CI rather than in an instruction
