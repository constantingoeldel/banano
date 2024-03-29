import {
  getRateEUR,
  receivePending,
  sendBanano,
  sendNano,
  setNano,
  verifyTransaction,
} from "./banano";

describe("Get the current exchange rate", () => {
  it("should return the exchange rate", async () => {
    const exchangeRate = await getRateEUR();
    expect(exchangeRate).toBeGreaterThan(0);
  });
});

describe("Transaction validation", () => {
  beforeEach(() => setNano());
  it("Validates a transaction", async () => {
    const result = await verifyTransaction(
      "BC6F23CE8C403CBDC5A3DD36B0968E561EDAFE6A077E14F5B5E65B4291DA77FC",
      "nano_3ptywqi7rwnpo4w94txtu99eb38c3yitisme6d9grjtcdeeoiyocccsdt8hn",
      5.15795,
      "nano"
    );
    expect(result).toBe(true);
  });
});

describe("Send Nano", () => {
  it("Sends Nano", async () => {
    setNano();

    await receivePending(process.env.NANO_SEED!, "nano");
    console.log("got to sending");
    const hash = await sendNano(
      1,
      "nano_1tirutm5br89nj77y1p4bqgasm876pogwza8u9zb8a7uyyd4p1yajfe18bhr",
      process.env.NANO_SEED!
    );
    console.log("got to verifying");
    await receivePending(process.env.NANO_SEED!, "nano");
    const result = await verifyTransaction(
      hash,
      "nano_1tirutm5br89nj77y1p4bqgasm876pogwza8u9zb8a7uyyd4p1yajfe18bhr",
      1,
      "nano"
    );
    expect(result).toBe(true);
  });
});
