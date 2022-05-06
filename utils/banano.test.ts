import { getRateEUR, receivePending, sendBanano, verifyTransaction } from "./banano";

describe("Get the current exchange rate", () => {
  it("should return the exchange rate", async () => {
    const exchangeRate = await getRateEUR();
    expect(exchangeRate).toBeGreaterThan(0);
  });
});

describe("Transaction validation", () => {
  it("Validates a transaction", async () => {
    const result = await verifyTransaction(
      "EE41976A6281F6E8F22B9A3EDED75C3390F16AAD727BE10981DF9F723BD89A34",
      "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
      150
    );
    expect(result).toBe(true);
  });
  it.only("Validates a transaction to itself", async () => {
    const result = await verifyTransaction(
      "73590EA067914B416DFCFDF5190FD5F996C07A2FAFA68DC5A013E6CAE46C37E5",
      "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
      0.01
    );
    expect(result).toBe(true);
  });
  it("Rejects a falsy hash", async () => {
    const result = await verifyTransaction(
      "EE41976A6281F6E8F22B9A3EDED75C3390F16AAD727BE10981DF9F723BD89A37",
      "ban_18p3senih3iwwt46imcdb6wd1t1r35wrzd1hki9aog9ak3xpa7ifpo6iuh69",
      150
    );
    expect(result).toBe(false);
  });
  it("Rejects a falsy amount", async () => {
    const result = await verifyTransaction(
      "EE41976A6281F6E8F22B9A3EDED75C3390F16AAD727BE10981DF9F723BD89A34",

      "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
      1000
    );
    expect(result).toBe(false);
  });
  it("Rejects a falsy recipient", async () => {
    const result = await verifyTransaction(
      "EE41976A6281F6E8F22B9A3EDED75C3390F16AAD727BE10981DF9F723BD89A34",
      "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",

      150
    );
    expect(result).toBe(true);
  });
});

describe("Send BAN", () => {
  it("Sends BAN", async () => {
    await receivePending(process.env.SEED!);

    const hash = await sendBanano(
      1,
      "ban_18cs318fp9dgqhqy6or3pdebrkgkqifyodwxwymg1jcpxdskow7qq9bej7hb",
      process.env.SEED!
    );
    await receivePending(process.env.SEED!);
    const result = await verifyTransaction(
      hash,
      "ban_18cs318fp9dgqhqy6or3pdebrkgkqifyodwxwymg1jcpxdskow7qq9bej7hb",
      1
    );
    expect(result).toBe(true);
  });
});
