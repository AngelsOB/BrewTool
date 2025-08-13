# Beer App

React + Vite + TypeScript + Tailwind (v4) + GitHub Pages.

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

1. Push the repo to GitHub (default branch `main`).
2. In GitHub → Settings → Pages, set Source: GitHub Actions.
3. On pushes to `main`, the workflow `.github/workflows/deploy.yml` builds and deploys.
4. Your site: `https://<your-user>.github.io/<repo>/`.

Notes

- Vite `base` is set from `GITHUB_REPOSITORY` in CI to `/<repo>/`.
- SPA fallback is added (`dist/404.html`) for client routing.
