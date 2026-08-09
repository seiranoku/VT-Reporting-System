# VT Reporting System — Architecture

Simple monolith stack for Vulnerability Test (VT) management and PDF report generation.

## Stack

| Layer      | Technology              | Port |
|------------|-------------------------|------|
| Frontend   | Next.js (App Router)    | 3000 |
| Backend    | NestJS + Prisma         | 3001 |
| Database   | PostgreSQL 16           | 5432 |
| Runtime    | Docker Compose          | —    |

## Goals

- Manage projects, assessments (Burp / OWASP), findings, and evidence
- Generate professional PDF reports
- Stay simple: one frontend, one backend, one database

## High-level flow

```text
Browser (Next.js :3000)
        │
        │  HTTP /api
        ▼
NestJS API (:3001)
        │
        ├── Prisma ──► PostgreSQL
        └── Files   ──► /storage/evidence (Docker volume)
```

## Domain model (MVP)

```text
Project
  └── Assessment (methodology: BURP | OWASP)
        ├── OwaspTest (OWASP only)
        └── Finding
              └── Evidence
```

Users and audit logs support basic auth and traceability.

## Backend modules

```text
backend/src/
├── projects/
├── assessments/
├── owasp/
├── findings/
├── evidences/
├── reports/
├── users/
├── common/
└── prisma/
```

API prefix: `/api`

## Frontend layout

```text
Sidebar | Header | Main Content
```

Menus: Dashboard, Projects, Assessments, Findings, Reports, Settings

## Docker services

```text
frontend  → Next.js
backend   → NestJS
postgres  → PostgreSQL
```

Volumes:

- `postgres_data` — database persistence
- `evidence_data` — uploaded evidence files

## Non-goals (MVP)

No Redis, Kafka, RabbitMQ, Elasticsearch, MinIO, or Kubernetes.

Light automated scanning is supported via `POST /api/scans/start` (HTTP probe + header/injection heuristics). Full Burp Suite Enterprise / ZAP orchestration is out of scope for this phase.

## Phase plan

1. Foundation (this phase): apps + DB + Docker
2. Projects CRUD
3. Assessments
4. Findings
5. Evidence upload
6. OWASP checklist
7. Burp finding UX
8. PDF reports
9. Dashboard
10. Testing & cleanup
11. Auto-scan (light): URL + method + body → Burp & OWASP assessments
