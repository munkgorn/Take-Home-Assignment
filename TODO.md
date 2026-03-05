# TODO — Candidate Meeting Scheduler

## Phase 1: Project Setup
- [ ] สร้าง monorepo structure (`/frontend`, `/backend`)
- [ ] Init frontend: React + TypeScript + Vite
- [ ] Init backend: Node.js + Express + TypeScript
- [ ] ตั้งค่า ESLint / Prettier (shared config)
- [ ] สร้าง Docker Compose (frontend + backend + PostgreSQL)
- [ ] เขียน `.env.example` สำหรับ config ต่างๆ

## Phase 2: Backend — REST API
- [ ] ออกแบบ DB schema (meetings, candidates)
- [ ] Setup database connection (PostgreSQL + Prisma หรือ Knex)
- [ ] สร้าง migration files
- [ ] สร้าง seed data สำหรับ dev

### API Endpoints
- [ ] `GET    /api/meetings`       — list meetings (+ pagination)
- [ ] `POST   /api/meetings`       — create meeting
- [ ] `GET    /api/meetings/:id`   — get meeting detail
- [ ] `PUT    /api/meetings/:id`   — update meeting
- [ ] `DELETE /api/meetings/:id`   — delete meeting
- [ ] `GET    /api/candidates/:id` — candidate summary + history

### Validation & Error Handling
- [ ] Request validation (zod หรือ joi)
- [ ] Error handling middleware
- [ ] CORS setup

## Phase 3: Frontend — UI
- [ ] Setup routing (React Router)
- [ ] ตั้งค่า Tailwind CSS
- [ ] Setup API client (axios หรือ fetch wrapper)

### Pages
- [ ] **Dashboard** — card list ของ upcoming meetings
  - [ ] แสดง candidate name + role + date/time + status
  - [ ] Pagination หรือ infinite scroll
  - [ ] ปุ่ม "View Details"
  - [ ] Filter/Search (ถ้ามีเวลา)
- [ ] **Booking Form** — สร้าง meeting ใหม่
  - [ ] Candidate Name (text input)
  - [ ] Position (dropdown)
  - [ ] Date picker + Time picker (start & end)
  - [ ] Meeting type (Onsite / Online)
  - [ ] Notes (textarea)
  - [ ] Form validation
  - [ ] Submit → redirect กลับ dashboard
- [ ] **Candidate Summary** — หน้ารายละเอียด
  - [ ] ข้อมูล candidate + role
  - [ ] Meeting info (date, time, status)
  - [ ] Interview notes
  - [ ] History (previous meetings)
  - [ ] ปุ่ม Edit / Cancel / Add Feedback
- [ ] **Edit Meeting** — reuse booking form ในโหมดแก้ไข

### UI Components
- [ ] Layout (header, sidebar/nav)
- [ ] Meeting card component
- [ ] Status badge (Confirmed / Pending / Cancelled)
- [ ] Date/Time picker component
- [ ] Modal (confirm delete)
- [ ] Toast/notification (success/error)
- [ ] Loading states + empty states

## Phase 4: Containerize & Deploy
- [ ] Dockerfile สำหรับ frontend (multi-stage build)
- [ ] Dockerfile สำหรับ backend
- [ ] Docker Compose — frontend + backend + PostgreSQL
- [ ] ทดสอบ `docker-compose up` ทำงานได้ครบ
- [ ] Deploy (Render / Railway / VPS)
- [ ] ใส่ URL ที่ deploy แล้วใน README

## Phase 5: README
- [ ] Project overview
- [ ] Tech stack ที่ใช้
- [ ] วิธี run locally (docker-compose + manual)
- [ ] API documentation (endpoints summary)
- [ ] Screenshot ของ app
- [ ] Link ไป deployed version

## Bonus (ถ้ามีเวลา)
- [ ] **Auth**: JWT login/logout + protected routes
  - [ ] Login page (email + password)
  - [ ] Auth middleware (backend)
  - [ ] Auth context + route guard (frontend)
- [ ] **Tests**:
  - [ ] Unit tests สำหรับ API endpoints (Jest / Vitest)
  - [ ] Frontend component tests (React Testing Library)
- [ ] **CI/CD**:
  - [ ] GitHub Actions — lint + test on PR
  - [ ] Auto deploy on merge to main
- [ ] **UI Design**:
  - [ ] Figma mockup ก่อน implement

## Tech Stack (แนะนำ)
| Layer      | Tech                              |
|------------|-----------------------------------|
| Frontend   | React + TypeScript + Vite         |
| Styling    | Tailwind CSS                      |
| Backend    | Node.js + Express + TypeScript    |
| Database   | PostgreSQL                        |
| ORM        | Prisma                            |
| Validation | Zod                               |
| Container  | Docker + Docker Compose           |
| Testing    | Vitest + React Testing Library    |
| CI/CD      | GitHub Actions                    |
