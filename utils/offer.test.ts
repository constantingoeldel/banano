import { Database } from "./db";
import { getOffer } from "./offer";

describe("Testing offer generation", () => {
  it("Builds a custodial offer", async () => {
    const db = await new Database().connect();
    const source = await db.getSource("sid_QusETE1e0LtWsR2_a0BHQ");
    const offer = source && (await getOffer(source, 1));
    expect(offer).toBeTruthy();
  });
});
