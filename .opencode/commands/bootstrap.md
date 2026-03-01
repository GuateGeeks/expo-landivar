---
description: Bootstrap repo for AI-first work and run PR gates
agent: builder
---

Goal: prepare or repair baseline tooling and keep changes small.

Steps:

1. Read `AGENTS.md`, `.opencode/instructions/context-loading.md`, and relevant sections of `.opencode/instructions/socrates-spec.md`.
2. Ensure scripts and configuration required by `npm run gates:pr` exist.
3. Apply minimal fixes for missing or broken setup.
4. Run `npm run gates:pr`.

Finish with:

- Commands executed
- Files changed
- Remaining risks or TODOs
