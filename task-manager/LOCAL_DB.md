# Local Database Guide (Supabase)

This project uses a local Supabase instance for development. This ensures you can work offline and test dangerous operations without affecting production.

## 🚀 Quick Start

### Start the Database

```bash
npx supabase start
```

This spins up Docker containers for Postgres, Auth, Storage, Realtime, etc.

### Stop the Database

```bash
npx supabase stop
```

This stops the containers but **preserves your data**.

### Reset Database (⚠️ Destructive)

```bash
npx supabase db reset
```

This **wipes all data**, re-applies migrations, and runs the seed script. Use this to get a fresh start.

---

## 🛠️ Tools & Access

### Supabase Studio (Dashboard)

Access the local dashboard to view tables, auth users, and storage:
👉 **[http://127.0.0.1:54323](http://127.0.0.1:54323)**

### API & Database URLs

These are automatically configured in your `.env.local` when you run `supabase start`.

- **API URL:** `http://127.0.0.1:54321`
- **DB URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

## 🔒 Security (RLS)

Row Level Security (RLS) is **ENABLED** locally to match production.

- Users can only see their own data.
- If you need to bypass RLS for admin tasks, use the `service_role` key (but be careful!).

