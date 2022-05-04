import handleWebhook from "../pages/api/paymentSucceeded";

describe("Test webhook response", () => {
  it("Rejects paymentIntents that don't exist", async () => {
    const response = await paymentSucceeded("fake_payment_intent_id");
    expect(response).toBe(400);
  });

  it("Rejects paymentIntents that were already handled", async () => {
    const response = await paymentSucceeded("pi_3KsZxDDJ4WsOC9lD038dk8aG");
    expect(response).toBe(400);
  });
});
