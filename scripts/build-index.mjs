#!/usr/bin/env node
// Regenerates index/. Never hand-edit the output — run `npm run index`.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEntries, loadSpecs, INDEX_DIR, TYPE_ORDER, GENERATED_HEADER } from './lib.mjs';

const entries = loadEntries().filter((e) => e.data?.id);
mkdirSync(INDEX_DIR, { recursive: true });

const TYPE_LABEL = {
  principle: 'Principles',
  pattern: 'Patterns',
  practice: 'Practices',
  rfc: 'RFCs',
  decision: 'Decisions',
};

const STATUS_MARK = { draft: '·', stable: '✓', deprecated: '⚠', superseded: '✕' };

const byTitle = (a, b) => String(a.data.title).localeCompare(String(b.data.title));

/** `- ✓ [Title](../kb/…) — summary` with the status mark carrying maturity cheaply. */
const line = (e, { showType = false } = {}) => {
  const mark = STATUS_MARK[e.data.status] ?? '?';
  const type = showType ? ` \`${e.data.type}\`` : '';
  const spec = e.data.spec ? ' \u2699' : '';
  return `- ${mark}${type} [${e.data.title}](../${e.relPath})${spec} — ${e.data.summary}`;
};

const legend = [
  '',
  'Status: `✓` stable · `·` draft · `⚠` deprecated · `✕` superseded',
  '',
];

// ---------------------------------------------------------------- INDEX.md
{
  const out = [GENERATED_HEADER, '', '# Index', '',
    `${entries.length} entries. This file is the cheapest complete view of the knowledge`,
    'base — one line each, enough to decide what to open. Agents should read this first and',
    'load only the entries that match the task.',
    ...legend];

  for (const type of TYPE_ORDER) {
    const group = entries.filter((e) => e.data.type === type).sort(byTitle);
    if (!group.length) continue;
    out.push(`## ${TYPE_LABEL[type]}`, '');
    out.push(...group.map((e) => line(e)));
    out.push('');
  }

  const recent = [...entries]
    .sort((a, b) => String(b.data.updated).localeCompare(String(a.data.updated)))
    .slice(0, 10);
  out.push('## Recently updated', '');
  out.push(...recent.map((e) => `- ${e.data.updated} — [${e.data.title}](../${e.relPath})`));
  out.push('');

  writeFileSync(join(INDEX_DIR, 'INDEX.md'), out.join('\n'));
}

// ------------------------------------------------------- by-domain / by-stack
const rollup = (field, file, title, blurb) => {
  const buckets = new Map();
  for (const e of entries) {
    for (const key of e.data[field] ?? []) {
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(e);
    }
  }
  const out = [GENERATED_HEADER, '', `# ${title}`, '', blurb, ...legend];
  if (!buckets.size) out.push('_Nothing tagged yet._', '');
  for (const key of [...buckets.keys()].sort()) {
    const group = buckets.get(key).sort(byTitle);
    out.push(`## ${key}`, '', ...group.map((e) => line(e, { showType: true })), '');
  }
  writeFileSync(join(INDEX_DIR, file), out.join('\n'));
  return buckets.size;
};

const domains = rollup(
  'domains', 'by-domain.md', 'By domain',
  'Entries grouped by subject area. An entry appears under every domain it is tagged with.',
);
const stacks = rollup(
  'stack', 'by-stack.md', 'By stack',
  'Entries grouped by the concrete technology they name. Untagged entries do not appear here.',
);

// ------------------------------------------------------------------ SPECS.md
const specs = loadSpecs();
{
  // Backlinks are derived from the entries' own spec: fields, so they cannot drift.
  const proseFor = new Map();
  for (const e of entries) {
    if (e.data.spec) proseFor.set(e.data.spec, e);
  }

  const out = [GENERATED_HEADER, '', '# Specs', '',
    'Machine-readable constraints. Find the architecture whose *applies when* matches the',
    'task, then load its JSON and the layer specs it composes. Rules are listed here so a',
    'finding can cite an id without reading every ruleset.', ''];

  out.push('## Architectures', '');
  for (const { rel, data: a } of specs.architectures) {
    const prose = proseFor.get(`architecture.${a.id}`);
    out.push(`### \`${a.id}\` — ${a.name}`, '');
    if (a.appliesWhen) out.push(`**Applies when:** ${a.appliesWhen}`, '');
    out.push(`- Layers: ${a.layers.join(' → ')}`);
    out.push(`- Rulesets: ${a.rulesets.join(', ')}`);
    out.push(`- Templates: ${(a.templates ?? []).length}`);
    out.push(`- Spec: [\`${rel}\`](../${rel})`);
    out.push(prose ? `- Judgement: [${prose.data.title}](../${prose.relPath})` : '- Judgement: _no prose entry yet_');
    out.push('');
  }
  if (!specs.architectures.length) out.push('_None yet._', '');

  out.push('## Layers', '', '| id | type | must not import |', '|---|---|---|');
  for (const { data: l } of specs.layers) {
    out.push(`| [\`${l.id}\`](../specs/layers/${l.id}.json) | ${l.type} | ${l.dependencies.cannotImport.join(', ') || '—'} |`);
  }
  out.push('');

  out.push('## Rules', '',
    'A rule with a check is mechanically enforceable; the rest need judgement.', '',
    '| id | scope | severity | check | rule |', '|---|---|---|---|---|');
  for (const { data: rs } of specs.rulesets) {
    for (const r of rs.rules) {
      out.push(`| \`${r.id}\` | ${r.scope} | ${r.severity} | ${r.check ? r.check.kind : '—'} | ${r.rule} |`);
    }
  }
  out.push('');

  writeFileSync(join(INDEX_DIR, 'SPECS.md'), out.join('\n'));
}

const ruleCount = specs.rulesets.reduce((n, r) => n + r.data.rules.length, 0);
console.log(
  `✓ index/ rebuilt — ${entries.length} entries, ${domains} domains, ${stacks} stack tags; ` +
    `${specs.architectures.length} architectures, ${specs.layers.length} layers, ${ruleCount} rules`,
);
