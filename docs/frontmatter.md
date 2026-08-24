# Frontmatter schema

Every file under `kb/` (except `_`-prefixed ones) starts with a YAML block. It is the
machine-readable half of the KB: validation, indexing and skill-driven retrieval all run
off it.

```yaml
---
id: pattern.transactional-outbox
title: Transactional Outbox
type: pattern
status: draft
summary: Publish an event and commit a database write atomically by staging the event in the same transaction.
domains: [backend, data, messaging]
stack: [postgres, typescript]
applies_when: You must not lose an event when the process dies between commit and publish.
related: [principle.design-for-partial-failure]
supersedes: []
created: 2026-08-24
updated: 2026-08-24
---
```

## Fields

| Field | Required | Type | Notes |
|---|---|---|---|
| `id` | yes | string | Must equal `<type>.<filename-without-.md>`. Stable forever — it's how entries reference each other. |
| `title` | yes | string | Human title. Sentence case. |
| `type` | yes | enum | `principle` \| `pattern` \| `practice` \| `rfc` \| `decision`. Must match the folder. |
| `status` | yes | enum | `draft` \| `stable` \| `deprecated` \| `superseded`. See [lifecycle.md](lifecycle.md). |
| `summary` | yes | string | One sentence, ≤ 200 chars, no trailing full stop needed. Used **verbatim** in generated indexes and by the lookup skill — write it so it's useful out of context. |
| `domains` | yes | list | One or more from the vocabulary below. |
| `created` | yes | date | `YYYY-MM-DD`. |
| `updated` | yes | date | `YYYY-MM-DD`. Bump on any substantive edit. |
| `stack` | no | list | Concrete technologies, lowercase. Free-form but keep it consistent. |
| `applies_when` | no | string | The trigger condition, in one line. Strongly recommended for patterns — it's what an agent matches against. |
| `related` | no | list | Other entry `id`s. Validated: must resolve. |
| `supersedes` | no | list | Entry `id`s this replaces. The superseded entry should be set to `superseded`. |
| `sources` | no | list | URLs backing the entry. |

## Vocabulary: `domains`

```
architecture   backend        frontend       data
messaging      platform       observability  security
testing        delivery       ai             agentic
people
```

`ai` = building AI-powered systems. `agentic` = working *with* coding agents.
`people` = teams, hiring, communication.

To add a domain: edit `VOCAB.domains` in `scripts/validate.mjs` and note it here. Doing it
in one commit keeps the vocabulary honest.

## Vocabulary: `status`

```
draft        Written down, not yet battle-tested. Say so in the body.
stable       Used more than once, in production, would defend it.
deprecated   Still true in context, but don't reach for it on new work.
superseded   Replaced. Must point at the replacement via the new entry's `supersedes`.
```

## Parser note

`scripts/validate.mjs` uses a deliberately small YAML subset — scalars, quoted strings,
inline `[a, b]` arrays and `- item` block lists. No nesting, no anchors, no multi-line
scalars. That keeps the repo dependency-free. If you need richer YAML, you probably need a
simpler frontmatter instead.
