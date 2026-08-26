---
id: pattern.SLUG
title: Title in sentence case
type: pattern
status: draft
summary: One sentence, max 200 chars. What problem this solves, stated so it's useful out of context.
domains: [backend]
stack: []
applies_when: The trigger condition in one line. This is what an agent matches a task against.
spec: # optional — architecture.<id> if a machine-readable spec backs this entry. Delete if not.
related: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

## Problem

<!-- The recurring situation. Be specific about what breaks. -->

## Context

<!-- Preconditions: scale, team shape, existing infrastructure. When is this the pattern
     you'd reach for rather than something simpler? -->

## Solution

<!-- The shape. A diagram (mermaid) earns its place when the interaction order or the
     failure boundary is the point. Otherwise prose plus a minimal snippet.

     If this entry has a `spec:`, do NOT restate the layer boundaries here — link to the
     spec and explain why the boundaries fall where they do. Copying a `restrictions`
     list into prose guarantees the two will drift. -->

## Implementation notes

<!-- The parts that bite. Ordering, idempotency, migrations, config, the library that
     nearly does this but doesn't. -->

## Trade-offs

<!-- What you give up. Latency, operational surface, cognitive load, lock-in. -->

## Failure modes

<!-- REQUIRED. How this goes wrong in production, and the signal you'd see first. -->

## Alternatives

<!-- The other shapes that solve the same problem, and the condition under which each
     one wins instead. -->

## Sources
