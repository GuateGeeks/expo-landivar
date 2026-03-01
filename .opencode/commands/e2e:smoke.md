---
description: Run Playwright smoke tests
agent: qa
---

Run:

!`npm run test:e2e:smoke`

If browser dependencies are missing, run:

!`npx playwright install chromium`

Then rerun smoke tests and report results.
