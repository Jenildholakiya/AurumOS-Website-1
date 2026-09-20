# AurumOS Admin Panel

License management portal for AurumOS Jewelry ERP.

## Stack
- Next.js 14 (App Router)
- Vercel Postgres (database)
- JWT sessions (no third-party auth)
- Tailwind CSS + DM Serif / DM Sans fonts

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.local.example .env.local

# 3. Run development server
npm run dev
```

Open http://localhost:3000 — redirects to /login

## Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add Postgres database
# Vercel Dashboard → Storage → Create Database → Postgres
# Then: Settings → Environment Variables → paste from .env.local

# 4. Redeploy after adding env vars
vercel --prod
```

## Environment Variables

| Variable         | Description                              |
|-----------------|------------------------------------------|
| POSTGRES_URL     | From Vercel Postgres dashboard           |
| ADMIN_PASSWORD   | Your admin login password                |
| JWT_SECRET       | 64-char random hex string                |
| NEXT_PUBLIC_APP_URL | Your Vercel deployment URL            |

## API Endpoints

| Method | Path              | Auth     | Description                   |
|--------|-------------------|----------|-------------------------------|
| POST   | /api/auth         | None     | Login with admin password     |
| DELETE | /api/auth         | Cookie   | Logout                        |
| GET    | /api/licenses     | Cookie   | Get all licenses              |
| POST   | /api/licenses     | Cookie   | Create new license            |
| PATCH  | /api/licenses/:id | Cookie   | Update license status         |
| DELETE | /api/licenses/:id | Cookie   | Delete license                |
| POST   | /api/check        | **None** | AurumOS startup check (public)|

## AurumOS Integration

In `updater.py` or `main.py`, on startup:

```python
import urllib.request, json

def check_online_license(key: str, machine_id: str) -> dict:
    try:
        data = json.dumps({"key": key, "machine_id": machine_id}).encode()
        req  = urllib.request.Request(
            "https://your-app.vercel.app/api/check",
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=6) as res:
            return json.loads(res.read())
    except Exception as e:
        print(f"[LICENSE] Online check failed: {e}")
        return {"valid": True, "status": "offline"}  # allow offline
```
