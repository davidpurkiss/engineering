---
id: rfc.0003-spec-derived-invariants
title: Spec-derived runtime invariants
type: rfc
status: draft
summary: Turn the sentence a spec already contains into a continuously asserted runtime check, so a handoff between systems cannot fail silently while every component reports success.
domains: [architecture, observability, delivery]
stack: [postgres, otel]
related: [rfc.0002-machine-readable-specs, rfc.0001-ai-observability, pattern.queue-architecture, practice.writing-for-agents]
created: 2026-08-27
updated: 2026-08-27
---

## Summary

`rfc.0002-machine-readable-specs` makes constraints enforceable at build time: a layer
boundary in a spec becomes an import check that fails CI. That covers structure.

It does nothing about behaviour. A system can satisfy every structural rule and still stop
doing the thing it was built to do, and the most common way that happens is at a handoff to
a system nobody in the room owns.

This proposes a second kind of enforceable constraint: an **invariant** — a statement of
what must remain true about the system in production, authored in the spec as a sentence,
and compiled into a check that runs continuously against real data.

## Motivation

### The failure this addresses

A booking system takes registrations, charges through Stripe, and enrols the student on
payment. It ran for weeks in a state where registered, paid students were never enrolled.

The webhook endpoint had begun returning a 308. A redirect, not an error. Stripe treats a
3xx as a failed delivery, so it retried, gave up, and emailed — to the person who runs the
classes, who has no reason to know what a webhook delivery failure is or that it was hers to
act on. The application heard nothing, because from its perspective nothing had happened.

Three properties make this class of failure worth naming:

1. **Every component reported success.** Registration worked. Payment worked. Enrolment
   worked. Per-service telemetry was clean because no single service held the invariant —
   the truth lived in the join between them, and nothing owned the join.
2. **The signal existed and was useless.** It was emitted by a system we do not own, in
   vocabulary the recipient had no reason to parse, to someone with no ability to act. An
   alert that reaches the wrong person in the wrong language is not observability.
3. **The failure was not in the code.** No line was wrong. The gap was between what the
   system was for and what anything checked.

This is the same shape as the first failure mode listed in `pattern.queue-architecture` —
the dead-letter queue nobody drains. Work fails, the failure is recorded somewhere, and it
is discovered weeks later by someone looking for something else. That entry treats it as a
queue-specific hazard. It isn't; it is the general shape of a handoff with no owner.

### Why now

Nothing here is new, and it would be dishonest to present it as an AI problem. That
integration could have been hand-written and failed identically.

What changes with agent-assisted work is the economics of not having the check. Writing a
thing yourself builds a model of it as you go, and somewhere in that model sits the thought
*what happens if the webhook stops arriving*. Receiving working code builds no such model,
so the thought never occurs and the absence is invisible — there is no artefact recording
that nobody asked.

The 2025 DORA research is consistent with this: AI adoption improved throughput while
**delivery instability continued to rise**, with friction moving from writing code to
"deciding and verifying... assessing code that looks remarkably similar to correct code."
Code that looks correct is exactly the code whose unasked questions go unnoticed.

So: the practice is old and good; the case for making it a first-class artefact rather than
a thing senior engineers happen to remember is stronger than it was.

### What the industry currently covers

Worth being precise, because the gap is narrower than it first appears.

- **LLM application observability** — well served, and moving fast: OpenTelemetry GenAI
  semantic conventions, trajectory-level tracing, evals against production traffic. This is
  the subject of `rfc.0001-ai-observability` and is *not* what this RFC is about.
- **AI code provenance** — line-level attribution of which agent and model produced which
  code, surviving rebases, feeding "percent of shipped code that is AI-generated" and
  "incidents traceable to a session". Genuinely new, and answers *where did this come from*,
  not *is it doing the job*.
- **Assistant metrics** — acceptance rate, tokens, time saved. Measures the tool.
- **Data quality assertions** — dbt tests, Great Expectations. The right idea, in the wrong
  place: they run over the warehouse, typically hours behind, downstream of the system that
  should have caught it. The vocabulary is worth stealing.
- **Integration and process-level monitoring** — exists as a discipline, mostly as vendor
  features in iPaaS products, and mostly not something an application team authors.
- **Data driven engineering** — the closest prior art, and it is not new. At Skyscanner we
  built the metrics into the feature as part of shipping it: a change was not done until
  you could see whether it had done what you said it would. The practice works, has a name,
  and predates any of this. What it lacks is an artefact — it lived as a cultural
  expectation, which is precisely the kind of thing that survives only while the people who
  remember it are still in the room.

So the practice is established; what is missing is the artefact. Nothing here derives the
assertion **from the specification, at the time the specification is written**, and treats
it as a deliverable that can be reviewed, validated and handed to an agent alongside the
code. That gap is what this RFC addresses — not the idea, which is old, but its
durability.

## Proposal

### The core move

The requirement and the metric are the same sentence.

> A registered student who has paid is enrolled.

That is the spec. It is also, unchanged, the check: count registrations, count payments,
count enrolments, and alert when they stop agreeing. Nobody writes it down because at
spec-writing time it is too obvious to say, and by the time it is not obvious you are reading
a third party's dashboard at eleven at night.

### Shape

A new spec kind, `specs/invariants/<id>.json`, with a schema alongside the existing three:

```json
{
  "id": "paid-registrations-are-enrolled",
  "statement": "A registered student who has paid is enrolled",
  "severity": "error",
  "settles_within": "PT15M",
  "terms": {
    "paid_registrations": "count of registrations with a settled payment",
    "enrolments": "count of enrolments"
  },
  "relation": { "kind": "equality", "left": "paid_registrations", "right": "enrolments" },
  "tolerance": { "absolute": 0 },
  "owner": "the engineer, not the operator",
  "trigger": "handoff:stripe-webhook"
}
```

