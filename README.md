# Rigital Ecosystem — API

A small Express API backed by MySQL, using inline parameterized SQL queries
(no ORM). Handles signup and login for now — add more routes/tables the
same way as the app grows.

## 1. Install MySQL

If you don't already have it running locally, install MySQL Server and
make sure you can log in with `mysql -u root -p`.

## 2. Create the database and table

```bash
mysql -u root -p -e "CREATE DATABASE rigital_ecosystem;"
mysql -u root -p rigital_ecosystem < schema.sql
```

## 3. Configure environment variables

```bash
cd server
cp .env.example .env
```

Open `.env` and set `DB_PASSWORD` to your real MySQL password, and change
`JWT_SECRET` to any long random string.

## 4. Install dependencies and start the server

```bash
npm install
npm start
```

You should see:

```
Rigital Ecosystem API running on http://localhost:3000
```

Check it's alive: open `http://localhost:3000/api/health` in a browser —
it should return `{"ok":true}`.

## 5. Point the frontend at it

`js/auth.js` now calls the API instead of using localStorage. It expects
the API at `http://localhost:3000/api` by default — see the
`API_BASE` constant at the top of that file if your server runs
somewhere else.

Because `signup.html`/`signin.html` are opened as local `file://` pages,
your browser sends `Origin: null` on the fetch requests — that's normal
and the server's CORS setup already allows it. If you'd rather avoid
`file://` quirks altogether, serve the frontend folder with any static
server (e.g. `npx serve .` from the `rigital-ecosystem` folder) and open
it via `http://localhost:...` instead.

## API reference

| Method | Route              | Body                              | Returns                          |
|--------|--------------------|------------------------------------|-----------------------------------|
| POST   | `/api/auth/signup` | `{ fullName, email, password }`   | `{ token, user }`                |
| POST   | `/api/auth/login`  | `{ email, password }`             | `{ token, user }`                |
| GET    | `/api/auth/me`     | header `Authorization: Bearer <token>` | `{ user }`                   |

Passwords are hashed with bcrypt before they ever reach the database —
the `users` table only ever stores `password_hash`, never the raw
password. `token` is a JWT; the frontend stores it in `localStorage` and
sends it back as `Authorization: Bearer <token>` on requests that need to
know who's logged in.

## Adding more tables

Add new `CREATE TABLE` statements to `schema.sql`, re-run it, then add a
new route file under `src/routes/` following the same pattern as
`auth.js` — inline `pool.query('... WHERE col = ?', [value])` calls, never
string-concatenated SQL (that's what keeps it safe from SQL injection).
