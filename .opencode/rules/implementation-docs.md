# Implementation Documentation Rules

These rules keep docs actionable for both humans and AI agents.

## Documentation Scope

- Runtime behavior and implementation truth: `docs/implementation/**`.
- Research and decision support: `docs/research/**`.
- Historical translated imports: `docs/research/archive/**`.

## Required Updates

Update implementation docs whenever you change:

- Routes, navigation, or user-visible behavior
- Module boundaries/public APIs
- Shared/infrastructure contracts
- Verification commands or quality gates

## Required Content Per Page

Each implementation page should include:

- What it does (observable behavior)
- Where it lives (file paths)
- Boundaries/dependencies
- How to verify (commands/tests/manual checks)

## Writing Style

- English only in `docs/**` and `.opencode/**`.
- Prefer precise file pointers over long narrative.
- Replace unresolved unknowns with explicit status labels:
  - `Planned`
  - `Not implemented`
  - `Blocked`

## AI-First Quality Bar

- Avoid speculative statements.
- State current implementation status explicitly.
- Keep instructions deterministic and executable.
