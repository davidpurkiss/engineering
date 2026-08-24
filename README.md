# engineering

A public, personal engineering knowledge base: the principles, patterns, practices and
designs I actually reach for, written down once so that both people and coding agents can
use them.

It is an experience dump with structure. Every entry is a plain markdown file with a small
metadata header, so the same content can be browsed on GitHub, grepped in a terminal, or
loaded selectively by an LLM.

## Why it exists

Most engineering judgement lives in people's heads and gets re-derived on every project.
Coding agents make that worse: given an open-ended task and no explicit constraints, they
produce plausible code that ignores conventions you never wrote down.

The fix is to move work from *open-ended with implicit context* to *bounded with explicit
context*. This repo is where that explicit context lives, and the plugin is how an agent
gets at it without loading the whole thing.

> This supersedes [evius/architecture-spec](https://github.com/evius/architecture-spec),
> whose specs are being migrated in as `pattern` entries.

## What's in here

| Type | Folder | Answers | Example |
|---|---|---|---|
| **Principle** | `kb/principles/` | *Why* we lean a certain way | Optimise for deletion |
| **Pattern** | `kb/patterns/` | *What* shape solves a recurring problem | Transactional outbox |
| **Practice** | `kb/practices/` | *How* the work gets done | Writing docs for agents |
| **RFC** | `kb/rfcs/` | A proposal still under discussion | AI observability |
| **Decision** | `kb/decisions/` | What was chosen, and why (ADR) | Adopt OTel GenAI conventions |

Principles are stable and few. Patterns are the bulk. Practices are process. RFCs are
thinking in progress. Decisions are the immutable audit trail.

`index/` is **generated** — never hand-edit it. Run `npm run index` after adding an entry.

## Structure

```
.claude-plugin/     plugin + marketplace manifests
docs/               how this KB works (charter, taxonomy, frontmatter, lifecycle)
kb/                 the content — one folder per entry type
index/              GENERATED views: all entries, by domain, by stack
skills/             Claude Code skills that read kb/
scripts/            validate.mjs, build-index.mjs (zero dependencies)
```

## Using it with Claude Code

```bash
/plugin marketplace add evius/engineering
/plugin install engineering-kb@evius
```

That gives you:

- `/engineering-kb:kb-lookup` — pull the entries relevant to what you're building
- `/engineering-kb:kb-author` — add or amend an entry without breaking the schema
- `/engineering-kb:architecture-review` — review a design or diff against the KB

Skills are also model-invocable, so Claude will reach for them on its own when a task
looks architectural.

## Using it without Claude Code

Everything is plain markdown. Point any agent at `AGENTS.md`, or vendor the folder into
your project and reference it from your own rules file. `index/INDEX.md` is a compact
map of everything, cheap to paste into a context window.

## Contributing

It's personal, so PRs that add *my* opinions aren't a great fit — but corrections,
counter-examples and "this breaks under X" issues are very welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md) for the entry schema and the local checks.

## Licence

Prose and diagrams: [CC BY 4.0](LICENSE-CONTENT). Scripts and plugin code:
[MIT](LICENSE-CODE). Use the ideas, credit is nice, no warranty.
