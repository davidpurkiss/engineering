---
id: rfc.0002-machine-readable-specs
title: Machine-readable specs as a second content tier
type: rfc
status: draft
summary: Add JSON-Schema-validated architecture specs and real template files beside the prose entries, so the KB holds constraints an agent can execute, not only advice it can read.
domains: [architecture, agentic, delivery]
stack: [typescript, json-schema]
related: [pattern.controller-service-repository, practice.writing-for-agents, decision.0002-kb-structure]
created: 2026-08-25
updated: 2026-08-25
---

## Summary

The KB currently holds prose. Prose is the right shape for judgement — when to reach for
something, what it costs, how it fails — but it is the wrong shape for constraint. A layer
boundary described in a paragraph is a suggestion; the same boundary in a lint config is
enforcement.

This proposes a second tier: **structured, machine-readable specifications** describing
architectures as composable layers with explicit restrictions, addressable rules, and real
template files — validated in CI, consumed by the plugin, and cross-linked to the prose
entries that explain them.

A knowledge base of engineering experience should hold artefacts, not only documents.

## Motivation

### The gap

`practice.writing-for-agents` argues that knowledge should be retrievable in small,
condition-tagged pieces. That solves *finding* the right guidance. It does nothing about
*compliance* — an agent that has read "controllers must not import repositories" will still
write the import, and nothing in the repository will notice.

The two failure modes differ in kind:

| | Failure | Detected by |
|---|---|---|
| Prose entry | Not retrieved, or retrieved and ignored | A human reading the diff |
| Executable spec | Violated | CI, immediately, citing a rule id |

Most of the value in an architectural convention is in the second row, and none of it is
reachable from markdown.

### Negative space is the load-bearing part

The single most useful thing to write down about a layer is what it must **not** do. An
agent given only positive guidance applies it everywhere; the restriction is what bounds it.
That is exactly the kind of statement that can be machine-checked — `cannotImport` becomes a
dependency rule — and exactly the kind that decays fastest when it lives only in prose,
because nothing fails when it stops being true.

### Why now

The idea is not new. I drafted a version of this a year ago and set it aside — not because
it was wrong, but because the payoff was unclear and the ground was moving. In mid-2025 a
machine-readable architecture spec had no natural reader. To get value from one you had to
build the whole consumption chain yourself — loader, retrieval, integration into whatever
tool you happened to use — against interfaces that were being redesigned every few months.
The specs were the easy half; everything downstream of them was speculative.

What changed is the consumption surface. Skills give a spec somewhere to be loaded from and
a defined moment to be loaded at. Plugins package data, templates and executables alongside
the instructions that use them, and distribute the lot. The chain that previously had to be
hand-built now largely exists and is stable enough to build against.

So the bet here is not that structured specs are a good idea — that was equally true a year
ago. It is that **specs and skills are worth more together than either is alone**: skills
supply retrieval and the moment of use, specs supply constraints worth enforcing at that
moment, and neither has to do the other's job. Prose alone leaves compliance to whether
someone read carefully. Specs alone leave a well-modelled artefact with nothing reading it.

That also sets the sequencing. The risk is not that specs are hard to write — it is building
spec breadth before anything consumes them, which is what makes the benefit invisible.

## Proposal

### Three tiers

```
kb/          prose      — judgement: when to use it, trade-offs, failure modes
specs/       JSON       — constraints: layers, architectures, rules, styles
templates/   .tmpl      — code: real source files with placeholders
```

```
specs/
  schema/            JSON Schema per spec kind
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
```

### The spec model

Three ideas carry the design:

1. **Layers are the reusable unit; architectures compose them.** A layer declares purpose,
   responsibilities, `restrictions`, and `dependencies.canImport` / `cannotImport`. An
   architecture references layer ids and adds options and wiring. Adding Fastify support
   must not fork the architecture — it adds a template.
2. **Restrictions are first-class, not an appendix.** Every layer states what it must not do
   and what it must not import, in fields designed to be compiled into checks.
3. **Rules are addressable.** `id`, `scope`, `severity`, `category` — so a review finding can
   cite `dependency-direction` at `error` rather than paraphrasing a paragraph.

**JSON rather than TypeScript.** Types would give better authoring ergonomics, but they put
a build step between a spec and its reader and restrict consumers to one ecosystem. JSON with
`$schema` gives editor autocomplete and validation with neither cost, and any tool or agent
can read a spec directly. Generate `.d.ts` from the schemas if the types are wanted in code —
one direction only, schema is the source.

**Templates as real files, not strings inside a spec.** Highlightable, lintable, diffable,
and the rendered output can be formatted. Embedding code in string literals also makes the
spec file grow without bound and hides the template from every tool that understands the
language.

### Closing the loop

Four changes, in dependency order. The first two keep the structure honest; the third is
where the tier starts paying for itself.

1. **`npm run validate` covers `specs/`.** Every file validates against its schema; every
   `layerId` an architecture references resolves; every template path exists; rule ids are
   unique. Cheap to write, and it removes a whole class of silent drift.
2. **The registry is generated**, exactly like `index/`. Derived by walking `specs/` and
   `templates/`. A derived registry cannot describe an intention.
