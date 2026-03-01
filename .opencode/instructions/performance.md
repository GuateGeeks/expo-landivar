# Performance Guidance

## Product Context

Users may experience weak connections and low-end devices.

## Defaults

- Prefer route/code splitting for non-critical code.
- Avoid heavy dependencies unless justified.
- Minimize runtime work on initial route.

## Verification

- Check `npm run build` output for chunk growth.
- Document notable bundle/performance impact when introducing dependencies.
