# Context Loading Strategy

Use the minimum context needed to solve the task.

## Read Order (always)

1. `AGENTS.md`
2. `.opencode/instructions/project.md`
3. `.opencode/instructions/context-loading.md`

## Task-Based Additions

- Architecture/refactor: add `.opencode/instructions/architecture.md` and `docs/implementation/architecture/overview.md`.
- UI or feature behavior: add the relevant module docs under `docs/implementation/modules/`.
- Tests and gates: add `.opencode/instructions/testing.md` and `.opencode/instructions/qa-gates.md`.
- Security/privacy: add `.opencode/instructions/security.md`.
- Performance: add `.opencode/instructions/performance.md`.
- Docs work: add `.opencode/rules/implementation-docs.md`.

## Avoid Loading by Default

- `docs/research/archive/**` (historical imports only; not executable spec)
- `docs/docusaurus/build/**`
- Generated outputs (`dist/**`, coverage reports)

## Source of Truth

For unresolved project decisions, read only relevant sections from `.opencode/instructions/socrates-spec.md`.
