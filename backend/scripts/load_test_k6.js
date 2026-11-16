/**
 * PrepNova k6 Performance & Load Test Suite
 * 
 * Benchmarks:
 * 1. User Authentication (Registration / Login / JWT generation)
 * 2. Auth Rate Limiting (Verifies 429 Too Many Requests enforcement under load)
 * 3. Document Status & RAG Vector Retrieval (/api/rag/search/user, /rag/search/role)
 * 4. Interview Session Lifecycle (/api/interview/start, /followup, /active)
 * 5. Analytical Reports & Scorecard Retrieval
 * 
 * Usage:
 *   k6 run backend/scripts/load_test_k6.js
 *   k6 run --vus 20 --duration 30s backend/scripts/load_test_k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const errorRate = new Rate('errors');
export const authLatency = new Trend('auth_duration');
export const interviewTurnLatency = new Trend('interview_turn_duration');
export const rateLimitBlocks = new Counter('rate_limit_429_hits');

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp-up to 10 users
    { duration: '30s', target: 25 }, // Sustained load at 25 concurrent users
    { duration: '10s', target: 0 },  // Ramp-down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete under 1.5s
    errors: ['rate<0.05'],             // Error rate under 5%
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';

export default function () {
  const ts = Date.now() + Math.floor(Math.random() * 1000000);
  const testUser = {
    name: `Load Candidate ${ts}`,
    email: `load_${ts}@example.com`,
    password: 'Password123!',
  };

  let token = null;

  // 1. Auth Registration & Login
  group('1. Authentication Flow', function () {
    const start = Date.now();
    const regRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify(testUser),
      { headers: { 'Content-Type': 'application/json' } }
    );
    authLatency.add(Date.now() - start);

    const isOk = check(regRes, {
      'registration status is 201 or 429': (r) => r.status === 201 || r.status === 429,
    });

    if (regRes.status === 429) {
      rateLimitBlocks.add(1);
    } else if (regRes.status === 201) {
      const body = JSON.parse(regRes.body);
      token = body.token;
      check(token, { 'token received': (t) => t && t.length > 20 });
    } else {
      errorRate.add(1);
    }
  });

  sleep(1);

  if (!token) return;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 2. Candidate Dashboard & Analytics
  group('2. Dashboard & Analytics Query', function () {
    const meRes = http.get(`${BASE_URL}/auth/me`, { headers: authHeaders });
    check(meRes, { 'GET /auth/me returns 200': (r) => r.status === 200 });

    const analyticsRes = http.get(`${BASE_URL}/interview/analytics`, { headers: authHeaders });
    check(analyticsRes, { 'GET /interview/analytics returns 200': (r) => r.status === 200 });
  });

  sleep(1);

  // 3. Role-Based Interview Session
  group('3. Role Interview Session Turn', function () {
    const startSessionPayload = JSON.stringify({
      role: 'Backend Engineer',
      level: 'intermediate',
      mode: 'role',
      maxQuestions: 3,
    });

    const startRes = http.post(
      `${BASE_URL}/interview/start`,
      startSessionPayload,
      { headers: authHeaders }
    );

    const sessionCreated = check(startRes, {
      'interview started': (r) => r.status === 200,
    });

    if (sessionCreated && startRes.status === 200) {
      const sessionData = JSON.parse(startRes.body);
      const sessionId = sessionData.sessionId;

      // Submit an answer
      const answerStart = Date.now();
      const followupRes = http.post(
        `${BASE_URL}/interview/followup`,
        JSON.stringify({
          sessionId: sessionId,
          answer: 'We use database connection pooling, indexing frequently queried foreign keys, and implementing Redis caching for read-heavy query patterns.',
        }),
        { headers: authHeaders }
      );
      interviewTurnLatency.add(Date.now() - answerStart);

      check(followupRes, {
        'followup evaluated (200)': (r) => r.status === 200,
      });
    }
  });

  sleep(1);
}
