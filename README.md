# Vela Works

> A full-stack team collaboration and task management application — [vela.works](https://vela.works)

![Next.js](https://img.shields.io/badge/Next.js-16.0.7-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Storage-green?style=flat&logo=supabase)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat&logo=prisma)

## Features

### Task Management
- **Personal & Team Tasks** with due dates, priorities, status tracking, and categories
- **Kanban Board** with drag-and-drop reordering via `@dnd-kit`
- **Calendar View** for visualizing deadlines
- **Analytics Dashboard** with charts (Recharts)
- **Subtasks & Comments** on individual tasks
- **File Attachments** via Supabase Storage
- **Markdown Notes** with live preview
- **Labels** for task categorization

### Team Collaboration
- **Create & Manage Teams** with role-based access (Owner, Admin, Member)
- **Team Invitations** via email with accept/decline flow
- **Team Task Assignment** and delegation
- **Real-time Updates** via Supabase Realtime subscriptions
- **Inbox** with live notification panel

### Authentication & User Management
- **Supabase Auth** — email/password + OAuth
- **User Profiles** with avatar upload to Supabase Storage
- **Password Management** with reset via email
- **Account Deletion** with team ownership transfer
- **Admin Panel** for managing all users, teams, and tasks

### Security
- **Row-Level Security (RLS)** on all tables
- **Edge auth proxy** (`proxy.ts`) guarding `/dashboard/*` and `/admin/*`
- **Content Security Policy** headers via `next.config.ts`
- **Zod validation** on all API inputs
- **Prisma singleton** pattern to prevent connection pool exhaustion

## Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | CSS Modules + global CSS variables (no Tailwind in dashboard) |
| **Animations** | Framer Motion |
| **Drag & Drop** | @dnd-kit |
| **Icons** | Phosphor Icons |
| **Charts** | Recharts |
| **Database** | PostgreSQL via Supabase |
| **ORM** | Prisma 6 |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Validation** | Zod |
| **Date Utils** | date-fns |
| **Deployment** | Vercel |

## Project Structure

```
task-manager/
├── app/
│   ├── api/                          # API Route handlers
│   │   ├── admin/                   # Admin-only endpoints
│   │   ├── attachments/             # File attachment CRUD
│   │   ├── teams/                   # Team management
│   │   ├── upload/                  # File upload
│   │   └── user/                    # User management
│   ├── auth/                         # Auth pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── callback/
│   ├── admin/                        # Admin dashboard
│   ├── dashboard/                    # Main dashboard (all pages)
│   │   ├── analytics/
│   │   ├── calendar/
│   │   ├── kanban/
│   │   ├── notes/
│   │   ├── settings/
│   │   ├── tasks/
│   │   │   └── [taskId]/
│   │   ├── teams/
│   │   ├── layout.tsx               # Session guard + sidebar + header
│   │   └── dashboard.module.css     # All dashboard styles
│   ├── layout.tsx                    # Root layout (ThemeProvider)
│   └── page.tsx                      # Landing page
├── components/
│   ├── dashboard-v2/                 # Active dashboard component library
│   │   ├── Settings/
│   │   ├── teams/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TaskActionModal.tsx
│   │   ├── TaskDetail.tsx
│   │   ├── KanbanBoard.tsx
│   │   ├── Calendar.tsx
│   │   ├── InboxPanel.tsx
│   │   └── ...
│   ├── ui/                           # shadcn/ui shared components
│   ├── Navbar.tsx                    # Landing page navbar
│   ├── Footer.tsx                    # Landing page footer
│   └── ThemeProvider.tsx
├── hooks/                            # Custom React hooks
│   ├── useRealtimeTasks.ts
│   ├── useRealtimeInvites.ts
│   ├── useDueReminders.ts
│   └── useKeyboardShortcuts.ts
├── lib/
│   ├── supabaseClient.ts            # Browser Supabase client
│   ├── supabaseServer.ts            # Server Supabase client
│   ├── prisma.ts                    # Prisma singleton
│   ├── adminAuth.ts                 # Admin auth helper
│   ├── validations.ts               # Zod schemas
│   ├── queries/                     # Data-fetching helpers
│   └── mutations/                   # Data-mutation helpers
├── types/
│   └── task.ts                      # Shared TypeScript types
├── prisma/
│   └── schema.prisma                # Database schema
├── proxy.ts                          # Edge auth middleware
└── next.config.ts                    # Security headers + config
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 1. Clone & install

```bash
git clone https://github.com/1curafu/Task-Manager.git
cd Task-Manager/task-manager
npm install
```

### 2. Environment variables

Create a `.env` file inside `task-manager/`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Pooled connection (runtime)
DATABASE_URL="postgresql://postgres.xxx:password@pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct connection (migrations)
DIRECT_URL="postgresql://postgres.xxx:password@pooler.supabase.com:5432/postgres"

# Comma-separated list of admin emails
ADMIN_EMAILS="admin@example.com"
```

Find these values in your Supabase dashboard under **Project Settings → API** and **Project Settings → Database**.

### 3. Database setup

```bash
npx prisma generate
npx prisma db push
```

Then run the RLS and SQL setup scripts from `prisma/` in the Supabase SQL Editor.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev       # Development server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint

npx prisma studio          # Visual DB browser
npx prisma db push         # Push schema changes (dev)
npx prisma migrate deploy  # Apply migrations (prod)
npx prisma generate        # Regenerate Prisma client
```

## API Routes

### User
```
POST   /api/user/update              # Update profile / avatar / password
DELETE /api/user/delete              # Delete account
POST   /api/user/update-onboarding   # Mark onboarding complete
```

### Teams
```
POST   /api/teams/invite/accept      # Accept team invitation
POST   /api/teams/invite/decline     # Decline team invitation
POST   /api/teams/leave              # Leave a team
DELETE /api/teams/delete             # Delete a team (owner only)
```

### Attachments
```
GET    /api/attachments              # List task attachments
POST   /api/attachments/upload       # Upload file
GET    /api/attachments/[id]/url     # Get signed download URL
DELETE /api/attachments/[id]         # Delete attachment
```

### Admin (admin-only)
```
GET    /api/admin/users              # List all users
PUT    /api/admin/users              # Toggle admin role
DELETE /api/admin/users              # Delete user
GET    /api/admin/teams              # List all teams
DELETE /api/admin/teams              # Delete team
GET    /api/admin/tasks              # List all tasks
DELETE /api/admin/tasks              # Delete task
```

## Database Schema

Core models: `Task`, `Subtask`, `TaskComment`, `TaskLabel`, `Label`, `Note`, `Notification`, `Team`, `TeamMember`, `Profile`, `Attachment`.

All tables use UUID primary keys and RLS enforced in Supabase.

## Security

- **Edge proxy** (`proxy.ts`) — unauthenticated requests to `/dashboard/*` and `/admin/*` are redirected to `/auth/login` before any page code runs
- **RLS** — every table has row-level security policies; users can only access their own data and team data they're a member of
- **CSP** — `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` headers on all responses
- **Service role key** — used only in API route handlers, never in client components
- **Zod** — all API inputs are validated before hitting the database

## Deployment

The app deploys to [Vercel](https://vercel.com). Add all environment variables from step 2 in **Vercel → Settings → Environment Variables**, then add your Vercel domain to Supabase's allowed redirect URLs:

```
https://your-app.vercel.app/auth/callback
https://your-app.vercel.app/auth/login
```

## License

GNU General Public License v3.0 — see [LICENSE](LICENSE) for details.

## Author

**Mykhailo Khimich** · [@1curafu](https://github.com/1curafu)
