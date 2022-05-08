import getDB from "./db";
import { custodialUnboarding, manualUnboarding, sendMail } from "./mail";

describe("Mail sending", () => {
  it("Sends an email to a custodial source", async () => {
    const db = await getDB();
    const source = await db.activateSource("acct_1KxHqMDIsbe3Y98Z");
    console.log(source);
    if (source) {
      source.custodial
        ? await sendMail(custodialUnboarding(source), source.email, true)
        : await sendMail(manualUnboarding(source), source.email, true);
    }
  });
  it("Sends an email to a custodial source", async () => {
    const db = await getDB();
    const source = await db.activateSource("acct_1KxAyVRe2O2iZUjU");
    console.log(source);
    if (source) {
      source.custodial
        ? await sendMail(custodialUnboarding(source), source.email, true)
        : await sendMail(manualUnboarding(source), source.email, true);
    }
  });
});
