const problem = {
  id: 1,
  title: 'Parking Lot System',
  description: 'Design a parking lot.',
  constraints: 'Support multiple floors.',
  difficulty: 'Medium',
}

const evaluation = {
  id: 1,
  status: 'Completed',
  overall_summary: 'Solid class breakdown with clear responsibilities.',
  scores: [
    {
      criterion: 'Class Responsibilities',
      score: 4,
      evidence: 'Named ParkingLot and Ticket.',
      concern: '',
      suggestion: 'Add an interface for payment.',
    },
  ],
}

const submittedAttempt = {
  id: 10,
  problem_id: 1,
  status: 'Completed',
  started_at: '2026-09-09T12:00:00',
  submitted_at: '2026-09-09T12:05:00',
  submission_content: 'Classes and responsibilities for a parking lot design.',
  evaluation,
}

describe('LLD practice loop', () => {
  it('lists a problem, submits a design, and shows it in history', () => {
    cy.intercept('GET', /\/api\/problems\/?$/, [problem]).as('listProblems')
    cy.intercept('GET', /\/api\/problems\/1$/, problem).as('getProblem')
    cy.intercept('POST', /\/api\/attempts\/\d+\/submit$/, submittedAttempt).as('submit')
    cy.intercept('POST', /\/api\/attempts\?/, { id: 10, status: 'InProgress' }).as('start')
    cy.intercept('GET', /\/api\/attempts\?learner_id=/, [submittedAttempt]).as('history')

    cy.visit('/')
    cy.wait('@listProblems')
    cy.get('[data-testid="problem-card"]').contains('Parking Lot System').click()

    cy.wait('@getProblem')
    cy.wait('@start')
    cy.get('[data-testid="design-textarea"]').type(
      'Classes: ParkingLot, Ticket. Responsibilities: assign spots. Requirements: multi-floor.'
    )
    cy.get('[data-testid="submit-btn"]').click()
    cy.wait('@submit')

    cy.get('[data-testid="feedback-view"]').should('contain', 'Solid class breakdown')
    cy.get('[data-testid="rubric-card"]').should('contain', '4/5')

    cy.contains('My Attempts').click()
    cy.wait('@history')
    cy.get('[data-testid="history-row"]').should('contain', 'Completed')
  })
})
