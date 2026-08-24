# Contributing

This is a personal knowledge base, so the bar for "add a new opinion" is high — but issues
that say *"this breaks under X"* or *"here's a counter-example"* are the most valuable
thing anyone can send. Corrections, broken links and clarifications are always welcome.

## Adding an entry

1. Pick the type — see [docs/taxonomy.md](docs/taxonomy.md).
2. Copy the template: `cp kb/<type>s/_TEMPLATE.md kb/<type>s/my-entry.md`.
3. Fill the frontmatter — see [docs/frontmatter.md](docs/frontmatter.md). `id` must equal
   `<type>.<filename>`.
4. Write the body. Keep the template's headings; delete the guidance comments.
5. Run the checks:

   ```bash
   npm run validate   # frontmatter, vocabulary, id/path agreement, related-link resolution
   npm run index      # regenerate index/ — never hand-edit those files
   ```

6. Commit both the entry and the regenerated `index/`.

Or let the plugin do it: `/engineering-kb:kb-author add a pattern for the transactional
outbox` walks the same steps and runs the checks.

## Writing style

- **Second-person imperative for instructions**, first-person for judgement. "Stage the
  event in the same transaction" / "I've been burned by this twice".
- **Concrete over abstract.** Name the technology, quote the number, show the snippet.
- **State the cost.** Every entry says what it gives up and when it doesn't apply. An entry
  with no downside section will be rejected — including by me, to me.
- **Short summaries do the heavy lifting.** The `summary` field is what an agent sees when
  deciding whether to load the entry. Spend time on it.
- **No filler.** Skip the "in today's fast-moving landscape" opener.

## Checks that run in CI

`.github/workflows/validate.yml` runs `npm run validate` and then `npm run index`,
failing if the regenerated index differs from what's committed. So: run `npm run index`
before you push.

## Licence of contributions

By opening a PR you agree your contribution is licensed under CC BY 4.0 (prose) or MIT
(code), matching the repo.
