# Quick Start

## Prerequisites

- Node.js 20+ (repo pins Node 22 via `.nvmrc`)
- npm 10+

## Install

```bash
npm install
```

## Start Services

```bash
npm run dev
```

This starts both services concurrently:

| Service  | URL                    |
|----------|------------------------|
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:3001   |

The frontend proxies `/api/*` requests to the backend automatically.

## Health Checks

Once running, verify everything is healthy:

**Backend liveness:**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","timestamp":"..."}`

**API health (includes uptime):**
```bash
curl http://localhost:3001/api/health
```
Expected: `{"status":"healthy","timestamp":"...","uptime":...}`

**API info:**
```bash
curl http://localhost:3001/api/info
```
Expected: `{"name":"Node Conf Starter API","version":"1.0.0","environment":"development"}`

**Frontend:** Open http://localhost:5173 in a browser. The "Backend Status" card should display **healthy**.

## Run Tests

```bash
npm test
```

This runs unit and component tests for both workspaces. All should pass without the dev servers running.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3001 in use | Set `PORT` in `server/.env` or kill the process on that port |
| Port 5173 in use | Vite will auto-increment to 5174 |
| `curl` not available (Windows) | Use `Invoke-WebRequest http://localhost:3001/health` in PowerShell, or open the URL in a browser |
| Node version mismatch | Run `nvm use` or install Node 22+ |
