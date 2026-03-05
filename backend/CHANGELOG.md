# Changelog

## v0.4.0 - 2026-03-05

### Added
- Use Case diagram with 13 use cases across Authentication, Meeting Management, and Meeting Types
- Database ER diagram showing User-Meeting one-to-many relationship with full column details
- Documentation in `docs/` directory (Mermaid-based, renders on GitHub)

## v0.3.0 - 2026-03-05

### Added
- Swagger UI API documentation at `/api-docs` (OpenAPI 3.0)
- Full spec covering Auth and Meetings endpoints with request/response schemas
- BearerAuth security scheme for protected endpoints
- swagger-jsdoc, swagger-ui-express dependencies

## v0.2.0 - 2026-03-05

### Added
- Mocha + Chai unit/integration test suite (147 tests)
- c8 code coverage (98.98% statements, 100% functions, 94.44% branches)
- Test files covering validators, middleware, routes, and app integration
- Test setup with console suppression and env config
- npm scripts: `test`, `test:coverage`

### Changed
- Refactored `routes/auth.ts` to factory function `createAuthRoutes(prisma)` for testability
- Refactored `routes/meetings.ts` to factory function `createMeetingRoutes(prisma)` for testability
- Wrapped `app.listen()` in `require.main === module` guard to support supertest

### Dev Dependencies Added
- mocha, chai (v4), sinon, supertest, c8 with TypeScript type definitions

## v0.1.0 - 2026-03-05

### Added
- Express + TypeScript + Prisma project scaffolding
- Auth routes (register with bcrypt, login with credentials)
- Meeting CRUD API with pagination, search, and status filter
- JWT auth middleware compatible with NextAuth tokens
- Request logging middleware with timestamp, method, URL, status, duration, IP, user

### Changed
- All primary keys changed from autoincrement Int to UUID
- Meeting deletion is now soft delete (sets deletedAt timestamp instead of removing row)

### Security
- Security event logging (login success/fail, token issues, CORS blocks)
- CORS whitelist with ALLOWED_ORIGINS, security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)

