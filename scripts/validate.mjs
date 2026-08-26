#!/usr/bin/env node
// Validates every entry under kb/ against the schema in docs/frontmatter.md.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEntries, FOLDER_TYPE, VOCAB, REQUIRED, ROOT } from './lib.mjs';

const entries = loadEntries();
const problems = [];
const fail = (entry, msg) => problems.push(`${entry.relPath}: ${msg}`);

const ids = new Set();
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const NUMBERED = /^\d{4}-[a-z0-9]+(-[a-z0-9]+)*$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

for (const entry of entries) {
  const d = entry.data;
  if (!d) {
    fail(entry, 'missing or malformed YAML frontmatter block');
    continue;
  }

  for (const field of REQUIRED) {
    const v = d[field];
    if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) {
      fail(entry, `missing required field \`${field}\``);
    }
  }

  const expectedType = FOLDER_TYPE[entry.folder];
  if (d.type && d.type !== expectedType) {
    fail(entry, `type \`${d.type}\` does not match folder (expected \`${expectedType}\`)`);
  }

  const expectedId = `${expectedType}.${entry.slug}`;
  if (d.id && d.id !== expectedId) {
    fail(entry, `id \`${d.id}\` must be \`${expectedId}\``);
  }
  if (d.id) {
    if (ids.has(d.id)) fail(entry, `duplicate id \`${d.id}\``);
    ids.add(d.id);
  }

  const numbered = entry.folder === 'rfcs' || entry.folder === 'decisions';
  if (numbered && !NUMBERED.test(entry.slug)) {
    fail(entry, 'filename must be NNNN-kebab-case.md');
  }
  if (!numbered && !SLUG.test(entry.slug)) {
    fail(entry, 'filename must be kebab-case.md');
  }

  if (d.status && !VOCAB.status.includes(d.status)) {
    fail(entry, `status \`${d.status}\` not in [${VOCAB.status.join(', ')}]`);
  }

  for (const domain of d.domains ?? []) {
    if (!VOCAB.domains.includes(domain)) {
      fail(entry, `unknown domain \`${domain}\` — add it to VOCAB.domains and docs/frontmatter.md first`);
    }
  }

  if (typeof d.summary === 'string' && d.summary.length > 200) {
    fail(entry, `summary is ${d.summary.length} chars (max 200)`);
  }

  // A spec: link must resolve to a real file under specs/. This is half of what keeps
  // the two tiers from drifting; validate-specs.mjs does the other half.
  if (d.spec !== undefined) {
    const SPEC_DIR = { architecture: 'architectures', layer: 'layers', ruleset: 'rules' };
    const m = String(d.spec).match(/^([a-z]+)\.([a-z0-9]+(?:-[a-z0-9]+)*)$/);
    if (!m) {
      fail(entry, `spec \`${d.spec}\` must look like \`architecture.<id>\`, \`layer.<id>\` or \`ruleset.<id>\``);
    } else if (!SPEC_DIR[m[1]]) {
      fail(entry, `spec kind \`${m[1]}\` is not one of [${Object.keys(SPEC_DIR).join(', ')}]`);
    } else {
      const rel = `specs/${SPEC_DIR[m[1]]}/${m[2]}.json`;
      if (!existsSync(join(ROOT, rel))) fail(entry, `spec \`${d.spec}\` does not resolve to ${rel}`);
    }
  }

  for (const field of ['created', 'updated']) {
    if (d[field] && !DATE.test(String(d[field]))) {
      fail(entry, `${field} must be YYYY-MM-DD, got \`${d[field]}\``);
    }
  }
  if (DATE.test(String(d.created)) && DATE.test(String(d.updated)) && d.updated < d.created) {
    fail(entry, 'updated is earlier than created');
  }

  if (!/^##\s+/m.test(entry.body)) {
    fail(entry, 'body has no `##` sections — did you fill in the template?');
  }
  if (/\bSLUG\b|NNNN-slug|YYYY-MM-DD/.test(JSON.stringify(d))) {
    fail(entry, 'frontmatter still contains template placeholders');
  }
}

// Cross-references resolve only once every id is known.
for (const entry of entries) {
  for (const field of ['related', 'supersedes']) {
    for (const ref of entry.data?.[field] ?? []) {
      if (!ids.has(ref)) fail(entry, `${field} references unknown id \`${ref}\``);
      if (ref === entry.data.id) fail(entry, `${field} references itself`);
    }
  }
}

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'} in ${entries.length} entries:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ ${entries.length} entries valid`);
