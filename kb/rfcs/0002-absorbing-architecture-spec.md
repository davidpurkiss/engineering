---
id: rfc.0002-absorbing-architecture-spec
title: Absorbing architecture-spec as machine-readable assets
type: rfc
status: draft
summary: Port architecture-spec's schema into JSON-Schema-validated specs and real template files, with a generated manifest and executable boundary checks.
domains: [architecture, agentic, delivery]
stack: [typescript, json-schema]
related: [pattern.controller-service-repository, practice.writing-for-agents, decision.0002-kb-structure]
created: 2026-08-25
updated: 2026-08-25
---

## Summary

[evius/architecture-spec](https://github.com/evius/architecture-spec) contains a typed
model for describing an architecture as machine-readable constraint: composable layer
definitions with explicit `restrictions` and `cannotImport`, architectures that compose
those layers, addressable rules with severities, and code templates keyed by layer,
framework and ORM.

This proposes absorbing that model into this KB as a second tier of content — structured
specs and real template files alongside the prose entries — and adding the consumption and
validation loop whose absence is why the original went stale.

The framing: a knowledge base of engineering experience should hold **artefacts**, not only
documents. A layer boundary you can lint is worth more than a paragraph describing it.

## Motivation

### What the old repo actually contains

An audit on 2026-08-25 (last upstream commit 2025-06-26) found:

- **11 dangling paths in `manifest.json`** — `queue-manager/templates/bullmq.ts`,
  `service/templates/functional.ts`, `controller/templates/fastify.ts`,
  `styles/typescript/configs/.eslintrc.airbnb.json` and seven others.
- **The content those paths promise is not missing.** It is embedded as 12 template string
  literals inside `src/architectures/queue-architecture.ts` (1,257 lines), plus 5 more in
  `controller-service-repository.ts`. The manifest describes the intended shape; the files
  describe the shape as it actually is.
- **A half-finished refactor.** `queue-architecture.ts` imports `consumerLayer`,
  `queueManagerLayer` and `jobHandlerLayer` and composes them. The earlier
  `controller-service-repository.ts` re-declares its three layers inline. The "architectures
  compose layers rather than redefining them" rule in `specs/main.md` was implemented in the
  second file written and never backported to the first.
- **44 of 79 files are committed build output** (`.js`, `.d.ts`, `.map`).

So the repo is not stale in the sense of *wrong*. It is stale in the sense of *stopped
mid-move*, with a registry that documents the destination rather than the current position.

### What is worth keeping

Not the two architectures — those are content and can be rewritten. The **model** in
`src/types/architecture.ts` is the asset, and three decisions in it are load-bearing:

1. **Negative space is first-class.** `restrictions` and `dependencies.cannotImport` sit
   alongside responsibilities. This matters more for agents than for people: an agent given
   only positive guidance applies it everywhere, and the boundary is what stops it.
2. **Layers are reusable units that architectures compose.** Templates are keyed by
   (layer × framework × data-access), so adding Fastify does not fork the architecture.
3. **Rules are addressable.** `id`, `layer`, `severity`, `category` — a rule you can cite
   in a review finding, not a paragraph you have to paraphrase.

That took real thought and would have to be re-derived from scratch. The content around it
would not.

### Why it went stale

Nothing consumed it and nothing checked it. No CLI, no plugin, no generator, no validator.
A repository with no reader gets no feedback signal, and a hand-maintained manifest with no
validation drifts silently — which is exactly what the 11 dangling paths are. A five-line
existence check would have failed on the day they were written.

This is the part that must not be repeated. Absorbing the content as prose entries would
reproduce the same failure in a tidier format.

## Proposal

### Three tiers

```
kb/          prose      — judgement: when to use it, trade-offs, failure modes
specs/       JSON       — constraints: layers, architectures, rules, styles
templates/   .tmpl      — code: real source files with placeholders
```

```
specs/
  schema/            JSON Schema per spec kind (the ported TypeScript types)
    layer.schema.json  architecture.schema.json  ruleset.schema.json  stack.schema.json
  layers/            controller.json  service.json  repository.json
                     consumer.json  queue-manager.json  job-handler.json
  architectures/     controller-service-repository.json  queue-architecture.json
  rules/             shared.json
  styles/            typescript-airbnb.json

templates/
  typescript/
    express/controller.ts.tmpl
    prisma/repository.ts.tmpl
    bullmq/queue-manager.ts.tmpl
    ...
```

**JSON rather than TypeScript** for the specs. The TS types were the right idea, but they
made the specs consumable only through a build step and only by TS. JSON with `$schema`
gives the same editor autocomplete and validation, no build, and any tool or agent can read
it directly. Generate `.d.ts` from the schemas if the types are still wanted in code —
one-way, schema is the source.

**Templates as real files** rather than string literals inside a spec. Highlightable,
lintable, diffable, and the rendered output can be run through a formatter. This also
resolves the exact drift found in the audit: the manifest expected files, the code had
strings.

### Closing the loop

Four changes, in dependency order:

1. **`npm run validate` extends to `specs/`.** Every file validates against its schema;
   every `layerId` an architecture references resolves; every template path exists; rule ids
   are unique. This is the single change that would have prevented the original drift, so it
   lands first.
2. **`manifest.json` becomes generated**, exactly like `index/`. Derived by walking
   `specs/` and `templates/`. A derived registry cannot over-promise.
3. **Rules gain an optional `check` field**, e.g.
   `{"kind": "import-boundary", "from": "controller", "denyImportsFrom": ["repository", "orm"]}`,
   and a script emits a `dependency-cruiser` or `eslint-plugin-boundaries` config from the
   architecture spec. This is the step where a rule stops being documentation and becomes
   enforcement in a consuming project's CI.
4. **Prose and specs cross-reference.** `kb/` entries gain an optional `spec:` frontmatter
   field, validated to resolve. `kb/patterns/controller-service-repository.md` holds the
   judgement; `specs/architectures/controller-service-repository.json` holds the
   constraints. Neither duplicates the other, and validation keeps the link honest.

### Plugin surface

Skills are instructions; this tier is data and executables, and the plugin format has slots
for both:

- **Specs are data** the skills read from `${CLAUDE_PLUGIN_ROOT}/specs/`.
- **Templates are assets** the skills render.
- **`bin/` executables** land on PATH while the plugin is enabled, so `scaffold-component`
  and `check-boundaries` are real commands rather than prompts hoping the model complies.

New skills: `scaffold-component` (read the target project's config, pick the architecture,
render the templates) and `check-boundaries` (run the generated rules, report violations by
rule id). Existing `architecture-review` gets sharper — findings cite a rule id and severity
instead of arguing from taste.

### Migration

Port, don't fork. Six layers, 22 shared rules, ~17 templates, two architectures. Drop the
committed build output. Backport the composition fix so both architectures reference layer
ids rather than one inlining them. Delete the 11 dangling manifest entries rather than
carrying them as TODOs — the generated manifest makes the question moot.

Archive `evius/architecture-spec` with a pointer here once the port is verified.

## Alternatives considered

**Link to the old repo and leave it there** — the current state. Rejected: it leaves the
valuable model in a repo that is drifting, and the two repos would diverge on the same
questions. It also means the KB never gets past documents, which is the thing this RFC
exists to fix.

**Absorb everything as prose `pattern` entries.** Rejected: prose cannot be executed or
validated, so it reproduces the original failure. Layer boundaries described in a paragraph
are a suggestion; the same boundaries in a lint config are a constraint. The audit is fairly
direct evidence that write-only artefacts rot.

**Keep the specs in TypeScript and publish an npm package.** Tempting — real types, real
tests, and consumers `npm install` it. Rejected for now: it adds a build and release step to
a repo whose main job is to be readable, it restricts consumers to the TS ecosystem, and
agents would have to compile or parse TS to read a spec. Worth revisiting if a generator
grows enough logic to need testing, at which point the generator can be the package and the
specs stay JSON.

**Skip specs; generate lint configs directly from prose entries.** Rejected: it makes the
prose load-bearing for machine behaviour, which forces prose to be precise at the cost of
being readable. The two-tier split exists so each can be good at one job.

**Full code generator / scaffolding CLI as the primary artefact.** Rejected as the starting
point: generators are where this kind of project usually dies, because they must cover every
case to be trusted. Boundary *checking* is more valuable per unit of effort — it works on
code that already exists, including code the generator never touched.

## Risks and unknowns

- **Boundary-check generation is the sprawl risk.** `dependency-cruiser` and
  `eslint-plugin-boundaries` have different config models, and mapping `cannotImport` onto
  either is more subtle than it looks once path aliases and monorepos are involved. Scope it
  to one tool and one language first.
- **Two tiers can drift from each other** — the failure mode that produced the dangling
  manifest, one level up. Mitigation is the validated `spec:` link, but the *semantic*
  agreement between a pattern's prose and its spec's constraints cannot be validated
  mechanically.
- **Specs may be more precision than the material supports.** A layer's `restrictions` list
  is easy to write and hard to keep true. If a spec entry cannot be enforced by a check, it
  may belong in prose instead.
- **The zero-dependency rule is under pressure.** JSON Schema validation realistically wants
  `ajv`. Accepting one dev dependency is probably right, but it should be a deliberate
  reversal of the position taken in `decision.0002-kb-structure`, not a drift.
- **Effort.** Several sessions. The schema port and validation are useful standalone; the
  generator half may never get built, and the design should survive that.

## Open questions

- Does `specs/` sit inside `kb/` or beside it? Beside it keeps the prose taxonomy clean and
  keeps `index/` meaningful, but splits "the knowledge base" across two roots.
- Is `ajv` an acceptable dependency, or is a hand-rolled subset validator good enough for
  schemas this shape?
- What is the minimum viable `check` vocabulary? `import-boundary` alone may cover most of
  the value; `naming-pattern` and `file-structure` are plausible but much fuzzier.
- Should the per-project config (`ProjectConfig` in the old repo — language, framework,
  architecture id, naming, file structure) be part of this, or a separate RFC? It is the
  interface between the KB and a consuming repo, and it may deserve its own argument.
- Do templates need a rendering engine, or is `{{Placeholder}}` string substitution enough?
  The old repo assumed the latter, and no evidence yet says otherwise.
- Which goes first: porting `controller-service-repository` (better understood, more
  duplicated) or `queue-architecture` (already composes layers, but 1,257 lines to unpick)?

## Resolution

<!-- On close: link the resulting decision and pattern entries, then set
     `status: superseded`. -->
