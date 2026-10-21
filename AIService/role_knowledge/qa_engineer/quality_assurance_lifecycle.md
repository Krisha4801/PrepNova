# Quality Assurance: Quality Lifecycle, Defect Management, and Shift-Left Testing

## Shift-Left Quality Strategy
- Shift-Left Principle: identifying defects at the requirements and design phases rather than post-deployment; three amigos meetings (Product, Development, QA) before sprint commitments.
- Behavior-Driven Development (BDD): Gherkin syntax (Given-When-Then) defining executable specifications and acceptance criteria (Cucumber, SpecFlow).
- Exploratory Testing: structured time-boxed charter-based testing exploring edge cases, state transitions, and usability quirks beyond scripted automated suites.

## Defect Triage & Severity Matrix
- Severity vs Priority:
  - Severity: technical impact of defect (Critical / Blocker, High, Medium, Low).
  - Priority: business urgency for remediation.
- Effective Bug Reporting: reproducible steps, expected vs actual behavior, network request/response HAR logs, browser console logs, system environment details.
- Root Cause Analysis (RCA): 5 Whys methodology, blameless post-mortems, and updating automated regression suites to prevent recurrence.
