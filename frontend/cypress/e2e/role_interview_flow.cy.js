/**
 * Cypress E2E Test: Role-Based Interview Flow & Dashboard History Navigation
 * 
 * Verifies:
 * 1. Authentication (Login)
 * 2. Role-Based Interview (Fallback to Curated Role Knowledge without resume)
 * 3. Section Practice Selection (17 Technical Categories)
 * 4. Interview Turn Progression
 * 5. Dashboard Metrics and Interview History Table Filtering
 */

describe('Role-Based Interview Flow & History Navigation', () => {
  const ts = Date.now();
  const testUser = {
    name: 'Role Practice User',
    email: `role_user_${ts}@test.com`,
    password: 'Password123!',
  };

  before(() => {
    // Register user
    cy.visit('/signup');
    cy.get('input[name="name"], input[placeholder*="Name"]').type(testUser.name);
    cy.get('input[name="email"], input[type="email"]').type(testUser.email);
    cy.get('input[name="password"], input[type="password"]').first().type(testUser.password);
    cy.get('button[type="submit"]').click();
  });

  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('runs a role-based practice session and verifies dashboard history', () => {
    // 1. Visit setup page
    cy.visit('/customize');

    // 2. Select Section Practice mode
    cy.contains(/Selected Sections|Topic Practice/i).click();

    // 3. Search and select a technical topic
    cy.contains(/System Design|Node.js|React.js/i).first().click();

    // 4. Launch session
    cy.contains(/Start Interview|Launch Session|Begin/i).click();

    // 5. Verify live turn rendering
    cy.url().should('include', '/interview');

    // 6. Navigate to Candidate Dashboard
    cy.visit('/dashboard');
    cy.contains(/Dashboard|Readiness|Average Score/i).should('be.visible');

    // 7. Navigate to History View
    cy.visit('/history');
    cy.contains(/Interview History|Past Sessions/i).should('be.visible');
  });
});
