import { buffer, json } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import handleWebhook, { constructEvent } from "./_handleWebhook";
// implement livemode: false,

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const buf = await buffer(req) as Buffer;
  const body = await json(req)
  const livemode = body.data.object.livemode
  console.log(body.data.object)
  const sig = req.headers["stripe-signature"] as string;
  const event = await constructEvent(buf,sig, !livemode);
  const response = await handleWebhook(event);
  console.log("Webhook handled with exit code:", response);

  res.status(response).json({ received: true, success: response === 200 });
}
