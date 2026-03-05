# Changelog

## v0.2.0 - 2026-03-05

### Added
- Playwright E2E test suite (28 tests across 3 spec files)
- Auth tests: login, register, logout, protected route redirect
- Meeting CRUD tests: create online/onsite, view detail, edit, delete with confirm/cancel
- Meeting list tests: search by name/title, filter by status, clear filters
- Reusable test helpers (login, form fill, date picker utilities)
- Playwright config for Chromium (baseURL: localhost:3000)
- npm scripts: `test:e2e`, `test:e2e:ui`

## v0.1.0 - 2026-03-05

### Added
- Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui project scaffolding
- NextAuth.js integration with Credentials provider and JWT strategy
- Login and Register pages with form validation
- Dashboard with meeting cards, search, status filter, pagination
- Meeting create, detail, and edit pages with reusable MeetingForm component
- Route protection middleware (redirect to /login if unauthenticated)

### Changed
- All ID types changed from number to string (UUID)

