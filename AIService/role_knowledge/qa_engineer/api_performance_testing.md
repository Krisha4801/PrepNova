# Quality Assurance: API Testing, Performance, and Security Validation

## Automated API Testing
- REST & GraphQL Test Automation: validating status codes, response payloads against JSON schemas, header assertions, and authentication headers (Postman/Newman, REST Assured, Supertest).
- Contract Testing (Pact): consumer-driven contracts verifying that microservices do not break API consumers without spinning up full environments.
- Idempotency & Negative Testing: sending malformed JSON, boundary values, invalid auth tokens, and unexpected types to verify graceful 4xx error handling.

## Performance and Load Testing
- Testing Profiles:
  - Smoke Testing: minimal load to verify system functions under basic traffic.
  - Load Testing: assessing performance under expected peak concurrent user loads.
  - Stress Testing: pushing system beyond breaking points to observe failure modes and memory leaks.
  - Spike Testing: sudden dramatic traffic surges (e.g. flash sales).
  - Soak / Endurance Testing: sustained average load over 12-24 hours to uncover connection pool exhaustion or memory degradation.
- Load Tools: k6, JMeter, Locust; measuring p95, p99 latency percentiles and error rates.
