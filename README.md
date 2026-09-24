# FindBuilders 🚀

> Discover and showcase exceptional products built by indie makers, developers, and creators.

FindBuilders is a modern, full-stack product discovery and community platform. Makers can showcase their projects, gain visibility, and connect with early adopters, while the community can discover emerging tools, upvote favorites, and provide feedback.

---

## 🏗️ Architecture Overview

The repository is structured as a modular monorepo containing three core applications and database infrastructure:

```
FIND BUILDERS/
├── frontend/             # Maker & user-facing web app (React + Vite + Tailwind CSS)
├── admin/                # Dedicated administration portal (React + Vite + Tailwind CSS)
├── backend/              # Node.js + Express + TypeScript API server (Emails, Admin ops)
├── supabase-schema.sql   # Complete PostgreSQL schema, RLS policies, triggers & functions
└── package.json          # Root scripts for running and building the monorepo
```

### Tech Stack

- **Frontend & Admin**:
  - React 18 with TypeScript
  - Vite for fast build and development
  - Tailwind CSS for sleek, responsive styling
  - Lucide React icons
  - Framer Motion for animations
  - `@supabase/supabase-js` for client-side queries and authentication
- **Backend API**:
  - Node.js & Express with TypeScript (`tsx` in dev, `tsc` in prod)
  - Supabase Admin SDK (`@supabase/supabase-js` with service role key)
  - Resend for transactional email delivery
  - JSON Web Tokens (`jsonwebtoken`)
  - Rate limiting (`express-rate-limit`) & Helmet security middleware
  - Zod for request validation
- **Database & Storage**:
  - Supabase (PostgreSQL)
  - Row Level Security (RLS) policies ensuring complete data isolation
  - Supabase Storage buckets for product logos, screenshots, and user avatars

---

## ✨ Features

- **Product Discovery**: Browse trending, newest, and category-filtered products.
- **Product Details & Community**: Detailed product pages, screenshots, maker bio, upvote system, and comments.
- **Builder Dashboard**:
  - Submit new products with rich metadata, links, and screenshots
  - Edit existing products
  - Track submission status (Pending Review, Approved, Rejected)
  - Profile and account management
- **Admin Management Panel**:
  - Review queue for pending product submissions
  - One-click approval and rejection with feedback notes
  - User and builder directory management
  - Platform-wide statistics and metrics
- **Transactional Email System**:
  - Instant confirmation when a product is submitted
  - Notification when a product is approved and published
  - Actionable feedback emails if a product requires changes

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or pnpm
- A [Supabase](https://supabase.com) project
- (Optional) A [Resend](https://resend.com) account for transactional emails

### 1. Database Setup

1. Open your Supabase project dashboard.
2. Go to the **SQL Editor**.
3. Copy the contents of [`supabase-schema.sql`](./supabase-schema.sql) and run it. This will create all necessary tables, triggers, indexes, and Row Level Security policies.

### 2. Environment Configuration

Copy the example environment files in each directory and populate the required credentials:

#### Backend (`backend/.env`)
```bash
cp backend/.env.example backend/.env
```
Configure your Supabase URL, Anon Key, Service Role Key, JWT Secret, and Resend API key.

#### Frontend (`frontend/.env.local`)
```bash
cp frontend/.env.example frontend/.env.local
```
Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

#### Admin (`admin/.env.local`)
```bash
cp admin/.env.example admin/.env.local
```
Configure `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

### 3. Installation

Install dependencies across all projects:

```bash
# Frontend
cd frontend && npm install && cd ..

# Admin
cd admin && npm install && cd ..

# Backend
cd backend && npm install && cd ..
```

Or using the root script:
```bash
npm run install:all
```

### 4. Running Locally

You can run each application in a separate terminal:

```bash
# Terminal 1 - Frontend (runs on http://localhost:3000)
npm run dev:frontend

# Terminal 2 - Admin Portal (runs on http://localhost:3002)
npm run dev:admin

# Terminal 3 - Backend API Server (runs on http://localhost:3001)
cd backend && npm run dev
```

---

## 📦 Production Build

To build all applications for production:

```bash
# Root build script
npm run build
```

Or build individual services:
```bash
# Frontend
cd frontend && npm run build

# Admin
cd admin && npm run build

# Backend
cd backend && npm run build
```

---

## 🔒 Security & Best Practices

- **Never commit `.env` or `.env.local` files.** All sensitive credentials, service keys, and tokens are protected via `.gitignore`.
- **Database Row Level Security (RLS)** is strictly enforced on all public queries.
- **Backend Service Role Key** is kept strictly on the backend server and never exposed to the client bundle.

---

## 📄 License

Proprietary software. All rights reserved.
