# 🚀 Context-Aware Insight Service

A resilient backend service that generates AI-driven insights using tenant-specific context, with production-grade fault tolerance mechanisms like retry, timeout handling, and circuit breaker.

---

#  What This System Actually Solves

Most AI integrations fail in real-world systems due to:
- Slow responses (timeouts)
- Intermittent failures
- Cascading failures under load
- Lack of tenant isolation

This system is designed to explicitly handle these problems.

---

#  End-to-End Request Flow

Client → Controller → Service Layer → Cache → DB → Retry → Circuit Breaker → AI Service → Response → Cache → Client

---

# 🔍 Detailed Execution Flow

## Step 1: Request Received
- Request is validated
- requestId generated for tracing

## Step 2: Cache Layer
- Key = tenantId + queryText
- Cache hit → return immediately
- Cache miss → continue

## Step 3: Tenant Context Fetch
- Fetch context from DB
- Ensures tenant-specific behavior

## Step 4: Retry Mechanism
- Exponential backoff:
  delay = baseDelay * (2^attempt)

## Step 5: Circuit Breaker
- Opens when failure threshold reached
- Prevents further load on AI

## Step 6: AI Call
- Axios with timeout
- Handles timeout, network, and response errors

## Step 7: Response Handling
- Success → cache result
- Failure → structured error returned

---

#  Environment Configuration

Create a `.env` file:

PORT=3000

DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=insight_db_v2

AI_SERVICE_URL=http://ai:4000/mock-ai
AI_TIMEOUT_MS=1000

RETRY_COUNT=2
RETRY_DELAY_MS=100

AI_FAILURE_RATE=0
AI_DELAY_MS=200

---

#  How to Run

docker compose up --build

---

#  API Endpoint

POST http://localhost:3001/api/v1/insight-query

Request Body:

{
  "tenantId": "tenant_retail_india",
  "queryText": "sales trend"
}

---

#  COMPLETE TESTING GUIDE

## 1. Success Case

Config:
AI_FAILURE_RATE=0  
AI_DELAY_MS=200  

Expected:
- status: SUCCESS
- cached: false (first call)
- cached: true (second call)

---

## 2. Cache Validation

Steps:
1. Send same request twice

Expected:
- First → CACHE MISS
- Second → CACHE HIT

---

## 3. AI Failure + Retry

Config:
AI_FAILURE_RATE=1  

Expected:
- Retry attempts in logs
- RETRY_EXHAUSTED
- Final failure response

---

## 4. Timeout Case

Config:
AI_DELAY_MS=3000  
AI_TIMEOUT_MS=1000  

Expected response:

{
  "status": "error",
  "message": "AI request timed out after retries",
  "meta": {
    "type": "TIMEOUT",
    "timeoutMs": 1000,
    "retryCount": 2
  }
}

---

## 5. Circuit Breaker

Steps:
1. Set AI_FAILURE_RATE=1
2. Send multiple requests

Expected:
{
  "type": "BREAKER_OPEN"
}

---

## 6. Multi-Tenant Behavior

Test with:

tenant_retail_india  
tenant_healthcare_india  

Expected:
- Different results
- No cache collision

---

## 7. Invalid Input

Send empty body:

{}

Expected:
- 400 validation error

---

#  Security Considerations

- Input validation prevents malformed requests
- Tenant-aware cache prevents data leakage
- Structured error responses avoid exposing internals
- Circuit breaker protects downstream services

---

# What Is Implemented Beyond Exercise

- Retry with exponential backoff
- Circuit breaker (Opossum)
- Structured error propagation
- Observability with requestId logging
- AI failure simulation (AI_FAILURE_RATE)
- Timeout simulation (AI_DELAY_MS)
- Dockerized setup

---

#  Design Trade-offs

## In-memory Cache
+ Fast  
- Not scalable (no Redis)

## Retry
+ Handles transient failures  
- Adds latency

## Circuit Breaker
+ Protects system  
- Temporary rejection of requests

---

#  Limitations

- No Redis cache
- No rate limiting
- No distributed tracing
- No async queue

---

#  Future Improvements

- Redis caching
- Queue-based processing
- Tenant rate limiting
- Metrics and monitoring

---

#  Final Note

This system is designed for failure scenarios, not just success paths.

It demonstrates:
- Resilience
- Fault tolerance
- Production-grade backend thinking

---

# 👨‍💻 Author
Susmita Jdhav
