# API Specification

- **Base Endpoint URL:** `http://localhost:3000`
- **Global API Context Routing:** `/api`
- **Interactive Swagger Documentation:** `http://localhost:3000/docs`
- **Application Live Check:** `GET http://localhost:3000/health`

---

## Auth Endpoints

### Register Account
```http
POST http://localhost:3000/api/auth/register
```

**Request Header:** `Content-Type: application/json`

**Payload:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "displayName": "John"
}
```

**Response:**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

---

### Authenticate / Login
```http
POST http://localhost:3000/api/auth/login
```

**Payload:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

---

### Rotate Refresh Token
```http
POST http://localhost:3000/api/auth/refresh
```

**Payload:**
```json
{
  "refreshToken": "token"
}
```

---

### Account Logout
```http
POST http://localhost:3000/api/auth/logout
```

**Payload:**
```json
{
  "refreshToken": "token"
}
```

---

## User Endpoints
*Requires active authorization header.*

### Get Current User
```http
GET http://localhost:3000/api/user/me
```

---

### Update Profile
```http
PATCH http://localhost:3000/api/user/me
```

**Payload:**
```json
{
  "displayName": "Updated Name"
}
```

---

### Fetch Live User Statistics
```http
GET http://localhost:3000/api/user/me/stats
```

---

## Challenge Endpoints
*Requires active authorization header.*

### List Paginated Challenges
```http
GET http://localhost:3000/api/challenges?page=1&limit=10
```

#### Supported Query Modifiers:

| Param | Expected Type | Purpose |
|---|---|---|
| `page` | Integer | Pagination page pointer |
| `limit` | Integer | Volume of records per view window |
| `difficulty` | String | Filter matching `easy` / `medium` / `hard` |
| `active` | Boolean | Filter against lifecycle status (`true`/`false`) |

---

### Fetch Challenge Details By ID
```http
GET http://localhost:3000/api/challenges/:id
```

---

### Post Challenge Completion Record
```http
POST http://localhost:3000/api/challenges/:id/complete
```

**Payload:**
```json
{
  "listenDurationPercent": 100
}
```

---

## Reward Endpoints
*Requires active authorization header.*

### List Active Rewards
```http
GET http://localhost:3000/api/rewards
```

---

### Redeem Target Reward
```http
POST http://localhost:3000/api/rewards/:id/redeem
```

---

### Fetch User Reward Redemption History
```http
GET http://localhost:3000/api/rewards/history
```

---

## Leaderboard Endpoints
*Requires active authorization header.*

### Global Leaderboard Standings
```http
GET http://localhost:3000/api/leaderboard?page=1&limit=10
```

---

### Current User Rank Metric
```http
GET http://localhost:3000/api/leaderboard/me
```

---

## Global HTTP Status Codes Mapping

| HTTP Code | Canonical Phrase | Functional Context |
|---|---|---|
| **200** | OK | The action succeeded. |
| **201** | Created | The resource was provisioned successfully. |
| **204** | No Content | Execution was successful; no body payload returned. |
| **400** | Bad Request | Request payload parsing error or schema validation fault. |
| **401** | Unauthorized | Bearer signature is expired, corrupted, or omitted entirely. |
| **403** | Forbidden | Correct token, but user possesses insufficient context scope. |
| **404** | Not Found | Target ID or API routing pattern does not map to a resource. |
| **409** | Conflict | Violates data uniqueness constraints (e.g., matching email). |
| **429** | Too Many Requests | User has exceeded temporary rate thresholds window. |
| **500** | Internal Error | Upstream exception or runtime infrastructure fault. |
