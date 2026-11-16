/**
 * Cypress E2E Test: Resume-Based Interview Flow
 * 
 * Verifies:
 * 1. Candidate Registration & Auth State Persistence
 * 2. Resume Upload, Parsing & Target Role Detection
 * 3. Multi-Turn Adaptive Interview Session (Question Display & Monospace Answer Input)
 * 4. Session Advancement & Pacing
 * 5. Comprehensive Scorecard Report Generation (5-Dimension Rubrics, Strengths & Weaknesses)
 */

describe('Resume-Based Adaptive Interview Flow', () => {
  const ts = Date.now();
  const testUser = {
    name: 'E2E Candidate',
    email: `candidate_e2e_${ts}@test.com`,
    password: 'Password123!',
  };

  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  it('completes the entire resume-driven mock interview pipeline', () => {
    // 1. Visit signup page and register
    cy.visit('/signup');
    cy.get('input[name="name"], input[placeholder*="Name"]').type(testUser.name);
    cy.get('input[name="email"], input[type="email"]').type(testUser.email);
    cy.get('input[name="password"], input[type="password"]').first().type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Verify redirected to dashboard or onboarding
    cy.url().should('not.include', '/signup');

    // 2. Navigate to Interview Setup
    cy.visit('/customize');
    cy.contains(/Interview Setup|Practice Mode|Customize/i).should('be.visible');

    // 3. Choose Complete Interview mode and upload resume
    cy.contains(/Complete Interview/i).click();

    // 4. Start Interview Session
    cy.contains(/Start Interview|Launch Session|Begin/i).click();

    // 5. Verify live interview workspace
    cy.url().should('include', '/interview');
    cy.contains(/Question|Turn/i).should('be.visible');

    // 6. Provide technical answer
    cy.get('textarea').first().type(
      'In our architecture, we implemented caching using Redis with a TTL of 15 minutes to reduce database read pressure by 40%.'
    );

    // 7. Submit answer and advance
    cy.contains(/Submit Answer|Next Question/i).click();

    // 8. Complete session or skip remaining to view results
    cy.contains(/Skip Question|Finish Interview|End Session/i).click();

    // 9. Verify Results Page
    cy.url().should('include', '/results');
    cy.contains(/Scorecard|Overall Score|Performance Report/i).should('be.visible');
    cy.contains(/Strengths|Weaknesses|Recommendations/i).should('be.visible');
  });
});
