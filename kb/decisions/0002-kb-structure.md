---
id: decision.0002-kb-structure
title: Organise by entry type with domain as frontmatter tags
type: decision
status: stable
summary: The kb/ tree is split by entry type; domain, stack and maturity are frontmatter tags rolled up into generated indexes.
domains: [agentic, delivery, architecture]
related: [practice.writing-for-agents]
created: 2026-08-24
updated: 2026-08-24
---

## Context

The KB needed a top-level organisation before content accumulated, because retrofitting one
across a hundred files is expensive. Three options were on the table:

1. **By content type** — `principles/ patterns/ practices/ rfcs/ decisions/`. Simple, no
   tooling, but nothing can answer "everything about AI" or "what's still draft" without
   grep, and adding metadata later means touching every file.
2. **By domain** — `ai/ backend/ data/ …`, each with its own type split. Natural to browse,
   but every domain re-invents the same subfolders, principles are cross-cutting and end up
   duplicated or arbitrarily filed, and an entry like the transactional outbox belongs to
   backend *and* data *and* messaging with no single home.
3. **Hybrid** — type-based folders plus a controlled tag vocabulary in frontmatter, with
   generated indexes providing the domain view.

The deciding constraint is that the primary consumer is an agent assembling context. That
requires entries to be *selectable* by condition, which requires machine-readable metadata
regardless of what the tree looks like.

## Decision

Option 3. `kb/` is split by entry type. `domains`, `stack` and `status` live in YAML
frontmatter against controlled vocabularies. `scripts/build-index.mjs` generates
`index/INDEX.md`, `index/by-domain.md` and `index/by-stack.md`;
`scripts/validate.mjs` enforces the schema and is run in CI.

Both scripts are dependency-free Node so that cloning and checking requires no install step.

## Consequences

- Each entry has exactly one home. Cross-cutting entries are tagged, not duplicated.
- The domain view exists but is generated, so it can never drift from the content.
- Frontmatter discipline is now mandatory. It is enforced by `npm run validate` in CI
  rather than by remembering.
- Two small scripts must be maintained. The hand-rolled YAML parser supports a deliberately
  narrow subset — scalars, quoted strings, inline and block lists — which keeps it under a
  hundred lines and is enough for this schema.
- Adding a domain is a two-line change plus a doc note, which keeps the vocabulary from
  sprawling.
- `index/` is generated, so it must never be hand-edited. CI fails if a committed index
  differs from a freshly built one.

## Alternatives

Options 1 and 2 above. Option 1 was rejected for lacking selectability, which is the whole
point of the exercise. Option 2 was rejected because cross-cutting entries have no home and
principles would be duplicated across domains.
