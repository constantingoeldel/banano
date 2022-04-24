import banano from "@bananocoin/bananojs";
import { verifyTransaction } from "./banano";
import { getOrder } from "./db";

describe("Testing Banano utilities", () => {
  beforeEach(() => {
    banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  });
  it("Validates a transaction", async () => {
    const result = await verifyTransaction(
      "EE41976A6281F6E8F22B9A3EDED75C3390F16AAD727BE10981DF9F723BD89A34",
      {
        timestamp: 1650814943454,
        offer: {
          source_id: "sid_QusETE1e0LtWsR2_a0BHQ",
          offer_id: "oid_Fi8mVq8zLxKObbzxpUCS9",
          balance: 199,
          rate: 0.014996223,
          name: "Banano Marketplace",
        },
        source: {
          id: "sid_QusETE1e0LtWsR2_a0BHQ",
          secret: "secret_3dg334o7UC3dKAe8QeRLM",
          email: "constantingoeldel@gmail.com",
          name: "Banano Marketplace",
          account: "acct_1Ks7C2Rk3GVm1OPC",
          active: true,
          custodial: true,
          address: "ban_18p3senih3iwwt46imcdb6wd1t1r35wrzd1hki9aog9ak3xpa7ifpo6iuh69",
          seed: "a9137c020dadf768c51bd683eed312c538f9fd75cb2802d4516329dfa15a047e",
          price: { min: 1, margin: 1.1, market: true },
        },
        transferGroup: "tid_E-qakeA89EmaokLldvci3",
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        paymentIntent: "pi_3Ks7ZrDJ4WsOC9lD0aCq7hPP",
        amount: 150,
        price: 250,
        status: "failed",
        test: false,
      }
    );
    expect(result).toBe(true);
  });
});
