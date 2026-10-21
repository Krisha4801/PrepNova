# Quality Assurance: Test Automation Strategy and Modern Frameworks

## The Test Automation Pyramid
- Unit Tests (70%): fast, isolated function-level tests with mocked external I/O (Jest, Vitest, PyTest).
- Integration Tests (20%): verifying module contracts, database queries, and service boundary interactions (Testcontainers).
- End-to-End (E2E) Tests (10%): simulating realistic user workflows in headless browser environments (Playwright, Cypress).

## Modern E2E Testing Best Practices
- Resilient Element Selectors: prioritizing user-visible locators (`getByRole`, `getByLabel`, `getByText`) over brittle CSS classes or dynamic XPath.
- Flakiness Mitigation: auto-waiting locators, deterministic test data seeding, eliminating static sleep timers (`sleep(5)`).
- Page Object Model (POM): abstracting UI pages into reusable class objects to decouple test scenarios from layout changes.
- Parallel Test Execution & Sharding: running test suites across multiple CI worker containers.
