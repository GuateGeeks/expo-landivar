# Frontend Security Guidance

## Non-Negotiables

- Never commit secrets.
- Never place secrets in `VITE_*` variables.
- Avoid token storage in `localStorage`.

## Implementation Rules

- Prefer server-managed session controls (BFF + HttpOnly cookies).
- Avoid exposing sensitive data in client logs.
- Keep dependency footprint small and audited.

## Review Targets

- Secret exposure patterns.
- Unsafe auth/session handling.
- High-risk dependency findings from `npm audit`.
