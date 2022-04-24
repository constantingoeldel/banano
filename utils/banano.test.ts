import banano from "@bananocoin/bananojs";
import { verifyTransaction } from "./banano";
import { getOrder } from "./db";

describe("Testing Banano utilities", () => {
  beforeEach(() => {
    banano.setBananodeApiUrl("https://kaliumapi.appditto.com/api");
  });
  it("Validates a transaction", async () => {
    const result = await verifyTransaction(
      "116D25A1790D3C346B8598EA3F04DF5DE2483AC458626E9EEE64773C192D53D8",
      {
        timestamp: 1650803568463,
        offer: {
          source_id: "sid_VdAYg41u2d2OzxEpIu_Tt",
          offer_id: "oid_JInrwPAHVH2nOy7wuxWnG",
          balance: 199,
          rate: 0.015222471000000001,
          name: "Default",
        },
        source: {
          id: "sid_VdAYg41u2d2OzxEpIu_Tt",
          secret: "secret_E8qnMVTyBoBUqY9cjF1rC",
          email: "constantin_goeldel@t-online.de",
          name: "Default",
          active: true,
          custodial: true,
          address: "ban_3ku7e7jmgdj6rssjye54kfoi364oiazojknb59gfjy35zxkd79s6d7csric7",
          seed: "44ed626cadda481949e1feabc40b4ec782b6f78baef525dea287ffcec03fe48d",
          price: { min: 1, margin: 1.1, market: true },
          account: "acct_1KrPlnRVdAGrTdPb",
        },
        transferGroup: "tid_a1eq9dKOdEdc1sMcKADIw",
        address: "ban_3acd3zmisj5nzxn673upfecp6hbbr9snwhomyixoja17mswsju3h9rja3df3",
        paymentIntent: "pi_3Ks4cNDJ4WsOC9lD14RIwDGE",
        amount: 0.01,
        price: 178,
        status: "invalid hash",
        test: true,
      }
    );
    expect(result).toBe(true);
  });
});
