---
id: rfc.0003-spec-derived-invariants
title: Spec-derived runtime invariants
type: rfc
status: draft
summary: Extract the assertion a requirement already contains into a continuously checked runtime invariant, so a handoff between systems cannot fail silently while every component reports success.
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
what must remain true in production, **extracted** from a requirement that already states it,
and compiled into a check that runs continuously against real data.

The emphasis is on *extracted*, not authored. The requirement almost always exists already,
in the sentence someone used to describe what they wanted. The work is reading it as an
assertion rather than a description, and that work is mechanical.

## Motivation

### The failure this addresses

A booking system takes registrations, charges through Stripe, and enrols the student on
payment. It ran for weeks in a state where registered, paid students were never enrolled.

The webhook endpoint began returning a 308. A redirect, not an error. Stripe treats a 3xx as
a failed delivery, so it retried, gave up, and emailed — to the person who runs the classes,
who has no reason to know what a webhook delivery failure is or that it was hers to act on.
The application heard nothing, because from its perspective nothing had happened.

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

### Why it gets skipped, and what changed

It would be convenient to blame agent-assisted development, and dishonest. That integration
could have been hand-written and failed identically, and the check would have been skipped
either way — not through ignorance, but because wiring up counts and an alert costs
something, and that cost is weighed against the felt risk of not having it. On a small
system the assertion loses that trade. On a large one it usually loses too; it just loses to
a different set of priorities.

**Cost is the barrier. It always was.** Not knowledge — every engineer who has run an
integration knows the counts should agree. The practice is old enough to have a name (see
below). It gets skipped because at requirement-writing time the assertion feels too obvious
to bother stating, and by the time it is not obvious you are reading a third party's
dashboard at eleven at night.

What changed is that the cost collapsed, for two reasons.

**The requirement is already written.** Describing what you want is not an extra step when
you build with an agent — it is the interface. "Students register, pay, and get enrolled" is
a description; read as an assertion it is "a registered student who has paid is enrolled".
Same sentence. Nothing new had to be authored.

**Turning that sentence into counts is mechanical.** Read the description, find the handoff,
name the invariant, emit the counts and a threshold. That is text-to-structure work with a
clear success criterion, which is close to the centre of what current models are reliably
good at. The step that used to cost an afternoon costs a prompt.

The 2025 DORA research supports the direction if not the specific claim: AI adoption improved
throughput while delivery instability continued to rise, with friction moving from writing
code to "deciding and verifying". If verification is where the effort now goes, making
verification cheap is where the leverage is.

So the argument is not that agents caused this problem. It is that agents removed the excuse.

### What the industry currently covers

Worth being precise, because the gap is narrower than it first appears.

- **LLM application observability** — well served and moving fast: OpenTelemetry GenAI
  semantic conventions, trajectory-level tracing, evals against production traffic. This is
  the subject of `rfc.0001-ai-observability` and is *not* what this RFC is about.
- **AI code provenance** — line-level attribution of which agent and model produced which
  code. Answers *where did this come from*, not *is it doing the job*.
- **Assistant metrics** — acceptance rate, tokens, time saved. Measures the tool.
- **Data quality assertions** — dbt tests, Great Expectations. The right idea in the wrong
  place: they run over the warehouse, hours behind, downstream of the system that should have
  caught it. The vocabulary is worth stealing.
- **Data driven engineering** — the closest prior art, and not new. At Skyscanner we built
  metrics into the feature as part of shipping it: a change was not done until you could see
  whether it had done what you said it would. The practice works and has a name. What it
  lacked was a cheap path from requirement to check, which is why it survived as a cultural
  expectation rather than an artefact — and cultural expectations are not present when an
  agent is doing the work.

Nothing above derives the assertion **from the requirement, mechanically, at the moment the
requirement is stated**. That is the gap: not the idea, which is old, but the extraction.

## Proposal

### The core move

The requirement and the metric are the same sentence.

> A registered student who has paid is enrolled.

That is the requirement. Unchanged, it is the check: count registrations, count payments,
count enrolments, alert when they stop agreeing.

So the primary artefact is not a file a human writes. It is an **extraction step**: given a
description of what the system should do, produce the invariants it implies. The file is the
output.

### Extraction

Input: whatever states the intent — a ticket, a design note, a README, the prompt used to
brief an agent. Output: zero or more invariant specs, each proposed for confirmation.

The extractor looks for handoffs. The generalisable trigger is **any handoff to a system you
do not own**, especially one you cannot fully test because the sandbox never reproduces the
failure you actually get. At each handoff it asks three questions, and refuses "the provider
will alert us" as an answer to the third:

1. What is the counting invariant?
2. Where is it asserted?
3. Who is told when it breaks?

This is `invariant-review`, the runtime sibling of `architecture-review`. It runs at design
time, not at incident time, and it should be proactive: an agent building an integration
ought to propose the invariant without being asked, in the way it now proposes tests.

### Shape of the output

A new spec kind, `specs/invariants/<id>.json`, alongside the existing three:

