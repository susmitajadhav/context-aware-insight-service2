-- =========================
-- TABLE: business_context
-- =========================
CREATE TABLE IF NOT EXISTS business_context (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100) UNIQUE NOT NULL,
  context JSONB NOT NULL
);

-- =========================
-- INDEX (CRITICAL for scaling)
-- =========================
CREATE INDEX IF NOT EXISTS idx_business_context_tenant
ON business_context(tenant_id);


-- =========================
-- TABLE: query_logs
-- =========================
CREATE TABLE IF NOT EXISTS query_logs (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100),
  query_text TEXT,
  response TEXT,
  latency_ms INT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- INDEXES (Production Thinking)
-- =========================
-- Fast filtering by tenant
CREATE INDEX IF NOT EXISTS idx_query_logs_tenant
ON query_logs(tenant_id);

-- Fast time-based queries (logs, monitoring)
CREATE INDEX IF NOT EXISTS idx_query_logs_created_at
ON query_logs(created_at);


-- =========================
-- SAMPLE DATA (Meaningful Multi-Tenant)
-- =========================
INSERT INTO business_context (tenant_id, context)
VALUES
-- Retail
('tenant_retail_india', '{"industry": "retail", "region": "India"}'),
('tenant_retail_us', '{"industry": "retail", "region": "US"}'),

-- Finance
('tenant_finance_us', '{"industry": "finance", "region": "US"}'),
('tenant_banking_eu', '{"industry": "banking", "region": "EU"}'),

-- Healthcare
('tenant_health_uk', '{"industry": "healthcare", "region": "UK"}'),
('tenant_health_india', '{"industry": "healthcare", "region": "India"}'),

-- Ecommerce
('tenant_ecommerce_india', '{"industry": "ecommerce", "region": "India"}'),
('tenant_ecommerce_us', '{"industry": "ecommerce", "region": "US"}'),

-- Insurance
('tenant_insurance_uk', '{"industry": "insurance", "region": "UK"}')

ON CONFLICT (tenant_id) DO NOTHING;

