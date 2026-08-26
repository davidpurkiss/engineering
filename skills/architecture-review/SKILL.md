---
name: architecture-review
description: Review a design, RFC, pull request or diff against the engineering knowledge base — checking it against recorded principles and decisions, and against the machine-readable architecture specs, reporting each divergence with the rule id and severity it violates. Use when asked to review an architecture, sanity-check a design, or assess whether a change fits the established conventions.
allowed-tools: Read, Grep, Glob, Bash
---

# Architecture review

Review the thing in front of you against the knowledge base. Every finding must trace to
something recorded — a rule id, a decision, a principle, or a documented failure mode — or be
labelled plainly as your own opinion.

## Steps

1. **Establish what is under review.** A design doc, an RFC, a diff (`git diff`), a directory,
   or a proposal in the conversation. Ask if it is ambiguous — reviewing the wrong artefact
   wastes everyone's time.

2. **Find the applicable architecture.** Read
   `${CLAUDE_PLUGIN_ROOT}/index/SPECS.md`. Match the work against each architecture's
   **applies when** line. If one matches, load:
   - `specs/architectures/<id>.json` — layers, options, incompatible pairs
   - `specs/layers/<id>.json` for each layer it composes — responsibilities, restrictions,
     `dependencies.cannotImport`
   - the prose entry linked under *Judgement* — trade-offs and failure modes

   If no architecture matches, say so and review against principles and decisions alone. Do
   not stretch an architecture to fit; a gap is useful information.

3. **Load the judgement tier.** Read `${CLAUDE_PLUGIN_ROOT}/index/INDEX.md` and pull the
   principles and decisions that touch the area. A design contradicting a recorded decision
   is the highest-value finding you can make.

4. **Assess, in this order.**

   1. **Enforceable rules first.** Any rule with a `check` of kind `import-boundary` is a
      matter of fact, not taste: inspect the imports and see. Do not soften these into
      suggestions.
   2. **Remaining rules from the architecture's rulesets.** Match each against the design.
      Skip rules whose `scope` is a layer the design does not have.
   3. **Layer restrictions.** For each layer, check the design against its `restrictions` and
      `cannotImport` lists.
   4. **Decisions.** Does this contradict a settled ADR? That needs a new ADR, not a silent
      divergence.
   5. **Principles.** Check the principle's *when it doesn't apply* section before calling
      anything a violation.
   6. **Documented failure modes.** The prose entry lists how this shape fails in production.
      Does the design walk into one?

5. **Report.** For each finding:
   - what the design does
   - the **rule id** it violates, or the entry title and id if there is no rule
   - the **severity from the rule** — `error`, `warning`, `info`. Do not invent a severity;
     if the finding has no rule, it has no severity, and you say so.
   - the concrete consequence — a failure mode, not a style objection

   Group as **Violations** (rules with `severity: error`), **Worth discussing** (`warning`,
   or a contradicted principle), and **Judgement** (your own view, no recorded backing).
   Lead with violations. If there are none, say so in the first line.

6. **Report gaps.** If the design raises a question nothing in the KB answers, say so and
   offer to draft an entry or a rule. That is how this grows.

## Rules

- **Cite or label.** Every finding either carries a rule id / entry id, or is explicitly
  marked as your own opinion in the Judgement section. Never present an unbacked view in the
  same voice as a recorded rule.
- **Severity comes from the spec.** You do not get to promote a `warning` to a `error` because
  it feels important, or demote one to be agreeable.
- **Every finding names a consequence.** "Does not follow the pattern" is not a finding. "The
  publish is lost if the process dies between commit and publish" is.
- **Divergence is not automatically wrong.** If the design's context is one the entry or
  principle explicitly excludes, say that, and do not raise it.
- **No style-guide findings.** Formatting and naming are a linter's job.
- **Do not invent rules.** If you think something should be a rule and it isn't, that belongs
  in the gaps section as a proposal, not in the findings as a violation.
