# Setup, Installation, and Local Development

Follow these steps to spin up the local development environment for the FanRewards API.

---

## Prerequisites

Ensure you have the following software installed locally:
- Node.js (v18+ recommended)
- Docker & Docker Compose

---

## 1. Clone Repository

```bash
git clone git@github.com:shobhit-tyagi/careers.git
cd careers/backend/test-app
```

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Running Infrastructure Components Locally

The API relies on PostgreSQL, Redis, and RabbitMQ. You can start them inside detached Docker containers using the provided docker-compose file:

### Start PostgreSQL, Redis and RabbitMQ
```bash
docker-compose up -d
```

#### RabbitMQ Management Dashboard
- **URL:** `http://localhost:15672`
- **Default Username:** `guest`
- **Default Password:** `guest`

---

## 4. Prepare the Database

Once your Postgres container is up and healthy, run the migration scripts and inject local seed records.

### Generate and run migrations
```bash
npm run migration:generate src/migrations/Init
npm run migration:run
```

### Seed Database
```bash
npm run seed
```

### Start Development Server
```bash
npm run dev
```

---

## 6. Testing

**Note**: Currently there exist integration tests for all the routes. Unit tests for edge cases have been intentionally left out from this assignment in interest of time.

### Run Tests
```bash
npm test
```

### Run Coverage
```bash
npm run test:coverage
```
