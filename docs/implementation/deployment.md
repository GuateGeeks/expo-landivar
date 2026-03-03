# Deployment (GitHub Pages)

## What It Does

Builds the Vite multi-page frontend and deploys the static output to GitHub
Pages using a GitHub Actions workflow. Only the frontend is deployed; the
WebSocket signaling server remains local.

## Where It Lives

| File                           | Purpose                                                |
| ------------------------------ | ------------------------------------------------------ |
| `.github/workflows/deploy.yml` | Build + deploy to GitHub Pages                         |
| `vite.config.ts`               | `base` path for GitHub Pages (`/expo-landivar/` in CI) |

## Boundaries and Dependencies

- **Frontend only**: deploys `dist/` output.
- **Server excluded**: `server/` is not deployed.
- **Base path**: GitHub Pages uses `/expo-landivar/`.
- **Links**: Navigation uses `import.meta.env.BASE_URL` in React and `./` in
  standalone HTML pages.

## How to Verify

### Local build

```bash
npm run build
```

### GitHub Actions

1. Ensure the repo has Pages set to **Source: GitHub Actions**.
2. Push to `main` and verify the workflow completes.
3. Visit `https://guategeeks.github.io/expo-landivar/` and confirm the pages
   load and navigation works.
