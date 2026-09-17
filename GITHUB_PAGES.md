# KnowledgePilot on GitHub Pages

The `frontend` folder is now a self-contained React/Vite demo that can be hosted as a static GitHub Pages site. It does not require Firebase, a Python server, or environment variables to load and demonstrate the workspace.

## Deploy with GitHub Actions

1. Push this repository to GitHub with the default branch named `main`.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push a commit or run **Deploy KnowledgePilot to GitHub Pages** from the Actions tab.
4. GitHub will publish the generated `frontend/dist` folder.

The workflow is located at `.github/workflows/deploy-pages.yml`.

## Run locally

```bash
cd frontend
npm ci
npm run dev
```

For a production preview:

```bash
npm run build
npm run preview
```

## What works in static mode

The site includes the dashboard, AI workspace with cited demo responses, document manager with upload interaction, reports view, evaluation dashboard, responsive navigation, and mobile layouts. The AI response is intentionally local demo content because GitHub Pages cannot run the FastAPI/Qdrant backend. To connect the original backend later, replace the local `runQuery` handler in `frontend/src/App.jsx` with a browser-safe API call hosted separately.
