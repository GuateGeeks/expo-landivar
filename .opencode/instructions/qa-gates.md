# QA Gates

## PR Gate

Run before merging typical development tasks:

- `npm run gates:pr`

This includes lint, typecheck, unit tests, app build, and docs build.

## Full Gate

Run for release, nightly, or high-risk changes:

- `npm run gates:full`

This adds Playwright smoke, Playwright a11y, and dependency audit.

## Failure Policy

- Stop forward work when a gate fails.
- Fix root cause with minimal reversible changes.
- Re-run the failed gate and report outcomes.
