import { NextApiRequest, NextApiResponse } from "next";
import { getFailedOrders } from "../../utils/db";
import paymentSucceeded from "./paymentSucceeded";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const orders = await getFailedOrders();

    // TODO: align type
    const constructedEvent = {
      id: "abc",
      type: "payment_intent.succeeded",
      object: "event" as "event",
      livemode: false,
      api_version: "123",
      created: 124,
      pending_webhooks: 0,
      request: null,
      data: {
        object: {
          id: orders[orders.length - 1].paymentIntent,
        },
      },
    };

    paymentSucceeded(constructedEvent);
    res.status(200).json({ received: true, success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
}
