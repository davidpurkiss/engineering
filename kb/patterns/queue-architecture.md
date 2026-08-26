---
id: pattern.queue-architecture
title: Queue architecture
type: pattern
status: draft
summary: Move work out of the request into a broker, split three ways so delivery semantics, business logic and infrastructure policy each have exactly one owner.
domains: [backend, messaging, platform]
stack: [typescript, bullmq, postgres]
applies_when: Work must happen outside the request, may need retrying, and must survive the process that scheduled it.
spec: architecture.queue-architecture
related: [principle.optimise-for-deletion, rfc.0002-machine-readable-specs]
created: 2026-08-25
updated: 2026-08-25
---

> **Draft.** The layer boundaries are settled and enforced; the operational judgement below
> is written from experience but has not been reviewed against a second opinion.

## Problem

Work that does not belong in the request — sending the email, regenerating the export,
calling the flaky third party — gets done in the request anyway, because that is where the
code already is. The request gets slower, and a failure in the incidental work fails the
thing the user actually asked for. Move it to a background thread instead and it dies with
the process.

## Context

The distinguishing requirement is **durability across process death**, not asynchrony. If
losing the work on deploy is acceptable, you do not need a broker; you need a promise you
forgot to await. Reach for this when the work must survive a restart, and when retrying it
is meaningful rather than merely repeated.

## Solution

Three layers, each owning one thing: a **consumer** that owns delivery semantics, a **job
handler** that owns the work, and a **queue manager** that owns infrastructure and policy.

The full layer definitions — responsibilities, restrictions and the import boundaries
between them — are in [`specs/architectures/queue-architecture.json`](../../specs/architectures/queue-architecture.json)
and the layer specs it composes. They are not repeated here; they are enforced by
`npm run validate:specs` and, in a consuming project, by the generated import checks.

What is worth saying in prose is *why* the boundaries fall where they do:

- **The handler does not acknowledge.** One place decides whether a message is done. Let the
  handler ack and you have two components with an opinion about the same message, which is
  how a job gets marked complete and half-done at once.
- **The handler does not know the broker.** This is what lets the same work be unit-tested
  with a plain object, and what makes swapping brokers a queue-manager change instead of a
  rewrite. It is also the boundary that erodes first, usually via a "just this once" import
  to read the retry count.
- **Retry policy lives in one place.** A handler that implements its own retry is invisible
  to the broker's accounting: attempts do not increment, the dead-letter threshold never
  trips, and the failure never appears in queue metrics. It looks like slowness.

## Implementation notes

- **Idempotency is not optional.** Every mainstream broker is at-least-once. Derive the
  idempotency key from the payload, never from the delivery, and check-and-set before the
  side effect rather than after.
- **Validate at the edge.** A malformed payload is a poison message. Retrying it five times
  before dead-lettering achieves nothing except delay.
- **Bound concurrency deliberately.** The right number is a property of the slowest thing
  downstream. The client default knows nothing about your database connection pool.
- **Drain on shutdown.** Stop intake, wait for in-flight work within a timeout, then close. A
  consumer killed mid-message must leave that message unacknowledged so it redelivers.

## Trade-offs

You are trading a synchronous failure for an asynchronous one. The synchronous version told
someone immediately; the asynchronous version files it somewhere you have to go and look. If
nobody has built the looking, you have not removed the failure, only the notification.

The other costs are operational and permanent: a broker to run and upgrade, a dead-letter
queue someone must drain, dashboards that need to exist before the first incident, and a
debugging story where the stack trace no longer spans the whole causal chain. Correlation
ids stop being nice-to-have at the moment you add the queue.

## Failure modes

- **The dead-letter queue nobody drains.** The most common one by a distance. Work fails,
  lands in the DLQ, and is discovered weeks later by someone looking for something else.
  Alert on DLQ depth greater than zero from day one, not on a threshold.
- **Retry amplification.** A downstream dependency degrades, every in-flight job retries with
  the same backoff, and the retries become the load keeping it down. Exponential backoff with
  jitter, and a circuit breaker if the dependency is shared.
- **Double side effects.** A non-idempotent handler plus a redelivery equals two charges, two
  emails, two rows. This surfaces as a customer complaint, not an alert.
- **The queue as a missing interface.** Two services that should have agreed on a contract
  pass messages instead, and the payload shape becomes an undocumented API that both sides
  change independently.
- **Unbounded depth.** No backpressure, producer outruns consumer, and depth grows until the
  broker degrades. Depth without consumer lag will not tell you this is happening.
- **Assumed ordering.** Almost nothing guarantees it once concurrency is above one, and the
  assumption is usually implicit — discovered when two events for the same entity land out of
  order under load.

## Alternatives

- **Do it synchronously.** Frequently the right answer, and the one skipped fastest. If the
  work takes 40ms and fails loudly, a queue adds infrastructure to solve nothing.
- **Transactional outbox.** When the event must be published *if and only if* a database
  write commits. A queue alone cannot give you that; publishing after commit can lose the
  event, publishing before can emit one for a transaction that rolls back.
- **A job table in the database you already have.** If you run Postgres and the volume is
  modest, a job table with `SELECT ... FOR UPDATE SKIP LOCKED` avoids operating a second
  piece of infrastructure and gives you transactional enqueue for free. Fewer moving parts
  beats better queue semantics more often than it seems at the time.
- **A durable execution engine.** When the work is a multi-step workflow with state between
  steps, compensation and long waits, a queue makes you rebuild an orchestrator badly. Reach
  for the engine.
- **Scheduled batch.** If the work is periodic rather than event-driven, a schedule is
  simpler and easier to reason about than a queue plus a scheduler.

## When it doesn't apply

Strict global ordering, sub-millisecond latency budgets, and work that is only meaningful
inside the request that created it. Also: any system small enough that the broker becomes the
most complicated thing in it.

## Sources
