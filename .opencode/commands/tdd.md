---
description: Implement a change using strict TDD
agent: builder
---

Apply strict TDD (red -> green -> refactor) for:

$ARGUMENTS

Rules:

- Write/identify a failing behavior test first.
- Implement minimum code to pass.
- Refactor without changing behavior.
- Run the smallest relevant test scope, then `npm run gates:pr` if the change is substantial.

Return:

- Failing test introduced/updated
- Implementation summary
- Verification commands and outcomes
