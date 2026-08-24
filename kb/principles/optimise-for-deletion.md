---
id: principle.optimise-for-deletion
title: Optimise for deletion
type: principle
status: draft
summary: Design each component so it can be removed in an afternoon; ease of deletion is the most reliable proxy for loose coupling.
domains: [architecture]
related: []
created: 2026-08-24
updated: 2026-08-24
---

> **Seed entry.** Written by an agent on 2026-08-24 to demonstrate the shape of a
> principle. Rewrite it in your own voice with your own examples, or delete it.

## Statement

Build every component so that deleting it is a small, bounded piece of work. When choosing
between two designs, prefer the one that is easier to remove — not the one that is easier
to extend.

## Why

"Easy to extend" is a guess about a future you can't see. "Easy to delete" is a property
you can evaluate today, and it happens to be the same property as loose coupling, clear
ownership and honest interfaces — just phrased as something you can actually test.

Systems don't usually rot because a component was badly built. They rot because a
component that everyone agrees is wrong cannot be removed: six things reach into its
tables, its types leak through three layers, and nobody can name its full blast radius. The
cost of the mistake compounds because the exit is expensive.

## In practice

- Ask "what would it take to delete this?" in design review. If the answer is longer than
  a paragraph, the boundary is wrong.
- No shared mutable database tables across component boundaries — sharing a table welds two
  lifetimes together.
- Prefer duplicating a small type over importing it across a boundary you might want to cut.
- Feature flags and adapters at the seams: if the seam is real, the removal is a config
  change plus a folder delete.

## When it doesn't apply

- **Genuine platform primitives.** Auth, identity, the primary datastore. These are meant
  to be welded in; pretending otherwise buys abstraction you'll never cash in.
- **Small, short-lived systems.** Deletion-friendliness costs indirection. Below a certain
  size the whole thing is deletable anyway.
- **When it becomes an excuse for duplication at scale.** Three copies is a pattern; thirty
  is a missing library.
