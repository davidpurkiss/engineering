---
name: architecture-review
description: Review a design, RFC, pull request or diff against the engineering knowledge base — checking it against the recorded principles, patterns and decisions and reporting where it diverges. Use when asked to review an architecture, sanity-check a design, or assess whether a change fits the established conventions.
allowed-tools: Read, Grep, Glob, Bash
---

# Architecture review

Review the thing in front of you against the knowledge base, and report divergence.

## Steps

1. **Establish what's under review.** A design doc, an RFC, a diff (`git diff`), a
   directory, or a proposal in the conversation. If it's ambiguous, ask before reviewing.

2. **Load the relevant KB entries** using the `kb-lookup` procedure — read
   `${CLAUDE_PLUGIN_ROOT}/index/INDEX.md`, match, load three to five entries. Include
   `${CLAUDE_PLUGIN_ROOT}/kb/decisions/` entries that touch the area: a design that
   contradicts a recorded decision is the highest-value finding.

3. **Assess against each loaded entry**, in this order:
   - **Decisions** — does this contradict something already settled? If so, that's not
     automatically wrong, but it needs a new ADR rather than a silent divergence.
   - **Principles** — does it violate one? Check the principle's *when it doesn't apply*
     section before calling it a violation.
   - **Patterns** — is there a recorded pattern for this problem? Is this a reasonable
     variant, or a reinvention that will hit the pattern's documented failure modes?
   - **Practices** — process gaps: missing tests, no migration path, no rollback.

4. **Report.** For each finding:
   - what the design does
   - which entry it diverges from, by title and id
   - the concrete consequence — a failure mode, not a style objection
   - severity: **blocking** (contradicts a stable decision or principle with no stated
     exception) / **worth discussing** / **note**

5. **Report gaps too.** If the design raises a question the KB has no answer for, say so and
   offer to draft an entry. That is how the KB grows.

## Rules

- **No style-guide findings.** Formatting and naming are a linter's job.
- **Every finding names a consequence.** "Doesn't follow the pattern" is not a finding;
  "the publish can be lost if the process dies between commit and publish" is.
- **Divergence is not automatically wrong.** Say when the design's context is one the entry
  explicitly excludes.
- **Don't invent standards.** If a criticism isn't backed by a KB entry, label it as your
  own opinion, clearly separated from the KB-backed findings.
- Lead with the blocking findings. If there are none, say so plainly in the first line.
