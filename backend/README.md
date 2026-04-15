# $${\color{purple}🚀 \space Backend \space Developer \space Technical \space Assessment}$$

## $${\color{blue}🎵 \space Project: \space "FanRewards \space API"}$$

Build a simplified fan rewards API that demonstrates the core backend patterns used in Belong's platform. We've provided a starter project with the barebones to get you going.

---

## $${\color{orange}⚙️ \space Belong \space Backend \space Infrastructure \space Analysis}$$

### **Tech Stack:**

- **Runtime:** Node.js with TypeScript (strict mode)
- **Framework:** Fastify
- **ORM:** TypeORM with PostgreSQL
- **Authentication:** JWT (access + refresh tokens)
- **Validation:** JSON Schema / Typebox
- **Testing:** Jest + Supertest
- **Infrastructure:** Docker Compose for local development

### **Key Patterns:**

- **Route Architecture:** Fastify plugin-based route registration with schema validation
- **Service Layer:** Business logic separated from route handlers
- **Entity Design:** TypeORM entities with relations, migrations, and repository pattern
- **Middleware:** Authentication guards, rate limiting, request logging
- **Error Handling:** Centralized error handler with typed error codes

---

## $${\color{purple}🎯 \space Requirements}$$

### $${\color{green}1. \space Core \space Features \space (4-5 \space hours)}$$

Build a REST API with these resources:

- **Auth** — Register, login, refresh tokens, logout
- **Users** — Profile retrieval and update
- **Challenges** — CRUD for music challenges (listen-to-earn tasks)
- **Rewards** — Track points earned, redeem rewards, view history
- **Leaderboard** — Ranked list of top fans by points

### $${\color{blue}2. \space Technical \space Architecture \space Requirements}$$

#### $${\color{orange}Entity \space Design:}$$

```typescript
// Required TypeORM entities

@Entity()
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: 0 })
  totalPoints: number;

  @Column({ nullable: true })
  displayName: string;

  @OneToMany(() => ChallengeCompletion, (c) => c.user)
  completions: ChallengeCompletion[];

  @OneToMany(() => RewardRedemption, (r) => r.user)
  redemptions: RewardRedemption[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  artist: string;

  @Column()
  description: string;

  @Column()
  points: number;

  @Column()
  durationSeconds: number;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard'] })
  difficulty: 'easy' | 'medium' | 'hard';

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ChallengeCompletion, (c) => c.challenge)
  completions: ChallengeCompletion[];

  @CreateDateColumn()
  createdAt: Date;
}

@Entity()
class ChallengeCompletion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.completions)
  user: User;

  @ManyToOne(() => Challenge, (c) => c.completions)
  challenge: Challenge;

  @Column()
  pointsEarned: number;

  @Column({ type: 'float' })
  listenDurationPercent: number; // 0-100

  @CreateDateColumn()
  completedAt: Date;
}

@Entity()
class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  pointsCost: number;

  @Column({ default: true })
  isAvailable: boolean;
}

@Entity()
class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (u) => u.redemptions)
  user: User;

  @ManyToOne(() => Reward)
  reward: Reward;

  @Column()
  pointsSpent: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'fulfilled' | 'cancelled';

  @CreateDateColumn()
  redeemedAt: Date;
}
```

#### $${\color{orange}Route \space Architecture:}$$

```typescript
// Fastify plugin-based route registration
// All routes should use JSON Schema validation

// Auth routes (public)
POST   /api/auth/register        // Create account
POST   /api/auth/login            // Get access + refresh tokens
POST   /api/auth/refresh          // Refresh access token
POST   /api/auth/logout           // Invalidate refresh token

// User routes (authenticated)
GET    /api/users/me              // Get current user profile
PATCH  /api/users/me              // Update profile
GET    /api/users/me/stats        // Points, completions, redemptions summary

// Challenge routes (authenticated)
GET    /api/challenges            // List challenges (paginated, filterable)
GET    /api/challenges/:id        // Get challenge detail
POST   /api/challenges/:id/complete  // Mark challenge as completed

// Reward routes (authenticated)
GET    /api/rewards               // List available rewards
POST   /api/rewards/:id/redeem    // Redeem a reward (deduct points)
GET    /api/rewards/history       // User's redemption history

// Leaderboard routes (authenticated)
GET    /api/leaderboard           // Top fans ranked by points (paginated)
GET    /api/leaderboard/me        // Current user's rank
```

#### $${\color{orange}Service \space Layer:}$$

