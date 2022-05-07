import paymentSucceeded from "../pages/api/paymentSucceeded";

describe.skip("Test webhook response", () => {
  it("Rejects paymentIntents that don't exist", async () => {
    const response = await paymentSucceeded("fake_payment_intent_id");
    console.log("Response:", response);
    expect(response).toBe("Order fake_payment_intent_id not found");
  });

  it("Rejects paymentIntents have the wrong origin", async () => {
    const response = await paymentSucceeded("pi_3KsZxDDJ4WsOC9lD038dk8aG");
    expect(response).toBe("Order pi_3KsZxDDJ4WsOC9lD038dk8aG is not from the correct origin");
  });
  it("Rejects payments that have the wrong hash", async () => {
    const response = await paymentSucceeded("pi_3Kw7PFDJ4WsOC9lD18XfNNe0");
    expect(response).toBe("Order pi_3Kw7PFDJ4WsOC9lD18XfNNe0 has an invalid hash");
  });
  it("Succeeds for test payment", async () => {
    const response = await paymentSucceeded("pi_3Kug5fDJ4WsOC9lD0vBAsQHL");
    expect(response).toBe("Success");
  });
  it("Marks for retry when payout is larger than current balance", async () => {
    const response = await paymentSucceeded("pi_3Kw7XfDJ4WsOC9lD0AUgEH0J");
    expect(response).toBe(
      "Order pi_3Kw7XfDJ4WsOC9lD0AUgEH0J has a payout larger than the current balance"
    );
  });
});
