---
id: pattern.controller-service-repository
title: Controller / service / repository
type: pattern
status: draft
summary: Three-layer split for request-driven services — transport in the controller, business rules in the service, data access in the repository.
domains: [backend, architecture]
stack: [typescript, express, fastify]
applies_when: You are building a request-driven HTTP or RPC service and want business logic testable without transport or a database.
related: [principle.optimise-for-deletion]
created: 2026-08-24
updated: 2026-08-24
---

> **Migration stub.** The full specification for this pattern lives in
> [evius/architecture-spec](https://github.com/evius/architecture-spec) under
> `specs/controller-service-repository` and is being ported into this entry. Until that's
> done, treat the old repo as the source of truth for the detail.

## Problem

Request-driven services accumulate business logic in whichever layer the author touched
first. It ends up in route handlers (untestable without HTTP), or in ORM models (untestable
without a database), or spread across both. Every test then needs the whole stack, and the
rules themselves are impossible to read in one place.

## Context

Reach for this when the service is genuinely request-driven and the domain logic is worth
isolating. Not every service is: a thin CRUD proxy over one table gains nothing from three
layers, and an event-processing worker wants a different shape.

## Solution

<!-- TODO: port the layer definitions, minimal templates and explicit rules from
     architecture-spec. Include the mermaid diagram of the call direction. -->

Three layers, dependencies pointing one way only:

- **Controller** — transport concerns. Parse and validate input, map domain errors to
  status codes, serialise output. Knows about HTTP; knows nothing about SQL.
- **Service** — the business rules. Pure of transport and persistence detail; takes and
  returns domain types. This is the layer worth unit-testing.
- **Repository** — data access. Owns queries and the mapping between rows and domain types.
  Knows about the database; knows nothing about HTTP.

## Implementation notes

<!-- TODO: port. Cover transaction boundaries (they belong at the service layer),
     dependency injection approach, and where DTO-to-domain mapping lives. -->

## Trade-offs

<!-- TODO: port. -->

## Failure modes

- **Anaemic services.** Controllers do the orchestration and services become one-line
  pass-throughs to repositories. The split is then pure ceremony.
- **Leaking ORM entities upward.** The moment a database row type appears in a controller
  signature, the layering is decorative.
- **Repository-per-table.** Repositories should serve the aggregate the service reasons
  about, not mirror the schema.

## Alternatives

- **Clean / hexagonal architecture** — more ports and adapters, worth it when there are
  several transports or the domain is genuinely complex.
- **Vertical slice / feature folders** — organise by use case rather than layer; often a
  better fit once a service has many loosely-related endpoints.
- **Nothing at all** — a handler that does the work is correct for a small, stable service.

## Sources

- https://github.com/evius/architecture-spec
