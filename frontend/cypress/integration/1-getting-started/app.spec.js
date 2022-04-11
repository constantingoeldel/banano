/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe('Banano', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('localhost:3000')
  })

  it('Displays the headline', () => {
    cy.contains("Buy Banano with fiat directly")
  })

  it('Can navigate to the test page', () => {
    cy.contains('I want to try it out first').click()
    cy.url().should('include', '/test')
  })

  it('Can navigate to the video page', () => {
    cy.contains('Check this video to see how it works').click()
    cy.url().should('include', '/video')
  })

  it('Can fill out the form', () => {
    cy.contains('What address').click().type("bananoaddress")
    cy.contains('desired amount').click().type("1")

    // Check for bad data
    cy.contains('Checkout').click()
  })

})

describe('Test payment', () => {
  beforeEach('Navigate to test page', () => {
    cy.visit('localhost:3000/test')
  })
  it('Can fill out the form', () => {
    cy.contains('address').click().type("ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3")
    cy.contains('desired amount').click().type("100")

    cy.contains('Test').click()
    cy.url().should('include', 'stripe')

  })

})