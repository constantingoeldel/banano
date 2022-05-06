import { withIronSessionApiRoute } from "iron-session/next";
import { NextApiRequest, NextApiResponse, NextPageContext } from "next";
import { ironOptions } from "../../utils/auth";
import { confirmAccount } from "../../utils/banano";
import getDB from "../../utils/db";

export default withIronSessionApiRoute(loginRoute, ironOptions);

async function loginRoute(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDB();
    console.log("Received request to log in", req.session, req.query.address);
    if (req?.session.user) {
      res?.json({ ok: true });
      return;
    }
    const address = req.query.address as string;
    if (!address) {
      res?.json({ ok: false, error: "No address provided" });
      return;
    }

    const user = (await db.getUserByAddress(address)) || (await db.createUser(address));
    const confirmed = await confirmAccount(address);
    console.log("Confirmation of user with account " + address + ": " + confirmed);

    if (confirmed) {
      db.confirmUser(user.id);
      req.session.user = {
        address: address,
        id: user.id,
        confirmed: true,
      };
      await req.session.save();
      res.json({ ok: true });
      return;
    }
    res.status(400).send({
      ok: false,
      error: "Could not find a payment from your addresss. Please doublecheck.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false, error: "Something went wrong on the server" });
  }
}