```typescript
// Required services — business logic separated from route handlers

interface AuthService {
  register(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<{ user: User; tokens: TokenPair }>;
  login(email: string, password: string): Promise<TokenPair>;
  refresh(refreshToken: string): Promise<TokenPair>;
  logout(refreshToken: string): Promise<void>;
}

interface ChallengeService {
  list(
    options: PaginationOptions & { difficulty?: string; isActive?: boolean },
  ): Promise<PaginatedResult<Challenge>>;
  getById(id: string): Promise<Challenge>;
  complete(
    userId: string,
    challengeId: string,
    listenDurationPercent: number,
  ): Promise<ChallengeCompletion>;
}

interface RewardService {
  list(): Promise<Reward[]>;
  redeem(userId: string, rewardId: string): Promise<RewardRedemption>;
  getHistory(userId: string): Promise<RewardRedemption[]>;
}

interface LeaderboardService {
  getTopFans(limit: number, offset: number): Promise<LeaderboardEntry[]>;
  getUserRank(userId: string): Promise<{ rank: number; totalPoints: number }>;
}

interface TokenPair {
  accessToken: string; // Short-lived (15 min)
  refreshToken: string; // Long-lived (7 days)
}
```

#### $${\color{orange}Authentication \space Middleware:}$$

```typescript
// JWT auth as a Fastify plugin/decorator

// Access tokens: signed JWT with userId, short expiry (15 min)
// Refresh tokens: opaque or JWT, stored in DB, long expiry (7 days)
// Auth guard: Fastify preHandler hook that verifies token and decorates request with user

// Password hashing: bcrypt with appropriate salt rounds
// Token signing: RS256 or HS256 with secure secret

fastify.decorateRequest('user', null);

const authGuard: preHandlerHookHandler = async (request, reply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) return reply.code(401).send({ error: 'Unauthorized' });

  try {
    const payload = verifyAccessToken(token);
    request.user = payload;
  } catch {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
};
```

### $${\color{blue}3. \space API \space Design \space Standards}$$

#### $${\color{orange}Request/Response \space Format:}$$

```typescript
// All responses follow a consistent envelope

// Success
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 42 }  // for paginated endpoints
}

// Error
{
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "You need 50 more points to redeem this reward"
  }
}

// Use proper HTTP status codes:
// 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized,
// 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity
```

#### $${\color{orange}Validation \space with \space Typebox:}$$

```typescript
import { Type, Static } from '@sinclair/typebox';

const RegisterBody = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
  displayName: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
});

type RegisterBodyType = Static<typeof RegisterBody>;

// Fastify route with schema validation
fastify.post<{ Body: RegisterBodyType }>(
  '/api/auth/register',
  {
    schema: { body: RegisterBody },
  },
  async (request, reply) => {
    const result = await authService.register(
      request.body.email,
      request.body.password,
      request.body.displayName,
    );
    return reply.code(201).send({ data: result });
  },
);
```

### $${\color{blue}4. \space Specific \space Implementation \space Details}$$

#### $${\color{orange}A) \space Challenge \space Completion \space Logic}$$

```typescript
// Points are awarded based on listen duration percentage
// Minimum 80% listen required for full points
// Partial credit: (listenPercent / 80) * challenge.points, capped at challenge.points
// A user can complete the same challenge multiple times (earn points each time)
// Each completion is a separate record

async complete(
  userId: string,
  challengeId: string,
  listenDurationPercent: number,
): Promise<ChallengeCompletion> {
  const challenge = await this.challengeRepo.findOneOrFail({ where: { id: challengeId, isActive: true } });

  const earnedPoints = Math.min(
    challenge.points,
    Math.floor((listenDurationPercent / 80) * challenge.points),
  );

  const completion = this.completionRepo.create({
    user: { id: userId },
    challenge: { id: challengeId },
    pointsEarned: earnedPoints,
    listenDurationPercent,
  });

  await this.completionRepo.save(completion);
  await this.userRepo.increment({ id: userId }, 'totalPoints', earnedPoints);

  return completion;
}
```

#### $${\color{orange}B) \space Reward \space Redemption \space Logic}$$

