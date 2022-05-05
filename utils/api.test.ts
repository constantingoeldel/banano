import request from "supertest";

const req = request("localhost:3001");

describe("Get checkout", () => {
  it("Rejects unauthorized requests", async () => {
    const response = await req.get("/api/checkout");
    expect(response.status).toBe(401);
    expect(response.body.message).toEqual("captcha missing");
  });

  it("Rejects missing amount", async () => {
    const response = await req
      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid amount");
  });
  it("Rejects negative amount", async () => {
    const response = await req
      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: -200,
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid amount");
  });
  it("Rejects 0 amount", async () => {
    const response = await req
      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 0,
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid amount");
  });
  it("Rejects too large amount", async () => {
    const response = await req
      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 100_000_000,
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid amount");
  });
  it("Rejects missing address", async () => {
    const response = await req

      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 200,
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid address. Please provide a valid ban address");
  });
  it("Rejects invalid address", async () => {
    const response = await req

      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 200,
        address: "ban_invalid",
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid address. Please provide a valid ban address");
  });
  it("Rejects invalid address type", async () => {
    const response = await req

      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 200,
        address: 15,
        test: true,
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toEqual("Invalid address. Please provide a valid ban address");
  });
  it("Returns checkout url", async () => {
    const response = await req
      .get("/api/checkout")
      .auth(process.env.API_SECRET!, { type: "bearer" })
      .send({
        amount: 500,
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        test: true,
      });
    expect(response.body.message).toContain("checkout.stripe.com");
  });
});
