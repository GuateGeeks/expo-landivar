# Socrates Web Project Context

Socrates Web is a frontend for education workflows in Guatemala.

## Product Constraints

- Mobile-first UX.
- Variable network quality; optimize for low-bandwidth usage.
- Accessibility baseline: WCAG 2.1 AA.

## Delivery Constraints

- Trunk-based development.
- Changes must be small, verifiable, and reversible.
- Default workflow is TDD for behavior changes.

## Security Constraints

- No secrets in frontend source or `VITE_*` values.
- Avoid storing auth tokens in `localStorage`.
- Prefer HttpOnly cookie session models via backend/BFF.

## AI-First Collaboration

- Prefer explicit, deterministic instructions.
- Keep module boundaries enforceable for automated contributors.
- Keep docs current when behavior, boundaries, or gates change.
