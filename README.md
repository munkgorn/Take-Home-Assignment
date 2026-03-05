# Candidate Meeting Scheduler

A full-stack web application for managing candidate interview meetings. Built as a take-home assignment for Senior Software Engineer (Full Stack) position.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | NextAuth.js (Credentials + JWT) |
| Validation | Zod |
| Container | Docker + Docker Compose |

## Quick Start (Docker)

```bash
docker-compose up --build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Default test account:**
- Email: `test@example.com`
- Password: `password123`

To seed the database with sample data:
```bash
docker-compose exec backend npx ts-node prisma/seed.ts
```

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Backend
```bash
cd backend
npm install
cp .env.example .env  # Edit DATABASE_URL if needed
npx prisma db push
npm run db:seed        # Optional: seed sample data
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Backend runs on [http://localhost:3001](http://localhost:3001), frontend on [http://localhost:3000](http://localhost:3000).

## Features

- User registration and authentication (JWT-based)
- Create, read, update, and delete interview meetings
- Filter meetings by status (Pending / Confirmed / Cancelled)
- Search meetings by title or candidate name
- Pagination support
- Meeting types: Onsite and Online (with meeting link)
- Date/time picker for scheduling
- Responsive UI with shadcn/ui components

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get user data |

### Meetings (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/meetings` | List meetings (paginated) |
| POST | `/api/meetings` | Create a meeting |
| GET | `/api/meetings/:id` | Get meeting details |
| PUT | `/api/meetings/:id` | Update a meeting |
| DELETE | `/api/meetings/:id` | Delete a meeting |

**Query parameters for GET /api/meetings:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` — filter by: `pending`, `confirmed`, `cancelled`
- `search` — search by title or candidate name

## Project Structure

```
├── frontend/          # Next.js App Router
│   ├── app/
│   │   ├── (auth)/    # Login & Register pages
│   │   ├── (dashboard)/ # Main app pages
│   │   └── api/auth/  # NextAuth route handler
│   ├── components/    # Reusable components + shadcn/ui
│   ├── lib/           # API client, auth config, utils
│   └── types/         # TypeScript type definitions
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/    # Auth & Meeting routes
│   │   ├── middleware/ # Auth & error handling
│   │   └── validators/ # Zod schemas
│   └── prisma/        # Schema & seed
├── docker-compose.yml
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/meeting_scheduler` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | — |
| `NEXTAUTH_URL` | Frontend URL for NextAuth | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001/api` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `PORT` | Backend port | `3001` |

## Deployment

- **Frontend** → Vercel (connect GitHub repo, set env vars)
- **Backend** → Render (Dockerfile deploy, set env vars)
- **Database** → Neon (managed PostgreSQL)
