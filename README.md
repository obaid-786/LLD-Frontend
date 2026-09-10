# LLD Practice Platform (frontend)

React + Vite app: pick an LLD problem, submit a text design, and read rubric feedback.

## Run locally

```poershell
npm install
npm run dev
```

Open http://localhost:5173. API calls go to `/api` and Vite proxies them to the backend (`https://correlation-quad-klein-overall.trycloudflare.com`). Copy `.env.example` to `.env` if needed (`VITE_API_BASE_URL=/api`).

No login — a `learner_id` is stored in `localStorage`.

## E2E (Cypress)

Start the app, then in another terminal:

```bash
npm run e2e
```

The spec stubs `/api` with `cy.intercept`, so it does not need a live backend. Use `npm run cypress:open` for the Cypress UI.
