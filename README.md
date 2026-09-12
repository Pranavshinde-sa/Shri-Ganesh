# Jay Hanuman Ganeshutsav Mandal, Ganeshanagar — Ledger

A simple app to track donations and expenses, kept as two separate
portfolios (Cash and Online). Built with React (Vite) + Tailwind CSS +
FastAPI + SQLite.

If a page ever fails to load with a blank screen, open the browser
console (F12 → Console) and check for a red error — an `ErrorBoundary`
catches component crashes and shows the actual error message instead
of a blank page.

## Access control

- **Anyone** can open the app and view the dashboard, donation list,
  and expense list, and export PDFs — read-only, no login needed.
- **Only the admin** (one account) can add or remove donations/expenses.
  Click "Admin login" in the top right to sign in.

Default admin login (change this — see below):
- Username: `admin`
- Password: `changeme123`

**To change the admin password:** copy `backend/.env.example` to
`backend/.env` and edit it:

```
ADMIN_USERNAME=your_username
ADMIN_PASSWORD=your_password
SECRET_KEY=some_long_random_string
```

Restart the backend after changing this file. `SECRET_KEY` is used to
sign login sessions — set it to any long random string (it doesn't need
to be memorable, just unique to you) so old sessions can't be forged.

## What it does

- Add a donation: donor name, amount, Cash or Online. (Admin only.)
- Add an expense: name, amount, and which portfolio (Cash/Online) it's
  deducted from — blocked if that portfolio doesn't have enough
  balance. (Admin only.)
- Dashboard shows, for each portfolio: total received, total spent,
  and balance left — plus combined totals across both, visible to
  everyone.
- Export the donation list or expense list as a PDF, anytime, for
  everyone.

## Project structure

```
donation-tracker/
  backend/     FastAPI app (SQLite database, admin auth, PDF export)
  frontend/    React app (Vite + Tailwind CSS)
```

## Running it locally

**1. Backend**

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This creates `donations.db` (SQLite) in the `backend/` folder automatically
and serves the API at http://localhost:8000. Open http://localhost:8000/docs
to see and try every endpoint.

**2. Frontend**

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — it talks to the backend at
`http://localhost:8000` by default.

## Deploying the frontend to Vercel (backend stays local for now)

1. Push this repo to GitHub.
2. In Vercel: New Project → import the repo → set **Root Directory** to
   `frontend`. Vercel auto-detects Vite (`npm run build`, output `dist`).
3. Since your backend runs on your own machine, a Vercel-hosted frontend
   can't reach `localhost:8000` over the internet. For now, this setup
   works best if you also just run the frontend locally (`npm run dev`)
   alongside the backend — the Vercel deployment is only useful once the
   backend is reachable from the internet too (see below).

## If you later want the backend online as well

FastAPI + SQLite doesn't fit Vercel's serverless model well (the
filesystem is wiped between requests, so SQLite data won't persist).
When you're ready to go fully online:

1. Deploy the backend to a host that keeps a process running, e.g.
   [Render](https://render.com) or [Railway](https://railway.app)
   (both have free tiers, and both work with FastAPI out of the box).
2. Switch to a hosted Postgres database (e.g. [Neon](https://neon.tech)
   or [Supabase](https://supabase.com), also free-tier) by setting a
   `DATABASE_URL` environment variable on that host —
   `database.py` already reads this and falls back to SQLite if unset.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SECRET_KEY` as
   environment variables on that host too (instead of a local `.env`
   file).
4. On Vercel, add an environment variable `VITE_API_URL` pointing at
   your deployed backend's URL, and redeploy the frontend.

No code changes are needed for this — it's all environment variables.

## Notes

- Deleting a donation or expense is permanent (no undo) — used it for
  correcting mistakes, e.g. a wrong amount entered.
- Amounts are shown in ₹ (INR) formatting; the numbers themselves are
  currency-agnostic if you ever need otherwise.
- Admin sessions last 12 hours, then you'll need to log in again.