3. **Rules gain an optional `check` field**, e.g.
   `{"kind": "import-boundary", "from": "consumer", "denyImportsFrom": ["queue-manager"]}`,
   and something runs it against real code. This is where a rule stops being documentation.

   *Amended 2026-08-25:* the original plan was to emit a `dependency-cruiser` or
   `eslint-plugin-boundaries` config. A direct checker (`scripts/check-boundaries.mjs`) was
   built first instead, because emitting config for a tool that cannot be installed or run
   here would have shipped the gate unverified — and the gate exists precisely to stop
   unexercised work accumulating. The direct checker needs no dependency, reads the spec
   without translation, and is proved against fixtures in CI. Emitting config for an
   existing linter remains the right *distribution* story for a consuming project that
   already runs one; it is now a follow-on rather than the first move.
4. **Prose and specs cross-reference.** `kb/` entries gain an optional `spec:` frontmatter
   field, validated to resolve. `kb/patterns/controller-service-repository.md` holds the
   judgement; `specs/architectures/controller-service-repository.json` holds the constraints.
   Neither duplicates the other, and validation keeps the link honest.

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

### Sequencing

One thin vertical slice before any breadth:

1. `layer.schema.json` plus one layer — `controller.json`.
2. `architecture.schema.json` plus one architecture that composes it.
3. `npm run validate` covering both, so that reference cannot dangle.
4. One skill that reads the architecture and applies its restrictions in a review.
5. One `check` that fires on a real violation in a real repository.

Content widens only after step 5 — once the loop from spec to visible outcome has closed at
least once. Two architectures are the target for the first pass, controller-service-repository
and a queue architecture: one is not enough to tell a reusable layer model from a bespoke
one, and three is over-fitting to a guess about what comes next.

## Alternatives considered

**Keep everything as prose `pattern` entries.** The status quo. Rejected: prose cannot be
executed or validated, so restrictions decay silently and compliance stays a matter of
whether someone reads carefully. It also caps the KB at documents, which is the ceiling this
RFC exists to raise.

**Skip specs; generate lint configs directly from prose entries.** Rejected: it makes prose
load-bearing for machine behaviour, which forces it to be precise at the cost of being
readable. The two-tier split exists so each tier can be good at one job.

**TypeScript specs published as an npm package.** Real types, real tests, and consumers
`npm install` it. Rejected for now: it adds build and release steps to a repository whose
main job is to be readable, restricts consumers to the TS ecosystem, and forces an agent to
compile or parse TypeScript to read a spec. Worth revisiting if a generator grows enough
logic to need testing — at which point the generator is the package and the specs stay JSON.

**A scaffolding CLI as the primary artefact.** Rejected as the starting point. Generators
are where projects of this kind usually die, because they must cover every case before anyone
trusts them, and an unused generator produces no feedback. Boundary *checking* delivers more
per unit of effort: it works on code that already exists, including code no generator
touched.

**Adopt an existing architecture-linting tool's config format directly** (dependency-cruiser
rules, `eslint-plugin-boundaries`) and skip the abstraction. Genuinely tempting, and it would
cut a layer. Rejected because the spec has to carry more than import edges — responsibilities,
method patterns, templates, AI hints — and because binding the source of truth to one tool's
schema makes supporting a second language or linter a rewrite rather than a new emitter.

## Risks and unknowns

- **Boundary-check generation is the sprawl risk.** `dependency-cruiser` and
  `eslint-plugin-boundaries` model configuration differently, and mapping `cannotImport` onto
  either gets subtle once path aliases and monorepos are involved. Scope to one tool and one
  language first.
- **The two tiers can drift from each other.** The validated `spec:` link catches structural
  drift; it cannot catch a pattern's prose and its spec's constraints disagreeing on meaning.
- **Specs may be more precision than the material supports.** A `restrictions` list is easy
  to write and hard to keep true. A restriction no check can enforce probably belongs in
  prose.
- **The zero-dependency rule is under pressure.** JSON Schema validation realistically wants
  `ajv`. Accepting one dev dependency is likely right, but it should be a deliberate reversal
  of `decision.0002-kb-structure`, with its own ADR — not a drift.
- **Breadth before consumption.** The failure mode most likely to repeat is accumulating
  specs faster than anything reads them, at which point the benefit stays theoretical and
  interest drains. The sequencing above exists to prevent it; it only works if step 5 is
  treated as a gate rather than a milestone.
- **Effort.** Several sessions. The schema, validator and one skill are useful standalone;
  the generator half may never get built, and the design should survive that outcome.

## Open questions

### Resolved

- **Does `specs/` sit inside `kb/` or beside it?** Beside it, at the repository root. `kb/`
  stays "files with frontmatter and a summary, listed in `index/`"; specs have a different
  schema and a different consumer. Cost: the knowledge base now spans two roots, which the
  README has to explain. *(2026-08-25)*
- **Is `ajv` acceptable?** Yes. `decision.0003-take-dependencies-for-tooling` reverses the
  zero-dependency stance outright rather than carving out an exception for it, on the grounds
  that the repository ships tooling now and tooling has dependencies. *(2026-08-25)*
- **Which architecture proves the model first?** The queue architecture — consumer,
  queue-manager, job-handler. More layers than controller-service-repository and a less
  obvious dependency shape, so it stresses composition harder. If the model is wrong, the
  first architecture is the cheapest place to find out. *(2026-08-25)*

### Still open

- Should the checker emit `dependency-cruiser` / `eslint-plugin-boundaries` config for
  projects that already run one, or is a standalone binary enough? The tradeoff is one
  more thing to keep in step versus fitting a project's existing CI.
- Is regex import extraction good enough, or does the checker eventually need a real
  parser? It currently misses dynamically constructed specifiers, which nobody writes on
  purpose but which a determined workaround would use.
## Resolution

<!-- On close: link the resulting decision and pattern entries, then set
     `status: superseded`. -->
