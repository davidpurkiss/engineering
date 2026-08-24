# Lifecycle

How an entry moves from thought to trusted, and how it dies.

## States

```
   idea ──► draft ──► stable ──┬──► deprecated
                               └──► superseded
```

**draft** — Written down so it stops taking up head space. Might be wrong. The body should
say what evidence is missing: "used once, on a small team, unclear how it scales".

**stable** — Applied more than once, survived contact with production, I'd defend it in a
design review. Promotion is a judgement call, not a ceremony: bump `status`, bump
`updated`, and make sure the "when it doesn't apply" section is real.

**deprecated** — Still accurate for its original context, but not what I'd reach for now.
Keep the entry: knowing why something *was* right is useful. Add a "why deprecated" note.

**superseded** — Replaced by a specific entry. The *replacement* declares
`supersedes: [old.id]`; the old entry sets `status: superseded` and links forward. Never
delete — links from outside the repo rot.

## RFCs specifically

An RFC is `draft` while it's being argued with. When it's resolved:

1. Write a `decision` recording what was chosen and the context.
2. Write or update the `pattern` / `practice` entries that describe how to actually do it.
3. Set the RFC to `superseded` and point at both.

The RFC keeps the reasoning and the alternatives that were rejected. The pattern keeps the
instructions. Don't try to make one file do both jobs — agents loading a pattern don't need
the argument, and people revisiting a decision don't want the how-to.

## Decisions specifically

ADRs are append-only. Once `stable`, the text doesn't change except for typos. Changed your
mind? New ADR, `supersedes` the old one, old one goes to `superseded`. The value of the
series is that it shows what you knew at the time.

## Review cadence

Every entry has `updated`. `index/INDEX.md` sorts by it, so staleness is visible without
extra bookkeeping.

Roughly twice a year, sweep the oldest entries and ask three questions:

- Is this still what I'd do? (If no → deprecate or supersede.)
- Is any `draft` now `stable`? (If yes → promote.)
- Does the "when it doesn't apply" section still hold?

Deleting is allowed for entries that were simply wrong and never referenced. Everything
else gets superseded rather than removed.
