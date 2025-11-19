# 📋 Task Manager

> A modern, collaborative task management application built with Next.js 16, Supabase, and Prisma.

![Next.js](https://img.shields.io/badge/Next.js-16.0.1-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.0-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Storage-green?style=flat&logo=supabase)
![Prisma](https://img.shields.io/badge/Prisma-6.19.0-2D3748?style=flat&logo=prisma)

## ✨ Features

### 🔐 Authentication & User Management

- **Secure Authentication** with Supabase Auth
- **User Profiles** with customizable avatars
- **Password Management** with strength validation
- **Account Deletion** with team ownership transfer
- **Admin Panel** for user and team management

### 📊 Task Management

- **Personal Tasks** with due dates and categories
- **Team Task Assignment** for collaborative work
- **Task Completion Tracking** with status updates
- **Notes & Links** attached to tasks
- **Calendar View** for visualizing deadlines
- **Inbox Panel** for quick task overview

### 👥 Team Collaboration

- **Create & Manage Teams** with role-based access
- **Team Invitations** via email
- **Role Management** (Owner, Admin, Member)
- **Team Task Delegation** by owners/admins
- **Real-time Notifications** for team activities

### 📝 Additional Features

- **Notes System** for personal note-taking
- **Notifications** with real-time updates
- **Avatar Upload** to Supabase Storage
- **Responsive Design** with modern white theme
- **Row-Level Security (RLS)** for data protection

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Client (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │Dashboard │  │  Teams   │  │  Admin   │  │  Auth   │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ User Routes │  │ Task Routes │  │  Admin Routes   │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Supabase Backend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │  PostgreSQL   │  │   Storage    │  │
│  │  (Users)     │  │  (Database)   │  │  (Avatars)   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Tech Stack

| Category             | Technology                  |
| -------------------- | --------------------------- |
| **Framework**  | Next.js 16.0.1 (App Router) |
| **Language**   | TypeScript 5                |
| **UI Library** | React 19.2.0                |
| **Styling**    | CSS                         |
| **Database**   | PostgreSQL (via Supabase)   |
| **ORM**        | Prisma 6.19.0               |
| **Auth**       | Supabase Auth               |
| **Storage**    | Supabase Storage            |
| **Validation** | Zod 4.1.12                  |
| **Date Utils** | date-fns 4.1.0              |
| **Deployment** | Vercel                      |

## 📁 Project Structure

```
task-manager/
├── app/
│   ├── api/                      # API Routes
│   │   ├── admin/               # Admin endpoints
│   │   ├── tasks/               # Task CRUD
│   │   └── user/                # User management
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── admin/                    # Admin dashboard
│   ├── dashboard/                # Main dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── CalendarView.tsx
│   ├── InboxPanel.tsx
│   ├── TeamsPanel.tsx
│   ├── ProfileModal.tsx
│   └── ...
├── lib/                          # Utilities
│   ├── supabaseClient.ts        # Browser client
│   ├── supabaseServer.ts        # Server client
│   ├── prisma.ts                # Prisma client
│   └── validations.ts           # Zod schemas
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── sql/                     # SQL migrations
│   └── COMPLETE_SETUP.sql       # Full setup script
├── public/                       # Static assets
├── .env.example                  # Environment template
├── next.config.ts               # Next.js config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Supabase Account** ([sign up here](https://supabase.com))
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/1curafu/Task-Manager.git
cd task-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database Configuration (from Supabase)
DATABASE_URL="postgresql://postgres.xxx:password@aws-x-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@aws-x-region.pooler.supabase.com:5432/postgres"

# Admin Configuration
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
ADMIN_EMAILS="admin1@example.com,admin2@example.com"
```

**Where to find these values:**

- Go to your [Supabase Dashboard](https://app.supabase.com)
- **Project Settings** → **API** for URLs and keys
- **Project Settings** → **Database** for connection strings

### 4. Database Setup

Run the complete database setup script (see [`DATABASE.md`](./DATABASE.md) for details):

```bash
# 1. Set up Prisma
npx prisma generate
npx prisma db push

# 2. Run database setup in Supabase SQL Editor
# Copy and execute the contents of prisma/COMPLETE_SETUP.sql
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

### 5. Set up the database

⚠️ **Important:** Follow the complete database setup guide:

```bash
# See DATABASE_SETUP.md for detailed instructions
```

Quick steps:

1. Run Prisma migrations: `npx prisma migrate deploy`
2. Run `prisma/fix-uuid-defaults.sql` in Supabase SQL Editor
3. Run `prisma/enable-rls.sql` in Supabase SQL Editor

**📖 [Full Database Setup Guide](./DATABASE_SETUP.md)**

### 6. Generate Prisma Client

```bash
npx prisma generate
```

## 🗄️ Database Schema

### Core Tables

#### **Task**

```typescript
{
  id: string (UUID)
  name: string
  dueDate: DateTime
  responsible: string?
  category: string?
  notes: string?
  links: string?
  userId: string          // Task owner
  teamId: string?         // Optional team assignment
  assignedToId: string?   // Assigned user
  createdById: string?    // Task creator
  completed: boolean
  createdAt: DateTime
  lastUpdated: DateTime
}
```

#### **Team**

```typescript
{
  id: string (UUID)
  name: string
  description: string?
  ownerId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### **TeamMember**

```typescript
{
  id: string (UUID)
  teamId: string
  userId: string?
  userEmail: string
  role: 'owner' | 'admin' | 'member'
  status: 'pending' | 'accepted' | 'declined'
  invitedBy: string
  invitedAt: DateTime
  respondedAt: DateTime?
}
```

#### **Profile**

```typescript
{
  id: string (UUID)
  userId: string (unique)
  name: string?
  avatar: string?         // Supabase Storage URL
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### **Note**

```typescript
{
  id: string (UUID)
  content: string
  userId: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

#### **Notification**

```typescript
{
  id: string (UUID)
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string?
  createdAt: DateTime
}
```

See [`DATABASE.md`](./DATABASE.md) for complete RLS policies and setup instructions.

## 🔒 Security Features

### Row-Level Security (RLS)

All tables use Supabase RLS policies:

- **Tasks**: Users see only their own tasks and team tasks they have access to
- **Teams**: Members can view team info, owners/admins can manage
- **Profiles**: Public read, users update own profile, admins have full access
- **Notifications**: Users see only their own notifications
- **Notes**: Users manage only their own notes

### Authentication

- **Secure password hashing** via Supabase Auth
- **Email verification** for new accounts
- **Password reset** with email tokens
- **Session management** with HTTP-only cookies

### Admin System

- **Role-based access control** via `is_admin()` function
- **Admin panel** restricted to authorized users
- **Audit trails** for admin actions

## 🎨 UI/UX

### Design System

- **White Theme** - Clean, modern interface
- **Responsive Layout** - Works on mobile, tablet, desktop
- **Smooth Animations** - CSS transitions and keyframes
- **Accessibility** - WCAG compliant color contrasts

### Components

- **Modals** - Profile settings, team invites, confirmations
- **Panels** - Inbox, Teams, Notes with collapsible sections
- **Calendar** - Visual task timeline
- **Forms** - Validated inputs with real-time feedback

## 📡 API Routes

### User Management

```
POST   /api/user/update       # Update profile, avatar, password
DELETE /api/user/delete       # Delete account with team transfer
```

### Admin

```
GET    /api/admin/users       # List all users (admin only)
GET    /api/admin/teams       # List all teams (admin only)
GET    /api/admin/tasks       # List all tasks (admin only)
```

### Tasks

```
GET    /api/tasks             # Fetch user's tasks
POST   /api/tasks             # Create new task
PUT    /api/tasks/:id         # Update task
DELETE /api/tasks/:id         # Delete task
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy](https://img.shields.io/badge/▲_Deploy-black?style=for-the-badge)](https://task-manager-pi-weld.vercel.app)

#### Manual Deployment

1. **Push to GitHub**

   ```bash
   git push origin main
   ```
2. **Import to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables (same as `.env`)
3. **Configure Supabase**

   - Add Vercel domain to Supabase redirect URLs:

   ```
   https://your-app.vercel.app/auth/login
   https://your-app.vercel.app/auth/callback
   https://your-app.vercel.app/dashboard
   ```
4. **Deploy**

   - Click "Deploy"
   - Wait for build to complete

### Environment Variables in Vercel

Add these in **Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_EMAILS`

## 🧪 Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mykhailo Chupryna**

- GitHub: [@1curafu](https://github.com/1curafu)
- Repository: [Task-Manager](https://github.com/1curafu/Task-Manager)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Supabase](https://supabase.com/) for backend infrastructure
- [Prisma](https://www.prisma.io/) for database tooling
- [Vercel](https://vercel.com/) for deployment platform

## 📞 Support

For questions or issues:

- Open an [Issue](https://github.com/1curafu/Task-Manager/issues)
- Check existing [Discussions](https://github.com/1curafu/Task-Manager/discussions)
