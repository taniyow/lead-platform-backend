# Lead Distribution Platform — Backend

Express + TypeScript + Prisma (MySQL) API for the lead distribution platform.

> Status: work in progress. Full setup, deployment, and testing documentation will be
> completed alongside the final submission.

## Stack

- Node.js + Express (TypeScript)
- Prisma ORM + MySQL
- Zod for server-side validation
- JWT auth (HttpOnly cookie)
- Vitest for tests

## Quick start (development)

```bash
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

The API listens on `http://127.0.0.1:4001` by default. Health check: `GET /api/health`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with live reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run unit tests |
