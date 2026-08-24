---
id: rfc.0001-ai-observability
title: AI observability
type: rfc
status: draft
summary: Placeholder for a proposal on what to instrument, trace and evaluate in LLM-powered systems, and how it differs from conventional service observability.
domains: [ai, observability]
related: []
created: 2026-08-24
updated: 2026-08-24
---

> **Placeholder.** Reserved so the number is taken and the shape is visible. Not yet
> argued through.

## Summary

<!-- TODO -->

What to instrument in an LLM-powered system, and how that differs from a conventional
service. Conventional observability answers *is it up and how fast*. LLM systems also need
*is it any good*, which is neither a metric nor a log line.

## Motivation

<!-- TODO. Sketch of the problem space:
     - Non-determinism: the same input legitimately produces different output
     - Quality is the primary failure mode, and it is silent
     - Cost and latency are per-call variable and user-visible
     - Traces are multi-step and often multi-agent: the useful span is a whole trajectory
     - Prompts and models are deployable artefacts that need versioning
     - Feedback loops: production traffic as eval data, and the privacy question that opens
-->

## Proposal

<!-- TODO -->

## Alternatives considered

<!-- TODO -->

## Risks and unknowns

<!-- TODO -->

## Open questions

- What is the minimum useful instrumentation on day one?
- Which of this is standardised enough to adopt rather than build?
- Where does online evaluation stop and offline evaluation start?
- How much of a trace can be retained without becoming a data-protection problem?

## Resolution

<!-- On close: link the resulting decision and pattern entries, then set
     `status: superseded`. -->
