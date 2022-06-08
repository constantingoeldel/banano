import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import getDB from "../../utils/db";
import stripeJs from "stripe";

export default withApiAuthRequired(async (req, res) => {
  const TEST = true;
  const db = await getDB();
  const session = getSession(req, res);
  const user = await db.getUser(session?.user.sub);

  if (!user || !user.customerId) {
    res.status(400).json({ message: "No existing recurring payment" });
    return;
  }

  const stripeSecret = TEST ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
  const stripe = new stripeJs(stripeSecret, {
    apiVersion: "2020-08-27",
  });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.customerId,
    return_url: "https://ban.app",
  });

  res.status(200).json({ message: portalSession.url! });
});
