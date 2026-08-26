#!/usr/bin/env node
// Runs the import-boundary checks from an architecture spec against a real project.
//
// Usage: node scripts/check-boundaries.mjs <project-dir>
//
// The project declares which of its directories play which layer, in engineering.json:
//   { "architecture": "queue-architecture",
//     "layers": { "consumer": "src/consumers", "job-handler": "src/handlers" } }
//
// This is deliberately a first-pass detector, not a type-aware analyser: it reads import
// specifiers with a regex after stripping comments and strings-in-comments. It will miss
// dynamic specifiers built at runtime. It does not miss the ones people actually write.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, resolve, dirname, posix } from 'node:path';
import { loadSpecs, ROOT } from './lib.mjs';

const projectDir = resolve(process.argv[2] ?? '.');
const configPath = join(projectDir, 'engineering.json');

const die = (msg) => {
  console.error(`\n✗ ${msg}\n`);
  process.exit(2);
};

if (!existsSync(configPath)) die(`no engineering.json in ${projectDir}`);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
if (!config.architecture) die('engineering.json has no "architecture"');
if (!config.layers || !Object.keys(config.layers).length) die('engineering.json has no "layers" mapping');

const specs = loadSpecs();
const arch = specs.architectures.find((a) => a.data.id === config.architecture)?.data;
if (!arch) die(`unknown architecture \`${config.architecture}\` — see index/SPECS.md`);

const layerIds = new Set(specs.layers.map((l) => l.data.id));
for (const id of Object.keys(config.layers)) {
  if (!arch.layers.includes(id)) {
    die(`engineering.json maps \`${id}\`, which \`${arch.id}\` does not compose`);
  }
}

// Collect the import-boundary checks that apply, from every ruleset the architecture names.
const checks = [];
for (const rsId of arch.rulesets) {
  const rs = specs.rulesets.find((r) => r.data.id === rsId)?.data;
  if (!rs) die(`architecture references unknown ruleset \`${rsId}\``);
  for (const rule of rs.rules) {
    if (rule.check?.kind === 'import-boundary') checks.push(rule);
  }
}
if (!checks.length) die(`no import-boundary checks in ${arch.rulesets.join(', ')}`);

// ---- gather source files -----------------------------------------------------------------
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', 'coverage']);
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE.test(name)) out.push(full);
  }
  return out;
};

const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const SPECIFIER =
  /(?:^|[\s;{])(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|(?:^|[\s;{])import\s*['"]([^'"]+)['"]|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const importsOf = (file) => {
  const src = stripComments(readFileSync(file, 'utf8'));
  const found = [];
  for (const m of src.matchAll(SPECIFIER)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (!spec) continue;
    const at = src.indexOf(spec, m.index);
    found.push({ spec, line: src.slice(0, at).split('\n').length });
  }
  return found;
};

/** Which layer does a repo-relative path belong to? Longest prefix wins. */
const layerOf = (relPath) => {
  let best = null;
  for (const [id, prefix] of Object.entries(config.layers)) {
    const p = prefix.replace(/\/$/, '');
    if ((relPath === p || relPath.startsWith(p + '/')) && (!best || p.length > best.len)) {
      best = { id, len: p.length };
    }
  }
  return best?.id ?? null;
};

// ---- run ---------------------------------------------------------------------------------
const findings = [];
for (const file of walk(projectDir)) {
  const rel = posix.normalize(relative(projectDir, file).split('\\').join('/'));
  const fromLayer = layerOf(rel);
  if (!fromLayer) continue;

  for (const { spec, line } of importsOf(file)) {
    const isRelative = spec.startsWith('.');
    const targetLayer = isRelative
      ? layerOf(posix.normalize(posix.join(posix.dirname(rel), spec)))
      : null;
    const bareModule = isRelative ? null : spec.split('/')[0].replace(/^@[^/]+\//, (s) => s);

    for (const rule of checks) {
      if (rule.check.from !== fromLayer) continue;
      for (const denied of rule.check.denyImportsFrom) {
        const hitLayer = layerIds.has(denied) && targetLayer === denied;
        const hitModule = !layerIds.has(denied) && bareModule === denied;
        if (!hitLayer && !hitModule) continue;
        findings.push({
          file: rel,
          line,
          spec,
          rule,
          why: hitLayer ? `imports the \`${denied}\` layer` : `imports \`${denied}\``,
        });
      }
    }
  }
}

const label = { error: 'ERROR  ', warning: 'WARNING', info: 'INFO   ' };
if (findings.length) {
  console.error(`\n✗ ${findings.length} boundary violation${findings.length === 1 ? '' : 's'} in ${relative(ROOT, projectDir) || projectDir}\n`);
  for (const f of findings) {
    console.error(`  ${label[f.rule.severity]} ${f.file}:${f.line}  ${f.rule.id}`);
    console.error(`          ${f.rule.check.from} ${f.why} (\`${f.spec}\`)`);
    console.error(`          ${f.rule.rule}`);
    if (f.rule.rationale) console.error(`          why: ${f.rule.rationale}`);
    console.error('');
  }
  process.exit(findings.some((f) => f.rule.severity === 'error') ? 1 : 0);
}

console.log(`✓ no boundary violations — ${checks.length} checks against ${arch.id}`);