Four fields carry the design:

- **`statement`** is used verbatim in the alert. The alert says "a registered student who has
  paid is not enrolled", not "reconciliation_delta > 0". This is the fix for the signal being
  unreadable to whoever receives it.
- **`settles_within`** is the part that is easy to get wrong. The invariant is *eventually*
  true, not instantaneously true; without a settling window it fires on every in-flight
  checkout and is muted within a day.
- **`owner`** is explicit because the failure above was an ownership failure as much as a
  telemetry one. An invariant with no named owner who can act is not implemented.
- **`trigger`** records why the invariant exists. The generalisable rule is: **any handoff to
  a system you do not own**, especially one you cannot fully test because the sandbox never
  reproduces the failure you actually get.

### Execution

Unlike `check-boundaries`, this cannot run in CI — it needs production data. The proposal is
to **emit a query and a threshold**, not to ship a runtime: a SQL statement, or a PromQL
expression, that a team schedules with whatever they already run. The KB's job is to make
the invariant explicit and machine-readable; running it belongs to the system that owns the
data.

### The latent skill

`invariant-review`: given a spec or a design, find every handoff to a system outside the
blast radius of your own tests, and for each one require three answers — what is the counting
invariant, where is it asserted, and who is told when it breaks. Refuse to accept "the
provider will alert us" as an answer to the third.

This is the runtime sibling of `architecture-review`, and it should run at design time, not
at incident time.

## Alternatives considered

**More telemetry and a dashboard.** Rejected. The signal in the motivating case already
existed; nobody was looking at it. Dashboards require a watcher, and the failure mode of a
watcher is that they stop watching precisely when nothing has gone wrong for a while.

**Rely on the third party's own alerting.** Rejected. Wrong system, wrong vocabulary, wrong
recipient. It is also outside your control: a provider can change what it alerts on, or where
it sends it, without telling you.

**Contract and integration tests.** Necessary, not sufficient. They run at build time against
an environment that by construction did not reproduce this failure — no Stripe sandbox
produces a 308 caused by a redirect rule in your own infrastructure. Tests assert what you
thought of; invariants assert what remains true.

**Synthetic transactions / end-to-end canaries.** The strongest alternative, and it must be
said plainly: a synthetic booking running every fifteen minutes **would have caught this
one**. Its limits are cost (a real charge per run, or a test-mode path that diverges from the
real one), coverage (one canary per flow, hand-maintained), and blindness to
population-level drift — a canary passing tells you the happy path worked for the canary, not
that ninety-six percent of real students got through. The two are complementary, and a
serious version of this RFC should recommend both rather than pretend the invariant subsumes
the canary.

**Data-quality tooling over the warehouse.** Right vocabulary, wrong latency and wrong layer.
Useful as a second net; not a substitute for asserting close to the transaction.

**Do nothing; this is just good engineering.** The honest objection, and largely correct —
see data driven engineering above. The counter is empirical rather than theoretical: the
practice already existed, was known to work, had a name, and still did not survive contact
with a small side project built by someone who had done it professionally for years.
Practices that live only as cultural expectation degrade when the culture is not present,
and an agent is never present for the culture. Making it a file is the difference between
something a team remembers and something a repository enforces.

## Risks and unknowns

- **Alert fatigue is the likely killer.** An invariant without a correct settling window, or
  over a low-volume system where a single in-flight record trips it, gets muted. Muted
  invariants are worse than absent ones because they look like coverage.
- **The counting query becomes a second source of truth** and can itself drift from the
  system it measures — the classic failure of reconciliation code that silently counts the
  wrong thing after a schema change.
- **Scope creep into a monitoring product.** The moment this ships a scheduler, a state store
  and a notifier, it is a product with an on-call rota. Emitting a query is the boundary that
  keeps it a knowledge base.
- **Production data access is a much larger commitment than a lint rule.** A KB that emits
  SQL to run against someone's production database is asking for more trust than one that
  emits an import rule, and should be honest about that in how it is packaged.
- **Low-volume systems may not support statistical framing at all.** With four enrolments a
  week, "counts agree" is the only usable form; ratios and tolerances are noise.

## Open questions

- Is this a new spec kind, or a new `check` kind on an existing rule? A rule's `check` is
  build-time by construction today; runtime assertions may not belong in the same field.
- What is the portable expression format for the counts — SQL, PromQL, both, or an abstract
  form with per-backend emitters? An abstract form is where this gets expensive.
- Should `settles_within` be authored or derived from observed latency?
- Does this belong in this knowledge base at all? Everything else here is repo-time. This is
  the first artefact whose value is realised in production, and that may be a different
  project rather than a fourth spec kind.
- Naming. *Invariant* is precise and slightly academic; *reconciliation* is the term finance
  and data teams already use and carries the right connotation of counting two things and
  comparing; *outcome assertion* is clearer to a non-specialist; *data driven engineering*
  is the name the practice already has, though it describes the habit rather than the
  artefact. Reusing an existing name buys recognition and inherits its vagueness. Pick one
  before there are files named after it.
- Is the trigger list larger than "handoffs you do not own"? Candidates: anything with an
  eventual-consistency window, anything where a human is the transport, anything whose
  failure mode is a missing record rather than a bad one.

## Resolution

<!-- On close: link the resulting decision and pattern entries, then set
     `status: superseded`. -->