```typescript
// Atomic operation: check points, deduct, create redemption
// Must handle race conditions (use transactions)

async redeem(userId: string, rewardId: string): Promise<RewardRedemption> {
  return this.dataSource.transaction(async (manager) => {
    const user = await manager.findOneOrFail(User, {
      where: { id: userId },
      lock: { mode: 'pessimistic_write' },
    });

    const reward = await manager.findOneOrFail(Reward, {
      where: { id: rewardId, isAvailable: true },
    });

    if (user.totalPoints < reward.pointsCost) {
      throw new InsufficientPointsError(reward.pointsCost - user.totalPoints);
    }

    user.totalPoints -= reward.pointsCost;
    await manager.save(user);

    const redemption = manager.create(RewardRedemption, {
      user: { id: userId },
      reward: { id: rewardId },
      pointsSpent: reward.pointsCost,
      status: 'pending',
    });

    return manager.save(redemption);
  });
}
```

#### $${\color{orange}C) \space Leaderboard \space Query}$$

```typescript
// Efficient leaderboard using a ranked query
// Should handle ties and return consistent ordering

async getTopFans(limit: number, offset: number): Promise<LeaderboardEntry[]> {
  const result = await this.userRepo
    .createQueryBuilder('user')
    .select([
      'user.id',
      'user.displayName',
      'user.totalPoints',
      'RANK() OVER (ORDER BY user.totalPoints DESC) as rank',
    ])
    .orderBy('user.totalPoints', 'DESC')
    .limit(limit)
    .offset(offset)
    .getRawMany();

  return result;
}
```

#### $${\color{orange}D) \space Seed \space Data}$$

```typescript
// Seed challenges using Belong's sample tracks
const SEED_CHALLENGES = [
  {
    title: 'All Night',
    artist: 'Camo & Krooked',
    description: 'Listen to this drum & bass classic to earn points',
    points: 150,
    durationSeconds: 219,
    difficulty: 'easy' as const,
  },
  {
    title: 'New Forms',
    artist: 'Roni Size',
    description: 'Complete this legendary track for bonus points',
    points: 300,
    durationSeconds: 464,
    difficulty: 'medium' as const,
  },
  {
    title: 'Extended Session',
    artist: 'Camo & Krooked',
    description: 'A longer listening challenge for dedicated fans',
    points: 500,
    durationSeconds: 600,
    difficulty: 'hard' as const,
  },
];

const SEED_REWARDS = [
  {
    name: 'Early Access Pass',
    description: 'Get early access to new features',
    pointsCost: 200,
  },
  {
    name: 'Exclusive Playlist',
    description: 'Unlock a curated artist playlist',
    pointsCost: 500,
  },
  {
    name: 'VIP Fan Badge',
    description: 'Show off your dedication with a VIP badge',
    pointsCost: 1000,
  },
  {
    name: 'Concert Ticket Raffle',
    description: 'Enter a raffle for concert tickets',
    pointsCost: 2500,
  },
];
```

### $${\color{green}5. \space Project \space Structure}$$

```
backend/test-app/
├── src/
│   ├── config/
│   │   └── index.ts              # Environment config (DB, JWT secrets, etc.)
│   ├── entities/
│   │   ├── User.ts
│   │   ├── Challenge.ts
│   │   ├── ChallengeCompletion.ts
│   │   ├── Reward.ts
│   │   └── RewardRedemption.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── ChallengeService.ts
│   │   ├── RewardService.ts
│   │   └── LeaderboardService.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── challenges.ts
│   │   ├── rewards.ts
│   │   └── leaderboard.ts
│   ├── middleware/
│   │   └── auth.ts               # JWT auth guard
│   ├── plugins/
│   │   └── db.ts                 # TypeORM Fastify plugin
│   ├── types/
│   │   └── index.ts              # Shared types and interfaces
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── challenges.test.ts
│   │   └── rewards.test.ts
│   └── app.ts                    # Fastify app setup
├── docker-compose.yml            # PostgreSQL for local dev
├── package.json
├── tsconfig.json
└── README.md
```

### $${\color{green}6. \space Evaluation \space Criteria}$$

#### $${\color{blue}Architecture \space (40 \space percent)}$$

- Proper service layer separation from route handlers
- TypeORM entity design with correct relations and migrations
- Clean Fastify plugin/route registration
- Proper TypeScript typing throughout
- Transaction handling for atomic operations

#### $${\color{orange}API \space Design \space (25 \space percent)}$$

- RESTful conventions and proper HTTP status codes
- Consistent request/response envelope
- Input validation with JSON Schema / Typebox
- Pagination, filtering, and sorting
- Meaningful error responses with error codes

#### $${\color{purple}Security \space (20 \space percent)}$$

- JWT access/refresh token flow
- Password hashing with bcrypt
- Auth middleware protecting routes
- Input sanitization and SQL injection prevention
- Rate limiting on auth endpoints

#### $${\color{red}Code \space Quality \space (15 \space percent)}$$

