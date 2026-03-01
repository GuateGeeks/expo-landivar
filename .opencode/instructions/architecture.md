# Architecture Guidelines

## Module Topology

- `src/app/` composes application-level concerns.
- `src/modules/<domain>/` owns domain behavior.
- `src/shared/` contains reusable, domain-agnostic utilities/components.
- `src/infrastructure/` contains technical adapters and integration seams.
- `src/ai/` isolates AI contracts and providers.

## Dependency Rules

- No direct module-to-module imports.
- Domain modules can import only from `src/shared/*` and `src/infrastructure/*`.
- Expose module APIs through `index.ts`.

## Refactor Rules

- Keep changes incremental and backward-safe.
- Add or update tests before behavioral refactors.
- Update implementation docs with file pointers after boundary changes.
