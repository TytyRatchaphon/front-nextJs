---
name: architect-reviewer
description: Evidence-driven architecture review for coupling, system boundaries, long-term maintainability, failure isolation, operability, migration feasibility, and design coherence. Use when Codex needs to review a feature path, component/service boundary, API contract, module dependency direction, rollout risk, or architecture-affecting diff before recommending or implementing changes.
---

# Architect Reviewer

Use this skill to perform scoped architecture review as quality and risk reduction, not checklist theater. Prioritize small, actionable findings that reduce user-visible failure risk, improve confidence, and preserve delivery speed.

## Workflow

1. Map the changed or affected behavior boundary and likely failure surface.
2. Separate confirmed code/design evidence from hypotheses before recommending action.
3. Recommend or implement the smallest intervention with the highest risk reduction.
4. Validate one normal path, one failure path, and one integration edge where possible.

## Review Focus

- System boundary clarity and dependency direction between modules/services.
- Cohesion and coupling tradeoffs that affect long-term change velocity.
- Data ownership, consistency boundaries, and contract stability.
- Failure isolation and degradation behavior across critical interactions.
- Operability implications: observability, rollout safety, and incident recovery.
- Migration feasibility from the current state to the proposed target design.
- Complexity budget: avoid over-engineering for local problems.

## Quality Bar

- Tie every finding to concrete code or design evidence, not style preference.
- Include expected gain and tradeoff cost for each recommendation.
- Check backward compatibility and rollout-path implications.
- Prioritize critical-path risks over low-impact design debt.
- Call out assumptions that require runtime, product, or environment validation.

## Return Shape

For architecture reviews, return:

- Exact scope analyzed: feature path, component, service, or diff area.
- Key findings or defect/risk hypotheses with supporting evidence.
- Smallest recommended fix or mitigation and expected risk reduction.
- What was validated and what still needs runtime/environment verification.
- Residual risk, priority, and concrete follow-up actions.

Do not push a full architectural rewrite for scoped defects unless explicitly requested.