- TypeScript strict mode, no `any` types
- Test coverage for critical paths (auth, rewards redemption)
- Clean error handling with custom error classes
- Code organization and naming conventions
- Docker Compose setup that works out of the box

### $${\color{blue}7. \space Setup \space Instructions}$$

#### $${\color{orange}Setup \space and \space Run:}$$

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Install dependencies
npm install

# 3. Run migrations
npm run migration:run

# 4. Seed the database
npm run seed

# 5. Start the dev server
npm run dev

# Server runs on http://localhost:3000
```

#### $${\color{orange}Run \space Tests:}$$

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

### $${\color{red}🚀 \space Bonus \space Features \space (Extra \space Credit)}$$

#### $${\color{green}Advanced \space Backend \space Features:}$$

- Rate limiting with sliding window (e.g., per-user, per-endpoint)
- Request logging with correlation IDs
- Health check endpoint with DB connectivity status
- Swagger/OpenAPI documentation auto-generated from schemas
- Database query optimization with EXPLAIN analysis

#### $${\color{blue}Enhanced \space Security:}$$

- Refresh token rotation (invalidate old token on refresh)
- Account lockout after failed login attempts
- CORS configuration for specific origins
- Helmet headers and content security policy
- API key authentication for admin endpoints

#### $${\color{purple}Advanced \space Architecture:}$$

- Event-driven challenge completion (emit events on completion)
- Caching layer for leaderboard (Redis or in-memory)
- Background job for leaderboard recalculation
- Graceful shutdown handling
- Database connection pooling tuning

### $${\color{orange}📋 \space Submission \space Requirements}$$

#### $${\color{blue}Deliverables:}$$

1. **GitHub Repository** with clean commit history OR **ZIP of the project**
2. **README.md** with setup and run instructions
3. **ARCHITECTURE.md** explaining design decisions
4. **Postman Collection or OpenAPI spec** for testing the API
5. **Demo Video** (3-4 minutes) showing:
   - Docker Compose startup and migrations
   - Auth flow (register, login, refresh)
   - Challenge completion and points earning
   - Reward redemption with insufficient points error
   - Leaderboard ranking
   - Test suite running

#### $${\color{green}Code \space Quality \space Checklist:}$$

- [ ] TypeScript strict mode enabled
- [ ] No `any` types (except temporary with TODO comments)
- [ ] All routes have JSON Schema validation
- [ ] Auth middleware on all protected routes
- [ ] Transactions for atomic operations (reward redemption)
- [ ] Tests for auth flow and reward redemption
- [ ] Docker Compose runs cleanly from scratch

#### $${\color{orange}Testing \space Scenarios:}$$

- [ ] Register a new user and receive tokens
- [ ] Login and access protected routes
- [ ] Complete a challenge and verify points update
- [ ] Redeem a reward and verify points deduction
- [ ] Attempt redemption with insufficient points (expect error)
- [ ] Leaderboard returns correct ranking
- [ ] Expired token returns 401
- [ ] Invalid input returns 400 with validation errors

#### $${\color{purple}Timeline:}$$

- **Initial submission:** 5 days from start
- **Code review session:** 1 hour technical discussion
- **Follow-up questions:** Architecture and scaling discussions

### $${\color{red}🤔 \space Assessment \space Questions}$$

During code review, we'll discuss:

1. **Architecture:** "Walk me through your service layer. Why separate services from route handlers?"

2. **Database Design:** "How did you decide on the entity relations? What indexes would you add at scale?"

3. **Security:** "Explain your token refresh flow. How do you handle token theft?"

4. **Concurrency:** "What happens if two users redeem the last reward simultaneously? Show me how you handle it."

5. **Performance:** "How would you optimize the leaderboard for 1M users?"

6. **Testing:** "What's your strategy for testing the auth flow end-to-end?"

7. **Scaling:** "How would you evolve this API to support microservices? What would you extract first?"

8. **Error Handling:** "Walk me through what happens when the database is unavailable. How does the API respond?"

---

## $${\color{green}🚀 \space Getting \space Started}$$

**New to this assessment?** Start here:

### **Starter Code:**

- **[Starter Project](./test-app/)** — Ready-to-use project structure with configs

### **Assessment Materials:**

```
backend/
├── test-app/              # Starter project structure
└── README.md              # This file (detailed requirements)
```

### **Support:**

Questions during development? Email **careers@getbelong.app** — we want you to succeed!

$${\color{purple}Good \space luck \space building \space the \space future \space of \space fandom! \space 🚀🎵}$$
