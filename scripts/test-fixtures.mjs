#!/usr/bin/env node
// Regression test for the boundary checker itself. A checker that cannot be shown to fail
// is not a checker, so this asserts the exact findings rather than just an exit code.
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (fixture) => {
  try {
    const stdout = execFileSync('node', [join(ROOT, 'scripts/check-boundaries.mjs'), join(ROOT, 'fixtures', fixture)], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out: stdout };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
};

const expected = [
  ['src/consumers/report.consumer.ts:2', 'consumer-owns-no-infrastructure'],
  ['src/handlers/report.handler.ts:1', 'handler-is-transport-agnostic'],
  ['src/handlers/report.handler.ts:2', 'handler-is-transport-agnostic'],
];

const problems = [];

const bad = run('queue-violations');
if (bad.code !== 1) problems.push(`queue-violations: expected exit 1, got ${bad.code}`);
for (const [where, ruleId] of expected) {
  const line = bad.out.split('\n').find((l) => l.includes(where) && l.includes(ruleId));
  if (!line) problems.push(`queue-violations: expected ${ruleId} at ${where}, not reported`);
}
const reported = (bad.out.match(/^ {2}(?:ERROR|WARNING|INFO)/gm) ?? []).length;
if (reported !== expected.length) {
  problems.push(`queue-violations: expected exactly ${expected.length} findings, got ${reported}`);
}

const good = run('queue-clean');
if (good.code !== 0) problems.push(`queue-clean: expected exit 0, got ${good.code}\n${good.out}`);
if (!good.out.includes('no boundary violations')) problems.push('queue-clean: expected a clean report');

if (problems.length) {
  console.error(`\n✗ ${problems.length} fixture failure${problems.length === 1 ? '' : 's'}:\n`);
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}
console.log(`✓ fixtures pass — ${expected.length} violations detected, clean fixture silent`);
