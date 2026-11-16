# PrepNova test coverage matrix

This matrix compares the revised testing PDF with the tests and tooling currently in the repository. A test file being present means automated coverage exists for that behavior; it does not mean that every variation in the PDF has been exercised or that the test passed in this environment. Run evidence belongs to a specific build and environment.

Latest local run: backend unit tests reported **106 tests across 28 suites, 0 failures**; the AI service suite reported **30 tests passed**. The 30 figure is the AI service test count, not the Node suite count.

## Automated coverage

| PDF area / examples | Current automated coverage | Current evidence / limitation |
|---|---|---|
| UT-01 auth payload validation | `backend/tests/unit/validator.test.js`; `backend/tests/integration/auth.test.js` | Unit tests run without services; integration tests require MongoDB. |
| UT-02 JWT signing and rejection | `backend/tests/unit/jwt.test.js`; `backend/tests/unit/middleware.test.js` | Unit covered. |
| UT-03 OAuth state, nonce, replay, identity | `backend/tests/unit/oauth.state.test.js`, `oauth.provider.test.js`, `oauth.identity.test.js`; `backend/tests/integration/oauth.test.js` | Unit covered; route integration requires MongoDB. External OAuth is stubbed in deterministic runs. |
| UT-04 interview scoring and answer behavior | `backend/tests/unit/interview.scoring.test.js`, `interview.followup.test.js`, `interview.filler_dedup.test.js` | Answer-quality regression covered. Live model evaluation is not deterministic. |
| UT-05 upload validation | `backend/tests/integration/ai_rag_integration.test.js`; upload middleware implementation | Integration coverage needs MongoDB and service dependencies; more malformed/size boundary cases may be added. |
| UT-06 AI client failures and response mapping | `backend/tests/unit/aiService.client.test.js` | Automated unit coverage. |
| Auth API: register, login, profile, duplicate and malformed input | `backend/tests/integration/auth.test.js` | Requires MongoDB at `prepnova_test`. |
| OTP/password reset | `backend/tests/unit/otp.test.js`; `backend/tests/integration/forgot_password.test.js` | Unit covered; API integration requires MongoDB and controlled email configuration. |
| OAuth API and replay | `backend/tests/integration/oauth.test.js`; OAuth unit suites | Integration requires MongoDB; provider network calls should be mocked. |
| Interview start, follow-up, skip, end, history, report | `backend/tests/integration/interview_flow.test.js`, `dynamic_counts_and_transitions.test.js`, `edge_cases.test.js`; relevant unit suites | Requires MongoDB; AI provider is stubbed. |
| Resume/JD ownership, extraction, RAG boundaries | `backend/tests/integration/ai_rag_integration.test.js` | Requires MongoDB; FastAPI/RAG integration coverage is not proof that every PDF route is deployed in the Node request path. |
| FastAPI interview and section batch contracts | `AIService/tests/test_contracts.py`, `test_section_batch.py`, `test_followup_decision.py`, `test_count_modes.py`, `test_dynamic_counts.py` | `unittest` suite runs with deterministic fixtures and mocked LLM calls. |
| Topic-only interview, including a custom topic | Backend validator coverage in `backend/tests/unit/interview.contracts.test.js`; route test in `backend/tests/integration/dynamic_counts_and_transitions.test.js`; AI blueprint test in `AIService/tests/test_contracts.py` | Selection validation and AI blueprint tests run without MongoDB. Route persistence test requires MongoDB. Only selected topics should appear in the blueprint. |
| Punctuated non-answer recognition | `backend/tests/unit/interview.scoring.test.js` | Confirms short explicit non-answers with punctuation are detected and substantive answers are not. |
| Test database records and ownership | Integration fixtures create synthetic users/sessions in test suites | There is no general-purpose seed/reset fixture script in the repository. Integration setup/cleanup is test-specific. |

## Manual or specialized checks

The PDF also lists checks that are not covered by a backend unit/API test runner. `frontend/package.json` exposes Vite build/dev/preview scripts, but no browser automation runner is configured.

| PDF area | How to verify it | Current automation status |
|---|---|---|
| UI-01 responsive layout | Manually inspect auth, dashboard, interview, and report at mobile/tablet/desktop sizes; record browser and viewport. | Manual; no browser runner configured. |
| UI-02 form validation and recovery | Browser flow for empty/invalid/valid forms and server/network failures. | Manual; no browser runner configured. |
| UI-03 interview journey and reload | Run selected/full interview in browser, answer/skip/reload/finish, inspect retained state. | Manual browser flow; backend lifecycle has automated integration tests. |
| UI-04 document uploads | Use valid and invalid resume/JD files and check progress/error/success states. | Manual UI flow; API validation has partial automated coverage. |
| UI-05 accessibility | Keyboard and screen-reader review, focus, labels, contrast, and async announcements. | Manual/specialized tooling required. |
| NFR-01 security | API auth/ownership tests plus separate dependency/static scan and sanitized-log review. | Some auth/ownership API automation exists; no full security scan in package scripts. |
| NFR-02 performance | Load profile and measure p50/p95/p99, throughput, errors, and AI latency against agreed targets. | Requires a load tool/environment; not currently scripted. |
| NFR-03 reliability/recovery | Restart API/database and inject AI/email timeouts; verify persistence and retries. | Partial service-failure unit tests; restart/recovery remains manual/staging. |
| NFR-04 browser compatibility | Execute browser matrix (Chrome/Edge/Firefox, Safari if supported). | Manual; no cross-browser runner configured. |
| NFR-05 data integrity | Compare stored state before/after completion, deletion, and retry. | Partial integration DB assertions; requires MongoDB. |
| NFR-06 WCAG 2.2 AA | Accessibility review and assistive-technology checks. | Manual/specialized tooling required. |

## Run commands

From `backend`:

```powershell
node --test --test-concurrency=1 tests/unit/*.test.js
npm test
npm run test:e2e
```

`npm test` includes MongoDB-backed integration tests and requires an isolated MongoDB database at `mongodb://127.0.0.1:27017/prepnova_test`. `npm run test:e2e` requires a running backend and configured dependencies; it performs live writes using timestamped synthetic accounts.

From `AIService`:

```powershell
python -m unittest discover -s tests -p 'test_*.py' -v
```

From `frontend`:

```powershell
npm run build
```

The revised PDF includes pass labels in sections whose own notes say the checks are pending, illustrative, or not rerun. Treat those labels as document/report content, not current execution evidence. In particular, a passing test command proves only the cases that the repository actually contains and that ran successfully.
