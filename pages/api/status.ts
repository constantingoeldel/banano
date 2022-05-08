import type { NextApiRequest, NextApiResponse } from "next";
import { Status } from "../../types";
import { getExchangeRate } from "../../utils/banano";
import getDB from "../../utils/db";
import { getOffers } from "../../utils/offer";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Status>) {
  const data = await status();
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  res.json(data);
}

export async function status(): Promise<Status> {
  console.log("Rebuilding the status cache");
  const db = await getDB();
  try {
    const exchangeRate = await getExchangeRate();
    const customers = await db.getOrders();
    const offers = await getOffers(db);
    const total = customers.reduce((sum, order) => sum + order.amount, 0);
    const max = offers.reduce((sum, source) => sum + source.balance, 0);
    return {
      total,
      status: "good",
      customers: customers.length,
      max,
      offers,
      exchangeRate,
    };
  } catch (err) {
    return {
      total: 0,
      status: "bad",
      customers: 0,
      max: 0,
      exchangeRate: 1,
    };
  }
}
