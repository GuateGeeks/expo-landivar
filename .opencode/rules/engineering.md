# Engineering Rules (AI-First Repository)

This repository is optimized for predictable, high-quality work by both humans and AI agents.

## Development Model

- Trunk-based development.
- Keep `main` releasable.
- Prefer small, reversible pull requests.
- Use feature flags for incomplete behavior when needed.

## Definition of Done (AI-First)

A task is done only when all are true:

1. Behavior is implemented and verified.
2. Relevant tests are added or updated.
3. Required gate command was executed (`gates:pr` minimum).
4. Documentation impacted by the change is updated.
5. Module boundaries remain valid.

## Testing and TDD

- Default to TDD for behavior changes.
- For bugs: reproduce with a failing test, then fix.
- Assert user-observable outcomes, not internals.

## TypeScript and React

- Keep strict typing; avoid `any` unless unavoidable and justified.
- Prefer function components and explicit module exports.
- Keep state minimal and colocated.
- Accessibility is required by default.

## Dependency Policy

- Do not add dependencies without a clear justification:
  - Bundle impact
  - Security posture
  - Maintenance risk
- Prefer platform or existing tooling first.

## Security and Secrets

- Never store secrets in repo or frontend runtime config.
- Avoid localStorage token persistence.

## Commit and Release Semantics

- Commit messages: Conventional Commits.
- Release semantics: SemVer.

## Tooling Discipline

- `npm run build` is production readiness baseline.
- Keep config explicit and minimal.
- Avoid hidden magic that reduces agent determinism.