```json
{
  "id": "paid-registrations-are-enrolled",
  "statement": "A registered student who has paid is enrolled",
  "derived_from": "students register, pay, and get enrolled",
  "severity": "error",
  "settles_within": "PT15M",
  "relation": { "kind": "equality", "left": "paid_registrations", "right": "enrolments" },
  "tolerance": { "absolute": 0 },
  "owner": "the engineer, not the operator",
  "trigger": "handoff:stripe-webhook",
  "confirmed_by": "human"
}
```

Fields carrying the design:

- **`statement`** is used verbatim in the alert. The alert says "a registered student who has
  paid is not enrolled", not "reconciliation_delta > 0". This is the fix for the signal being
  unreadable to whoever receives it.
- **`derived_from`** records the source sentence, so the invariant can be re-checked against
  the intent it came from when either changes.
- **`settles_within`** is easy to get wrong. The invariant is *eventually* true; without a
  settling window it fires on every in-flight checkout and is muted within a day.
- **`owner`** is explicit because the motivating failure was an ownership failure as much as
  a telemetry one.
- **`confirmed_by`** exists because an extracted invariant is a proposal until a human agrees
  it is the right one. See the risks.

### Execution

Unlike `check-boundaries`, this cannot run in CI — it needs production data. The proposal is
to **emit a query and a threshold**, not to ship a runtime: SQL, or a PromQL expression, that
a team schedules with whatever they already run. The KB's job is to make the invariant
explicit and machine-readable; running it belongs to the system that owns the data.

## Alternatives considered

**More telemetry and a dashboard.** Rejected. The signal in the motivating case already
existed; nobody was looking at it. Dashboards need a watcher, and watchers stop watching
precisely when nothing has gone wrong for a while.

**Rely on the third party's own alerting.** Rejected. Wrong system, wrong vocabulary, wrong
recipient, and outside your control.

**Contract and integration tests.** Necessary, not sufficient. They run at build time against
an environment that by construction did not reproduce this failure — no Stripe sandbox
produces a 308 caused by a redirect rule in your own infrastructure. Tests assert what you
thought of; invariants assert what remains true.

**Synthetic transactions / end-to-end canaries.** The strongest alternative, and it must be
said plainly: a synthetic booking every fifteen minutes **would have caught this one**. Its
limits are cost (a real charge per run, or a test-mode path that diverges from the real one),
coverage (one canary per flow, hand-maintained), and blindness to population-level drift — a
passing canary tells you the happy path worked for the canary, not that ninety-six percent of
real students got through. Complementary; a serious version of this recommends both.

**Hand-author the invariants; skip extraction.** This is the version that already exists and
already fails. Requiring a human to write the assertion puts the cost back exactly where it
was, and the cost is the reason the practice does not survive contact with a deadline or a
side project.

**Do nothing; this is just good engineering.** The honest objection, and largely correct.
The counter is that the practice was known, named and demonstrably effective, and still got
skipped — including by me, on my own system, having done it professionally for years. When a
good practice is skipped consistently, the useful question is what it costs, not whether
people know about it. This RFC is an attempt to change the cost rather than repeat the
advice.

## Risks and unknowns

- **Extraction produces plausible wrong invariants.** This is the risk the rest of the design
  hangs off. An agent that confidently derives "every registration has a payment" from a
  system with free trials has invented a false alarm, and false alarms are how invariants get
  muted. Extraction proposes; a human confirms. `confirmed_by` exists so an unconfirmed
  invariant can be treated as a draft rather than a check.
- **Alert fatigue is the likely killer.** An invariant without a correct settling window, or
  over a low-volume system where one in-flight record trips it, gets muted. Muted invariants
  are worse than absent ones because they look like coverage.
- **The counting query becomes a second source of truth** and can itself drift — the classic
  failure of reconciliation code that silently counts the wrong thing after a schema change.
- **Scope creep into a monitoring product.** The moment this ships a scheduler, a state store
  and a notifier, it is a product with an on-call rota. Emitting a query is the boundary that
  keeps it a knowledge base.
- **Production data access is a much larger commitment than a lint rule.** A KB that emits
  SQL to run against someone's production database asks for more trust than one that emits an
  import rule, and should be honest about that in how it is packaged.
- **Low-volume systems may not support statistical framing at all.** With four enrolments a
  week, "counts agree" is the only usable form; ratios and tolerances are noise.

## Open questions

- **How do you validate an extracted invariant is the right one?** Confirmation by a human is
  the fallback, not an answer. Is there a cheaper check — replaying it against historical
  data to see whether it would have been true, for instance?
- Is this a new spec kind, or a new `check` kind on an existing rule? A rule's `check` is
  build-time by construction today.
- What is the portable expression format for the counts — SQL, PromQL, both, or an abstract
  form with per-backend emitters? An abstract form is where this gets expensive.
- Should `settles_within` be authored or derived from observed latency?
- Does this belong in this knowledge base at all? Everything else here is repo-time. This is
  the first artefact whose value is realised in production.
- Naming. *Invariant* is precise and slightly academic; *reconciliation* is what finance and
  data teams already say; *data driven engineering* is the name the practice has, though it
  describes the habit rather than the artefact. Reusing an existing name buys recognition and
  inherits its vagueness.

## Resolution

<!-- On close: link the resulting decision and pattern entries, then set
     `status: superseded`. -->
