import { NextApiRequest, NextApiResponse } from "next";
import stripeJs from "stripe";
import { buffer } from "micro";
import handleWebhook from "./_handleWebhook";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const stripe = new stripeJs(process.env.STRIPE_SECRET!, {
    apiVersion: "2020-08-27",
  });
  const sig = req.headers["stripe-signature"] as string;
  const buf = await buffer(req);
  let event;
  const webhookSecret = process.env.ENDPOINT!;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.log(err);
    res.status(400).send(`Webhook Error: ${err}`);
    return;
  }

  handleWebhook(event);

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}
