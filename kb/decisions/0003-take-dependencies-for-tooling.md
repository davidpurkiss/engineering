---
id: decision.0003-take-dependencies-for-tooling
title: Take dependencies where they buy real tooling
type: decision
status: stable
summary: Repo tooling may take dev dependencies; reading the knowledge base must never require an install. Reverses the zero-dependency consequence of decision 0002.
domains: [delivery, agentic]
stack: [json-schema]
related: [decision.0002-kb-structure, rfc.0002-machine-readable-specs]
created: 2026-08-25
updated: 2026-08-25
---

## Context

`decision.0002-kb-structure` committed to dependency-free Node scripts, with the reasoning
that cloning and checking should require no install step. That was right for what the
repository was at the time: prose entries, a hand-rolled frontmatter parser of about a
hundred lines, and a generator that writes three markdown files. The parser only ever had to
handle scalars, quoted strings and simple lists, and writing it was cheaper than taking on
a YAML library.

`rfc.0002-machine-readable-specs` changes the shape of the repository. It adds structured
specifications validated against JSON Schema, and proposes generated lint configuration and
`bin/` commands that run inside consuming projects. JSON Schema is a large specification with
subtle resolution and composition rules; a hand-rolled subset validator would be a
significant piece of software in its own right, would silently accept schemas it did not
understand, and is not the thing worth spending effort on here.

More broadly, the premise behind the original constraint no longer holds. The repository is
not only documents. It ships tooling, and tooling has dependencies.

## Decision

Take dependencies where they buy real capability, subject to three constraints:

1. **Reading the knowledge base must never require an install.** Content stays plain markdown
   and JSON. `index/` stays committed and generated. Anyone can clone the repository, or read
   it on GitHub, and get everything the content has to offer with no toolchain at all. This
   is the part of `decision.0002-kb-structure` that survives, and it is the part that
   mattered.
2. **Dev dependencies for repository tooling are unremarkable.** Validators, generators and
   test tooling may take them without ceremony.
3. **Runtime dependencies — anything a consuming project executes — are minimised and
   justified individually.** A boundary check that a project runs in its own CI is held to a
   much higher bar than a script that only runs here.

First dependency under this decision: `ajv`, as a dev dependency, for JSON Schema validation.

## Consequences

- `npm run validate` now requires `npm install` first. CI gains an install step. Someone who
  clones the repository purely to read it is unaffected; someone who clones it to contribute
  has one more command to run, and `CONTRIBUTING.md` says so.
- A supply-chain surface now exists where there was none. It is small and dev-only today, and
  constraint 3 exists to keep it that way as the tooling grows.
- The hand-rolled frontmatter parser in `scripts/lib.mjs` stays for now. It works, it is
  tested by every entry in the repository, and replacing it is not what this decision is for.
  Replacing it with a YAML library is now permitted, not required.
- A lockfile becomes meaningful, so `package-lock.json` gets committed.
- The bar for a new dependency is now a judgement call rather than a rule. That is a real
  cost: rules do not drift and judgement does. Constraint 3 is the part most likely to erode,
  and the place to watch is the first `bin/` command that wants a convenience library.

## Alternatives

**Hand-roll a JSON Schema subset validator.** Rejected. The narrow-subset trick worked for
frontmatter because the subset was genuinely tiny and entirely under our control. Schemas are
neither. The failure mode is quiet: a validator that ignores a keyword it does not implement
reports success on a schema that never ran.

**Avoid JSON Schema; validate specs with bespoke code.** Rejected. It gives up editor
autocomplete via `$schema`, gives up the ability for a consumer to validate a spec with their
own tooling, and re-implements the same logic worse.

**Keep specs in the prose tier to preserve the constraint.** Rejected in
`rfc.0002-machine-readable-specs`. Preserving a means at the cost of the end.

<!-- ADRs are append-only. This decision reverses a consequence of
     decision.0002-kb-structure; that entry's structural decision stands and its status is
     unchanged. See the "Partial reversals" section of docs/lifecycle.md. -->
