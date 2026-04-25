# UTDDash Frontend

Next.js App Router frontend for the UTDDash marketplace.

## Requirements

- Node.js `>=20.9.0` (required by Next.js 16)
- Backend API running on `http://localhost:8000`

## Environment

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
cp .env.example .env.local
```

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Implemented Features

- Auth (register/login/logout) using HttpOnly cookie session bridge
- Protected dashboard, orders, messages, notifications, ratings, and profile routes
- Orders lifecycle:
	- Create request (buyer/both)
	- Accept request (provider/both)
	- Start delivery, mark arrived, QR token completion
- Realtime websocket updates for order and message events
- Notifications list with mark-read and mark-all-read
- Per-order chat
- Ratings submission and history
- Profile editing

## Architecture Notes

- Browser calls `app/api/*` route handlers, which proxy requests to backend.
- Auth token is stored in an HttpOnly cookie (`utddash_token`).
- Websocket connection is initialized through `/api/auth/ws-token`.
- Server state management uses TanStack Query.

## Quality Checks

```bash
npm run lint
npm run build
```

If build fails with Node version errors, upgrade Node to `>=20.9.0`.
