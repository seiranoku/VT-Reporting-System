# VT Reporting System

Aplikasi web sederhana untuk mengelola Vulnerability Test (Burp Suite & OWASP), findings, evidence, dan generate laporan PDF.

## Stack

- Frontend: Next.js (port 3000)
- Backend: NestJS + Prisma (port 3001)
- Database: PostgreSQL (port 5432)
- Runtime: Docker Compose

Lihat [ARCHITECTURE.md](./ARCHITECTURE.md) untuk ringkasan arsitektur.

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

Aplikasi:

- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- Health: http://localhost:3001/api/health

Stop:

```bash
docker compose down
```

Data PostgreSQL dan evidence tetap tersimpan di Docker volumes.

## Development (tanpa Docker untuk app)

1. Jalankan Postgres (via Compose):

```bash
docker compose up -d postgres
```

2. Backend:

```bash
cd backend
cp ../.env.example .env   # sesuaikan DATABASE_URL ke localhost
npm install
npx prisma migrate dev
npm run start:dev
```

3. Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Phase status

- [x] Phase 1 — Foundation (Next.js, NestJS, PostgreSQL, Prisma, Docker)
- [x] Phase 2 — Projects
- [x] Phase 3 — Assessments
- [x] Phase 4 — Findings
- [x] Phase 5 — Evidence
- [x] Phase 6 — OWASP checklist
- [x] Phase 7 — Burp findings UX
- [x] Phase 8 — PDF reports
- [x] Phase 9 — Dashboard metrics
- [x] Phase 10 — Testing & cleanup
