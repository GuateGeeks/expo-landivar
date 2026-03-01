# Testing Guidelines

## Default Strategy

Use TDD for behavior changes: red -> green -> refactor.

## Unit and Integration

- Framework: Vitest + Testing Library.
- Test observable behavior, not implementation internals.
- Mock at boundaries (network/time/storage).

## Browser-Level Checks

- Playwright smoke tests cover critical route availability.
- Playwright + axe checks baseline accessibility.

## Determinism Requirements

- No real network calls in tests.
- Keep tests parallel-safe and stable.
- Fix flaky behavior before adding more tests.

## Verification Targets

- For PR-ready work: run `npm run gates:pr`.
- For release-ready validation: run `npm run gates:full` in CI-capable environments.
