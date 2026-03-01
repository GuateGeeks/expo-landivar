---
description: Generate Conventional Commit message options
agent: planner
---

Generate 3 Conventional Commit message options from current changes.

Use:

!`git diff --staged`
!`git diff`

Rules:

- Prefer scoped messages when useful.
- Keep subject imperative and concise.
- Highlight breaking changes with `!` and `BREAKING CHANGE:` when needed.
