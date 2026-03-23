#  Context-Aware Insight Service (V2)

A **production-oriented backend service** that generates AI-driven insights using tenant-specific business context.
Built to demonstrate **resilience, observability, and multi-tenant system design**.

---

#  What This System Does

Given:

```json
{
  "tenantId": "tenant_retail_india",
  "queryText": "sales growth"
}
```

The system:

1. Fetches tenant context from PostgreSQL
2. Enriches the request
3. Calls AI service
4. Returns contextual insight

---

#  Architecture (Real Flow)

```
Client Request
   ↓
Express Routes
   ↓
Middleware Layer
   - Request ID
   - Rate Limiting (per tenant)
   ↓
Controller
   ↓
Service Layer
   - Insight Service
   - AI Service (Retry + Timeout + Circuit Breaker)
   ↓
Repository Layer
   ↓
PostgreSQL (tenant context)

External Dependency:
Mock AI Service
```

---

#  Tech Stack

* Node.js (ES Modules)
* Express.js
* PostgreSQL
* Axios (HTTP client)
* Nodemon (dev)
* Custom structured logger

---

#  Key Engineering Features

## 1. Multi-Tenancy

* Context fetched per tenant from DB
* Strict validation of tenantId

---

## 2. Resilience (CORE STRENGTH)

* Retry mechanism (configurable)
* Timeout protection
* Circuit breaker (prevents cascading failures)

 System does NOT blindly depend on AI

---

## 3. Observability

* RequestId tracking (end-to-end)
* Structured logs
* Latency measurement (API + dependencies)

---

## 4. Health Monitoring

```
GET /api/health
```

Supports:

* Healthy
* Degraded (partial failure)
* Unhealthy (critical failure)

---

## 5. Rate Limiting (Protection Layer)

* Per-tenant limit (in-memory)
* Prevents abuse
* Returns HTTP 429

---

# 🔌 API

## POST /api/v1/insight-query

### Request

```json
{
  "tenantId": "tenant_retail_india",
  "queryText": "sales growth"
}
```

---

### Success

```json
{
  "status": "SUCCESS",
  "insight": "Insight for \"sales growth\" in retail (India)",
  "latencyMs": 207,
  "requestId": "req-xxxx"
}
```

---

### Failure Examples

#### Invalid Input → 400

```json
{
  "status": "error",
  "message": "Invalid input"
}
```

#### Tenant Not Found → 404

```json
{
  "status": "error",
  "message": "No context found for tenant"
}
```

#### AI Failure → 502

```json
{
  "status": "error",
  "message": "AI service temporarily unavailable"
}
```

#### Rate Limit → 429

```json
{
  "status": "error",
  "message": "Too many requests"
}
```

---

# 🧪 Test Scenarios (Demonstrated)

| Scenario         | Expected Behavior  |
| ---------------- | ------------------ |
| Success          | Insight returned   |
| Invalid Input    | 400 error          |
| Tenant Not Found | 404 error          |
| AI Failure       | 502 error          |
| Timeout          | Retry + fail       |
| Rate Limit       | 429 error          |
| DB Down          | System = unhealthy |

---

#  Setup

## 1. Install

```bash
npm install
```

---

## 2. Environment (.env)

```env
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=insight_db_v2

AI_SERVICE_URL=http://localhost:4000/mock-ai
AI_TIMEOUT_MS=1000
RETRY_COUNT=2
RETRY_DELAY_MS=100

AI_FAILURE_RATE=0.3
AI_DELAY_MS=200
```

---

## 3. Run DB Script

Execute:

```
db/schema.sql
```

---

## 4. Start Services

```bash
npm run dev
```

```bash
node src/utils/mock-ai-server.js
```

---

# ⚖️ Key Design Decisions (This is what interviewer cares about)

## 1. In-Memory Rate Limiting

* Chosen for simplicity
* Not horizontally scalable
* Production alternative → Redis

---

## 2. Synchronous Processing

* Simpler request-response model
* Trade-off: latency depends on AI
* Future → async queue (Kafka/SQS)

---

## 3. Circuit Breaker

* Stops repeated failing calls
* Protects system stability

---

## 4. Retry Strategy

* Improves reliability
* Limited retries to avoid overload

---

#  Known Limitations

* No distributed rate limiting
* No caching layer
* AI health check is not lightweight
* No queue-based async processing

 These are intentional trade-offs for scope

---

#  Future Improvements

* Redis-based rate limiting
* Response caching (reduce AI calls)
* Async processing with queue
* Metrics (Prometheus + Grafana)

---

#  What This Demonstrates

This project is NOT CRUD.

It demonstrates:

* System design thinking
* Failure handling
* Dependency management
* Production readiness mindset

---

#  Author

Built as part of a **CTO-level backend exercise**.

Focus:

* Resilience engineering
* Scalable design thinking
* Clean architecture

---


