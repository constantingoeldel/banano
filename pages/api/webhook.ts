import paymentSucceeded from "./paymentSucceeded";
import stripeJs from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { buffer, json } from "micro";
import { custodialUnboarding, manualUnboarding, sendMail } from "../../utils/mail";
import getDB from "../../utils/db";
import { assert } from "console";

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
    case "account.external_account.created":
      try {
        if (event.account) {
          const db = await getDB();
          const source = await db.activateSource(event.account);
          if (source) {
            source.custodial
              ? await sendMail(custodialUnboarding(source), source.email, true)
              : await sendMail(manualUnboarding(source), source.email, true);
          } else {
            console.log("Source not found");
          }
          console.log("Created Source account for: ", event.account);
          return 200;
        }
      } catch (err) {
        console.log(err);
        return 500;
      }
    case "payment_intent.succeeded":
      // @ts-expect-error
      const paymentIntent = event.data.object.id;
      try {
        paymentIntent &&
          typeof paymentIntent === "string" &&
          (await paymentSucceeded(paymentIntent));

        return 200;
      } catch (error) {
        console.error(error);
        sendMail(String(error));
        return 500;
      }
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

  const secrets = [
    process.env.TEST_ENDPOINT!,
    process.env.DEV_ENDPOINT!,
    process.env.DEV_TEST_ENDPOINT!,
    process.env.ENDPOINT!,
    process.env.CONNECT_ENDPOINT!,
    process.env.CONNECT_TEST_ENDPOINT!,
    process.env.LOCAL_ENDPOINT!,
  ];
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(buf, sig, secret);
      break;
    } catch {
      continue;
    }
  }
  if (!event) throw new Error("Could not construct event");
  return event;
}
