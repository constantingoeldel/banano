import type { NextApiRequest, NextApiResponse } from "next";
import { Status } from "../../types";
import { getOrders } from "../../utils/db";
import { getOffers } from "../../utils/offer";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Status>) {
  const data = await status();
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");
  res.json(data);
}

export async function status(): Promise<Status> {
  console.log("Rebuilding the status cache");
  try {
    const customers = await getOrders();
    const offers = await getOffers();
    console.log(offers);
    const total = customers.reduce((sum, order) => sum + order.amount, 0);
    const max = offers.reduce((sum, source) => sum + source.balance, 0);
    return {
      total,
      status: "good",
      customers: customers.length,
      max,
      offers,
    };
  } catch (err) {
    console.log(err);
    return {
      total: 0,
      status: "bad",
      customers: 0,
      offers: [],
      max: 0,
    };
  }
}
