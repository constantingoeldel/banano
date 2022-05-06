import { NextApiRequest, NextApiResponse } from "next";
import getDB from "../../utils/db";
import paymentSucceeded from "./paymentSucceeded";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const db = await getDB();

    const orders = await db.getFailedOrders();

    // TODO: align type
    for (const order of orders) {
      paymentSucceeded(order.paymentIntent);
    }
    res.status(200).json({ received: true, success: true });
  } catch (err) {
    res.status(400).json({ error: err });
  }
}
