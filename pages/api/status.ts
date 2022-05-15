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
    let offers = await getOffers(db);
    offers = offers.filter((offer) =>
      offer.chain === "banano" ? offer.balance >= 100 : offer.balance >= 1
    );

    console.log(offers);
    return {
      total: 100000,
      status: "good",
      customers: 20,
      max: 1000,
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
