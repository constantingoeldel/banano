import { NextApiRequest, NextApiResponse } from "next";
import handleWebhook, { constructEvent } from "../_handleWebhook";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const event = await constructEvent(req, true);
  const response = await handleWebhook(event);
  console.log("Webhook handled with exit code:", response);

  res.status(response).json({ received: true, success: response === 200 });
}
