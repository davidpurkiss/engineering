# Charter

What this knowledge base is for, and the rules it holds itself to.

## Purpose

Capture engineering judgement that would otherwise be re-derived from scratch on every
project, in a form that is equally usable by a person reading GitHub and by an agent
assembling context for a task.

## Goals

1. **Write it down once.** If I've explained something more than twice, it belongs here.
2. **Be specific enough to act on.** "Prefer simplicity" is worthless. "Prefer a single
   Postgres instance until you have a measured reason not to, and here is the measurement"
   is useful.
3. **Be honest about maturity.** A `draft` entry that says "I think this is right but I've
   only done it twice" is more valuable than false confidence.
4. **Be loadable in pieces.** An agent should be able to pull three relevant entries, not
   the whole repo. Metadata and generated indexes exist to make that possible.
5. **Stay portable.** The content is plain markdown. The Claude Code plugin is a delivery
   mechanism, not the format.

## Non-goals

- **Not a tutorial site.** Entries assume a working engineer. Link out for basics.
- **Not a neutral survey.** These are opinions with reasons attached. Where a real
  trade-off exists, the entry names the alternative and says when to pick it instead.
- **Not documentation for a specific system.** No company-internal detail, no secrets, no
  client work. If it can't be public, it doesn't go in.
- **Not a link dump.** Every entry has to say something in my own words. Sources go at the
  bottom.

## Rules the KB holds itself to

- **One idea per entry.** If an entry needs two summaries, it's two entries.
- **Every entry states when it does *not* apply.** An entry with no failure conditions is
  either trivially true or not yet understood.
- **Principles are load-bearing and rare.** Adding one should feel expensive. Ten to
  fifteen is a healthy ceiling.
- **Decisions are append-only.** An ADR is never edited to change its meaning — it is
  superseded by a new one.
- **`index/` is generated.** Hand-editing it is a bug; CI will catch it.
- **Nothing merges that fails `npm run validate`.**

## Success criteria

- I can hand a new agent session the repo and get output that matches how I'd have built
  it, without re-explaining.
- I can answer "why did we do it that way" from `kb/decisions/` a year later.
- The thing gets used, not just written.
