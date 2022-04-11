import { NextApiRequest, NextApiResponse } from "next";
import stripeJs from "stripe";
import handleWebhook from "../_handleWebhook";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const stripe = new stripeJs(process.env.STRIPE_TEST_SECRET!, { apiVersion: "2020-08-27" });
  const sig = req.headers["stripe-signature"] as string;
  let event;
  const webhookSecret = process.env.TEST_ENDPOINT!;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  handleWebhook(event);

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}
