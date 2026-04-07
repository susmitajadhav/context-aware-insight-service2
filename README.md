# Context-Aware Insight Service (Production-Oriented Backend)

## 📌 Overview

This project is a **production-grade backend service** built using Node.js that processes user queries in a **multi-tenant SaaS system**.
It fetches tenant-specific business context, calls an AI service, and returns structured insights.

The system is designed with **real-world production concerns** such as:

* Multi-tenant isolation
* Failure handling (retry, timeout, circuit breaker)
* Rate limiting
* Caching
* Structured logging

---

## 🧠 Core Concept

Each tenant has its own **business context**, which is used to generate insights for queries.

### Flow:

1. Validate request
2. Fetch tenant context from DB
3. Call AI service
4. Handle failures (retry, timeout, circuit breaker)
5. Cache response
6. Log request outcome
7. Return response

---

## 🚀 Tech Stack

* **Backend:** Node.js (ES Modules)
* **Framework:** Express.js
* **Database:** PostgreSQL
* **Cache:** In-memory (extendable to Redis)
* **AI Integration:** Mock AI service
* **Validation:** Joi
* **HTTP Client:** Axios
* **Circuit Breaker:** Opossum
* **Containerization:** Docker

---

## 📂 Project Structure

```
src/
 ├── config/         # Environment & DB config
 ├── controllers/    # Request handlers
 ├── services/       # Business logic
 ├── repositories/   # DB queries
 ├── middleware/     # Rate limit, requestId
 ├── utils/          # Cache, logger, retry
 ├── validators/     # Joi validation
 ├── routes/         # API routes
 ├── errors/         # Custom error classes
 └── server.js       # Entry point
```

---

## 🗄️ Database Design

### Table: `business_context`

* Stores tenant-specific context (JSONB)

### Table: `query_logs`

* Stores request logs and responses

### Key Design Decision:

* Used **JSONB** for flexible schema
* Indexed `tenant_id` for fast lookup

---

## 🔌 API Endpoints

### 1. Create Insight

**POST** `/api/v1/insight-query`

#### Request:

```json
{
  "tenantId": "tenant_retail_india",
  "queryText": "sales trend"
}
```

#### Response:

```json
{
  "status": "SUCCESS",
  "insight": "Insight text...",
  "latencyMs": 120,
  "requestId": "req-123"
}
```

---

### 2. Health Check

**GET** `/api/health`

#### Response:

* Database status
* AI service status
* Latency metrics

---

## ⚙️ Key Features

### ✅ Multi-Tenant Support

* Tenant-specific context retrieval
* No cross-tenant data leakage (via query filtering)

---

### ✅ Failure Handling

Handled scenarios:

* AI timeout
* Network failure
* Invalid response
* Circuit breaker open

Techniques used:

* Retry with exponential backoff
* Circuit breaker (Opossum)
* Graceful error handling

---

### ✅ Caching

* In-memory cache with TTL
* Reduces repeated AI calls
* Improves response time

---

### ✅ Rate Limiting

* Global rate limiting (IP-based)
* Tenant-level rate limiting

Purpose:

* Prevent abuse
* Ensure fairness

---

### ✅ Logging (Structured)

* JSON-based logs
* Includes:

  * requestId
  * tenantId
  * latency
  * error details

---

### ✅ Validation

* Request validation using Joi
* Prevents invalid input and malformed requests

---

## 🔐 Security Considerations

Current:

* Input validation
* Parameterized queries (prevents SQL injection)

Recommended improvements:

* Add JWT authentication
* Extract tenantId from token (not request)
* Use Redis-based rate limiting
* Add RBAC (Role-Based Access Control)

---

## ⚡ Performance Considerations

* Indexed database queries
* Cache layer to reduce DB + AI load
* Retry with backoff to avoid overload

Future improvements:

* Redis cache (distributed)
* Query optimization for JSONB
* Horizontal scaling support

---

## 🐳 Running the Project

### 1. Install dependencies

```
npm install
```

### 2. Setup environment variables

Create `.env` file:

```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=insight_db

AI_SERVICE_URL=http://localhost:4000/mock-ai
AI_TIMEOUT_MS=1000
```

---

### 3. Run server

```
npm start
```

---

### 4. Run Mock AI Service

```
node src/utils/mock-ai-server.js
```

---

### 5. Using Docker

```
docker-compose up --build
```

---

## 🧪 Testing

* Tested using Postman
* Covers:

  * Success flow
  * Failure scenarios
  * Timeout handling
  * Rate limiting

---

## ⚠️ Known Limitations

* In-memory cache (not distributed)
* No authentication implemented
* Basic rate limiting (not production distributed)
* No automated test suite

---

## 📈 Future Improvements

* Redis for caching and rate limiting
* Authentication & authorization (JWT)
* Advanced monitoring (Prometheus/Grafana)
* CI/CD pipeline
* Load testing

---

## 🧾 Final Note

This project focuses on **engineering decisions and production thinking**, including:

* Failure handling
* Scalability considerations
* Clean architecture

The goal was to demonstrate **practical backend design**, not just feature implementation.

