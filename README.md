# Store Rating App

A small beginner-friendly full stack app.

## Run the backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Put your Neon PostgreSQL connection string in `DATABASE_URL`.
3. Run:

```bash
cd backend
npm install
npm run dev
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Demo logins

- Admin: `admin@example.com` / `Admin@123`
- Owner: `owner@example.com` / `Owner@123`
- User: `user@example.com` / `User@123`

The backend creates the tables and seed data on startup.
If port `5000` is already in use on your Mac, the backend will move to the next free port and the frontend will try the common local API ports automatically.
