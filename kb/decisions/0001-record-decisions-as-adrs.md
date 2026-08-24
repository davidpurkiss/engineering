---
id: decision.0001-record-decisions-as-adrs
title: Record decisions as ADRs in this repository
type: decision
status: stable
summary: Architectural and KB-level decisions are recorded as numbered, append-only ADRs under kb/decisions/.
domains: [delivery, architecture]
created: 2026-08-24
updated: 2026-08-24
---

## Context

This knowledge base holds opinions that will change. Without a record, a reversal is
indistinguishable from an inconsistency: a reader — human or agent — finds the current
state and has no way to tell whether it was reasoned into or drifted into.

The reasoning behind a choice is also the first thing lost. Six months on, the constraint
that made the decision obvious is forgotten, and the decision looks arbitrary.

## Decision

Decisions of consequence are recorded as ADRs in `kb/decisions/`, numbered sequentially and
zero-padded (`0001-`, `0002-`). Each records the context *at the time*, what was chosen and
the consequences accepted.

ADRs are append-only. Once `status: stable`, the text does not change except for typos. A
change of mind is a new ADR that declares `supersedes: [decision.NNNN-old]`, and the old
entry moves to `status: superseded`.

Scope: architectural choices with lasting consequences, and structural decisions about the
KB itself. Not routine implementation choices — those belong in a pattern or nowhere.

## Consequences

- Every reversal is visible as a pair of entries, which is the point.
- Superseded entries stay in the repo. `index/INDEX.md` will accumulate history; the
  generated indexes group by status so current entries stay easy to find.
- There is a small cost per decision. That cost is the filter — if an ADR feels like too
  much ceremony for the choice, the choice probably isn't ADR-worthy.
- Agents working in this repo must not edit existing ADRs. This is stated in `AGENTS.md`.

## Alternatives

- **A changelog.** Records what changed, not why. The reasoning is the valuable half.
- **Git history alone.** Commit messages are the right length for a diff and the wrong
  length for a rationale, and they are not addressable — nothing can link to them by id.
- **Decisions inline in the relevant pattern.** Mixes the argument with the instructions;
  agents loading a pattern would carry the debate as noise.
