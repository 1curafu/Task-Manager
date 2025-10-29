# 📋 Task Manager

A modern task management web application built with Next.js 16, TypeScript, Prisma, and Supabase.

## 🚀 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** CSS
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Authentication:** Supabase Auth
- **Hosting:** Vercel

## 📁 Project Structure

```
task-manager/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Register page
│   ├── dashboard/         # Main dashboard
│   ├── api/               # API routes
│   │   └── tasks/         # Task CRUD operations
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── Clock.tsx         # Time display
│   ├── TaskCard.tsx      # Task card component
│   ├── TaskList.tsx      # Task table
│   ├── NotesPanel.tsx    # Notes section
│   └── CalendarView.tsx  # Calendar with tasks
├── lib/                   # Utility libraries
│   ├── prisma.ts         # Prisma client
│   ├── supabaseClient.ts # Supabase browser client
│   └── supabaseServer.ts # Supabase server client
└── prisma/               # Database schema and migrations
    ├── schema.prisma     # Database schema
    └── migrations/       # Migration files
```

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd task-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env` and `.env.local` files in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **Database** → **Connection string**
3. Copy your connection strings and update `.env` files

### 5. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 6. Generate Prisma Client

```bash
npx prisma generate
```

## 🛠️ Important Commands

### Development

```bash
# Start development server
npm run dev

# Open app in browser
# http://localhost:3000
```

### Database Management

```bash
# Run database migrations
npx prisma migrate dev

# Generate Prisma Client (after schema changes)
npx prisma generate

# Open Prisma Studio (Visual Database Editor)
npx prisma studio
# Opens at http://localhost:5555

# Push schema changes without migrations (development only)
npx prisma db push

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Prisma Studio

```bash
# Open visual database editor
npx prisma studio
```

Access at: **http://localhost:5555**

### Building & Production

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## 🌐 Online Database Management

### Supabase Dashboard

- **URL:** https://supabase.com/dashboard
- **Features:** Table Editor, SQL Editor, Authentication, Storage, Monitoring

### Prisma Studio (Local)

- **URL:** http://localhost:5555 (when running)
- **Command:** `npx prisma studio`
- **Features:** Visual data editor, CRUD operations

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🐛 Troubleshooting

### Can't connect to database

- Verify `.env` file has correct Supabase credentials
- Check Supabase project is running
- Ensure connection string uses `pooler.supabase.com`

### Migration errors

- Use `DIRECT_URL` for migrations (port 5432)
- Use `DATABASE_URL` with pgbouncer for app queries (port 6543)

## 📝 License

GNU General Public License v3.0 (GPL-3.0)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [LICENSE](LICENSE) file for details.
