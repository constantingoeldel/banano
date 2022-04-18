import axios, { AxiosResponse } from "axios";
import { CustodialSource, ManualSource, Offer, Order } from "../types";
import { getBalance, getBalances, getRate } from "./banano";
import { nanoid } from "nanoid";
import { sources } from "./db";

export async function fetchOffer(url: string) {
  const response: AxiosResponse<{ rate: number; balance: number }> = await axios.get(url);
  return response.data;
}

export async function getOffer(
  source: CustodialSource | ManualSource,
  marketRate: number
): Promise<Offer> {
  let balance, rate;
  if (source.custodial) {
    balance = await getBalance(source.address);
    rate = source.price.market
      ? marketRate * source.price.margin < source.price.min
        ? source.price.min
        : marketRate * source.price.margin
      : source.price.min;
  } else {
    const offer = await fetchOffer(source.webhook);
    balance = offer.balance;
    rate = offer.rate;
  }

  return {
    source_id: source.id,
    offer_id: "oid_" + nanoid(),
    balance,
    rate,
    name: source.name,
  };
}

export async function getOffers() {
  try {
    const marketRate = await getRate();
    const activeSources = await sources
      .find({ active: true }, { projection: { id: 1, margin: 1, market_price: 1, min_price: 1 } })
      .toArray();
    const offers = activeSources.map((source) => getOffer(source, marketRate));
    return await Promise.all(offers);
  } catch (err) {
    console.error(err);
    return [];
  }
}
