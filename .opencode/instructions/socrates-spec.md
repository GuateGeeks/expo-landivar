# Socrates Web Consolidated Spec

## Context

- Country focus: Guatemala.
- Target users work on mobile devices and unstable networks.
- Accessibility is a baseline requirement, not a backlog item.

## Architecture

- Modular monolith by domain.
- Main folders:
  - `src/app/`: app entry, providers, shell, router.
  - `src/modules/<domain>/`: domain slices.
  - `src/shared/`: cross-module reusable primitives.
  - `src/infrastructure/`: technical adapters and cross-cutting services.
  - `src/ai/`: AI boundary contracts/adapters.

Boundary rules:

- Modules must not import from other modules directly.
- Modules may depend on `src/shared/*` and `src/infrastructure/*`.
- Module public surface is `src/modules/<domain>/index.ts`.

## Current MVP Frontend Scope

- App shell, navigation, and route boundaries.
- Dashboard, Curriculum, and Planner routes (currently placeholder behavior).
- AI-ready boundary reserved in `src/ai/`.

## Tooling Expectations

- TypeScript strict mode.
- ESLint flat config.
- Vitest + Testing Library for unit/integration.
- Playwright smoke and accessibility checks.

## Quality Gates

- PR gate (`npm run gates:pr`): lint, typecheck, unit tests, app build, docs build.
- Full gate (`npm run gates:full`): PR gate plus Playwright smoke, Playwright a11y, dependency audit.

If a required script is missing, add it with minimal scope and rerun gates.

## Performance Defaults

- Prefer route-level code splitting.
- Keep dependency surface small.
- Verify changes against build output before finishing.

## Security Defaults

- Never put secrets in `VITE_*`.
- Keep authentication token storage out of browser local storage.
- Validate and sanitize at system boundaries.

## Delivery Defaults

- Conventional Commits for message format.
- SemVer for release semantics.
- Trunk-based workflow with short-lived branches and small PRs.
