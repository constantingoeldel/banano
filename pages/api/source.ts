import { NextApiRequest, NextApiResponse } from "next";
import { OfferResponse } from "../../types";
import { getBalance, getRateEUR, sendBanano } from "../../utils/banano";
import getDB from "../../utils/db";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OfferResponse | { hash: string } | string>
) {
  if (req.method === "GET") {
    if (req.headers["authorization"] !== process.env.API_KEY) {
      res.status(401).send("Unauthorized");
      return;
    }
    const address = process.env.ADDRESS!;
    const margin = 1.02;
    const balance = await getBalance(address);
    let rate = (await getRateEUR()) * margin;
    res.json({ balance, rate });
  } else if (req.method === "POST") {
    //@ts-ignore
    const requestIsValid = ({ payment, amount, address }) => {
      // implementation left up to the user
      return true;
    };
    if (req.headers["authorization"] !== process.env.API_KEY) {
      res.status(401).send("Unauthorized");
      return;
    }
    if (!requestIsValid(req.body)) {
      res.status(400).send("Invalid request");
      return;
    }
    const hash = await sendBanano(req.body.amount, req.body.address, process.env.SEED!);
    res.json({ hash });
  }
}

export async function getUserVisibleSource(id: string) {
  const db = await getDB();
  const source = await db.getSource(id);
  if (!source) return null;
  if (source.custodial) {
    const balance = await getBalance(source.address);
    return {
      active: source.active,
      name: source.name,
      custodial: source.custodial,
      address: source.address,
      price: source.price,
      balance,
    };
  } else {
    return {
      active: source.active,
      name: source.name,
      custodial: source.custodial,
      webhook: source.webhook,
      secret: source.secret,
    };
  }
}
