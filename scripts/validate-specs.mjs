#!/usr/bin/env node
// Validates specs/ against the JSON Schemas in specs/schema/, then checks every
// cross-reference resolves. The reference checks are the point: a registry that is never
// dereferenced drifts silently.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPECS = join(ROOT, 'specs');

let Ajv2020;
try {
  ({ default: Ajv2020 } = await import('ajv/dist/2020.js'));
} catch {
  console.error(
    '\n✗ ajv is not installed. Run `npm install` first.\n' +
      '  Why there is a dependency at all: kb/decisions/0003-take-dependencies-for-tooling.md\n',
  );
  process.exit(1);
}

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

const readJson = (path, where) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    fail(where, `unreadable JSON — ${err.message}`);
    return null;
  }
};

const listJson = (dir) => {
  const full = join(SPECS, dir);
  if (!existsSync(full)) return [];
  return readdirSync(full)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
    .sort()
    .map((file) => ({
      file,
      slug: basename(file, '.json'),
      path: join(full, file),
      rel: `specs/${dir}/${file}`,
    }));
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
const compile = (name) => {
  const schema = readJson(join(SPECS, 'schema', `${name}.schema.json`), `specs/schema/${name}.schema.json`);
  return schema ? ajv.compile(schema) : null;
};

const validators = {
  layer: compile('layer'),
  architecture: compile('architecture'),
  ruleset: compile('ruleset'),
};

/** Schema-validate a directory, check id matches filename, and check $schema resolves. */
const loadKind = (dir, kind) => {
  const out = [];
  for (const entry of listJson(dir)) {
    const data = readJson(entry.path, entry.rel);
    if (!data) continue;

    const validate = validators[kind];
    if (validate && !validate(data)) {
      for (const e of validate.errors) {
        fail(entry.rel, `schema${e.instancePath || ''} ${e.message}`);
      }
    }

    if (data.id !== entry.slug) {
      fail(entry.rel, `id \`${data.id}\` must equal the filename \`${entry.slug}\``);
    }
    if (data.$schema && !data.$schema.startsWith('http')) {
      const target = resolve(dirname(entry.path), data.$schema);
      if (!existsSync(target)) fail(entry.rel, `$schema points at a missing file: ${data.$schema}`);
    }

    out.push({ ...entry, data });
  }
  return out;
};

const layers = loadKind('layers', 'layer');
const architectures = loadKind('architectures', 'architecture');
const rulesets = loadKind('rules', 'ruleset');

const layerIds = new Set(layers.map((l) => l.data.id));
const rulesetIds = new Set(rulesets.map((r) => r.data.id));

// ---- rule ids are unique across every ruleset -------------------------------------------
const seenRuleIds = new Map();
for (const rs of rulesets) {
  for (const rule of rs.data.rules ?? []) {
    if (seenRuleIds.has(rule.id)) {
      fail(rs.rel, `duplicate rule id \`${rule.id}\` (also in ${seenRuleIds.get(rule.id)})`);
    }
    seenRuleIds.set(rule.id, rs.rel);

    if (rule.scope !== '*' && !layerIds.has(rule.scope)) {
      fail(rs.rel, `rule \`${rule.id}\` is scoped to unknown layer \`${rule.scope}\``);
    }

    const check = rule.check;
    if (check?.kind === 'import-boundary') {
      if (!layerIds.has(check.from)) {
        fail(rs.rel, `rule \`${rule.id}\` check.from is unknown layer \`${check.from}\``);
      } else {
        // The rule and the layer it constrains must not disagree. This is the check that
        // stops the two tiers drifting apart while both look individually fine.
        const layer = layers.find((l) => l.data.id === check.from);
        const declared = new Set(layer.data.dependencies.cannotImport);
        for (const denied of check.denyImportsFrom) {
          if (layerIds.has(denied) && !declared.has(denied)) {
            fail(
              rs.rel,
              `rule \`${rule.id}\` denies ${check.from} → ${denied}, but specs/layers/${check.from}.json ` +
                `does not list \`${denied}\` in dependencies.cannotImport`,
            );
          }
        }
      }
    }
  }
}

// ---- architectures dereference cleanly ---------------------------------------------------
for (const arch of architectures) {
  const a = arch.data;

  for (const id of a.layers ?? []) {
    if (!layerIds.has(id)) fail(arch.rel, `references unknown layer \`${id}\` (expected specs/layers/${id}.json)`);
  }
  for (const id of a.rulesets ?? []) {
    if (!rulesetIds.has(id)) fail(arch.rel, `references unknown ruleset \`${id}\` (expected specs/rules/${id}.json)`);
  }
  for (const t of a.templates ?? []) {
    if (!existsSync(join(ROOT, t.path))) fail(arch.rel, `template path does not exist: ${t.path}`);
    if (!(a.layers ?? []).includes(t.layer)) {
      fail(arch.rel, `template targets layer \`${t.layer}\`, which this architecture does not compose`);
    }
  }
  for (const pair of a.incompatible ?? []) {
    for (const id of pair.layers) {
      if (!(a.layers ?? []).includes(id)) {
        fail(arch.rel, `incompatible pair names \`${id}\`, which this architecture does not compose`);
      }
    }
  }
  if (a.dependencyFlow === 'unidirectional') {
    // Composition order is the dependency order, so a later layer importing an earlier one
    // contradicts the declared flow.
    const order = a.layers ?? [];
    for (const [i, id] of order.entries()) {
      const layer = layers.find((l) => l.data.id === id);
      if (!layer) continue;
      for (const dep of layer.data.dependencies.canImport) {
        const j = order.indexOf(dep);
        if (j !== -1 && j < i) {
          fail(
            arch.rel,
            `\`${id}\` may import \`${dep}\`, which precedes it in the declared order — ` +
              'that contradicts dependencyFlow: unidirectional',
          );
        }
      }
    }
  }
}

const counts = `${layers.length} layers, ${architectures.length} architectures, ${seenRuleIds.size} rules`;

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem${problems.length === 1 ? '' : 's'} in ${counts}:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

console.log(`✓ specs valid — ${counts}`);
