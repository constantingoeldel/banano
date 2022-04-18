import paymentSucceeded from "./paymentSucceeded";
import stripeJs from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { buffer, json } from "micro";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const buf = (await buffer(req)) as Buffer;
  const body = await json(req);
  const livemode = body.data.object.livemode;
  const sig = req.headers["stripe-signature"] as string;
  const event = await constructEvent(buf, sig, !livemode);
  const response = await handleWebhook(event);
  console.log("Webhook handled with exit code:", response);

  res.status(response).json({ received: true, success: response === 200 });
}

export async function handleWebhook(event: stripeJs.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      return paymentSucceeded(event);
    default:
      console.log(`Unhandled event type ${event.type}`);
      return 200;
  }
}

export async function constructEvent(
  buf: Buffer,
  sig: string,
  test: boolean
): Promise<stripeJs.Event> {
  const stripe = new stripeJs(test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!, {
    apiVersion: "2020-08-27",
  });
  let event;
  const DEV_MODE = process.env.DEV;
  const local = process.env.LOCAL_ENDPOINT!;
  const test_payment = process.env.TEST_ENDPOINT!;
  const normal_payment = process.env.ENDPOINT!;
  const staging = process.env.STAGING_ENDPOINT!;
  const webhookSecret = DEV_MODE ? local : test ? test_payment : normal_payment;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch {
    try {
      event = stripe.webhooks.constructEvent(buf, sig, staging);
    } catch {
      throw new Error("Could not construct event");
    }
  }
  return event;
}
