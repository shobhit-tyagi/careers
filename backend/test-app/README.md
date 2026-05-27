# FanRewards API

Backend API for a music fan engagement and rewards platform built with TypeScript, Fastify, PostgreSQL, Redis, RabbitMQ, and TypeORM.

---

## Tech Stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- TypeORM
- Redis
- RabbitMQ
- JWT Authentication
- Swagger / OpenAPI
- Jest

---

## Features

- JWT authentication with refresh tokens
- User profile management
- Challenge completion system
- Reward redemption system
- Leaderboards
- Redis-backed rate limiting
- RabbitMQ event consumers
- Scheduled leaderboard jobs
- Swagger API documentation
- PostgreSQL relational data model
- Correlation ID tracing
- Security headers via Helmet

---

## Project Structure

```txt
src/
├── config/
├── entities/
├── event/
│   └── consumers/
├── hooks/
├── jobs/
├── middleware/
├── migrations/
├── plugins/
├── routes/
├── services/
├── types/
├── validators/
├── app.ts
├── start.ts
├── shutdown.ts
└── seed.ts
```

---

## System Architecture

### Core Components

| Component | Responsibility |
|---|---|
| Fastify | HTTP API server |
| PostgreSQL | Primary relational database |
| Redis | Rate limiting + leaderboard cache |
| RabbitMQ | Async event processing |
| Cron Jobs | Periodic leaderboard rebuilds |
| JWT | Authentication |

---

## Documentation Directory

To make navigating the ecosystem simpler, the documentation has been organized into specialized modules:

* [**Getting Started & Local Setup (SETUP.md)**](./docs/SETUP.md) — Clone, install dependencies, run infrastructure via Docker, seed data, and run tests.
* [**Database & Infrastructure (DATABASE.md)**](./docs/DATABASE.md) — Entity relationships, Entity Relationship (ER) diagram, Redis cache mapping, and RabbitMQ messaging rules.
* [**Authentication & Security (SECURITY.md)**](./docs/SECURITY.md) — JWT strategy, access/refresh token structures, and architectural security rules.
* [**API Specification (API.md)**](./docs/API.md) — Detailed mapping of all endpoints running on `localhost:3000` alongside payload definitions and status codes.
