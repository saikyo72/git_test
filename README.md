# Auth App

A simple, full-stack authentication app: React (Vite) frontend + Express/SQLite
backend, using JWTs stored in an HttpOnly cookie.

## Project structure

```
auth-app/
  backend/     Express API (auth, JWT, SQLite via better-sqlite3)
  frontend/    React app (Vite, React Router, plain CSS)
```

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit JWT_SECRET to a random string
npm run dev             # starts on http://localhost:3000
```

The SQLite database file (`models/database.sqlite`) is created automatically
on first run — no manual setup needed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser. The frontend is configured to
talk to the backend at `http://localhost:3000/api` (see
`frontend/src/services/api.js`).

## How authentication works

1. **Sign up** (`POST /api/auth/register`) — validates input, hashes the
   password with bcrypt, stores the user in SQLite, then signs a JWT and
   sets it as an HttpOnly cookie. The frontend immediately treats the user
   as logged in and redirects to the Dashboard.
2. **Sign in** (`POST /api/auth/login`) — verifies the email/password with
   bcrypt, then sets the same JWT cookie on success.
3. **Session check** (`GET /api/auth/me`) — on every page load, the
   frontend calls this to ask "is my cookie still valid?" This is how a
   page refresh doesn't log you out, and how `ProtectedRoute` knows whether
   to redirect an unauthenticated visitor away from the Dashboard.
4. **Sign out** (`POST /api/auth/logout`) — clears the cookie.

Because the JWT lives in an HttpOnly cookie (not localStorage), it can't be
read or stolen by client-side JavaScript, which is the main defense against
XSS-based token theft.

## Notes for production use

- Set a strong, random `JWT_SECRET` in `.env` — never commit `.env` itself.
- Set `NODE_ENV=production` so cookies are marked `secure` (HTTPS only).
- `CLIENT_ORIGIN` in `.env` and `API_BASE_URL` in
  `frontend/src/services/api.js` will need to point at your deployed
  domains instead of localhost.
