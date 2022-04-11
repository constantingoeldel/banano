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

describe("Banano", () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit("localhost:3000");
  });

  it("Displays the headline", () => {
    cy.contains("Buy Banano with fiat directly");
  });

  it("Can navigate to the test page", () => {
    cy.contains("I want to try it out first").click();
    cy.url().should("include", "/test");
  });

  it("Can navigate to the video page", () => {
    cy.contains("Check this video to see how it works").click();
    cy.url().should("include", "/video");
  });

  it("Can fill out the form", () => {
    cy.contains("What address").click().type("bananoaddress");
    cy.contains("desired amount").click().type("1");

    // Check for bad data
    cy.contains("Checkout").click();
    cy.get("input:invalid").should("have.length", 2);
    cy.get("#address")
      .clear()
      .type("ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3");
    cy.contains("Checkout").click();
    cy.get("input:invalid").should("have.length", 1);
    cy.get("#amount").clear().type("1000");
    cy.contains("Checkout").click();

    cy.url().should("include", "/checkout");
  });
});

describe.only("payment", () => {
  let url =  'localhost:3000/test'
  it("Can fill out the form", () => {
    cy.visit('localhost:3000/test');
      cy.contains("address")
      .click()
      .type("ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3");
    cy.contains("desired amount").click().type("100");

    cy.get("#checkout-button").click();

    cy.url().should("contains", "https://checkout.stripe.com/pay/");
    url = cy.url();

    //   cy.request({
    //     method: "POST",
    //     url: "http://localhost:3000/test/api/checkout",
    //     followRedirect: false,
    //     body: {
    //       test: true,
    //       address:
    //         "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
    //       amount: "100",
    //     },
    //   }).then((resp) => {
    //     expect(resp.status).to.eq(303);
    //     expect(resp.redirectedToUrl).to.contain(
    //       "https://checkout.stripe.com/pay/cs_test_"
    //     );
    //     url = resp.redirectedToUrl;
  });
  // });

  it("Pays", () => {
    cy.visit({ url: url,method: "GET" });
    cy.url().should("contains", "https://checkout.stripe.com/pay/");

    cy.get("#email").type("SatoshiNakamoto@email.com");
    cy.get("#cardNumber").type("4242424242424242");
    cy.get("#cardCvc").type("123");
    cy.get("#cardExpiry").type(
      "12" + (new Date().getFullYear() + 10).toString().substr(-2)
    );
    cy.get("#billingName").type("Satoshi Nakamoto");

    cy.wait(1000);
    cy.get(".SubmitButton").should(($div) => {
      expect($div.text()).to.include("Zahlen");
    });
    cy.get(".SubmitButton").click();
    cy.get(".SubmitButton").should(($div) => {
      expect($div.text()).to.include("Processing");
    });
  });
});
