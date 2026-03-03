# GuateGeeks Expo Landivar

Frontend showcase for AR and MediaPipe vision demos. Built with Vite MPA +
React, optimized for mobile-first expo usage.

## Local development

```bash
npm install
npm run dev
```

## Build and quality gates

```bash
npm run gates:pr
```

## GitHub Pages deployment

The frontend deploys to GitHub Pages via GitHub Actions.

- Live site: `https://guategeeks.github.io/expo-landivar/`
- Workflow: `.github/workflows/deploy.yml`

### Notes

- Only the frontend (`dist/`) is deployed.
- The signaling server (`server/signaling.ts`) runs locally for the Control
  Center WebRTC demo.
