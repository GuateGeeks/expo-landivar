---
description: Suggest SemVer bump from current diff
agent: planner
---

Determine release bump level (MAJOR/MINOR/PATCH) from current changes.

Use:

@AGENTS.md
!`git diff --stat`

Return:

- Suggested bump
- Why it fits SemVer
- Any release-note caveats for compatibility
