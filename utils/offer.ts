import axios, { AxiosResponse } from "axios";
import { CustodialSource, ManualSource, Offer, Order } from "../types";
import { getBalance, getRate, receivePending } from "./banano";
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
  const marketRateInCt = marketRate * 100;
  let balance, rate;
  if (source.custodial) {
    await receivePending(source.seed);
    balance = await getBalance(source.address);
    console.log(marketRateInCt * source.price.margin, source.price.min);
    rate = source.price.market
      ? marketRateInCt * source.price.margin < source.price.min
        ? source.price.min / 100
        : (marketRateInCt * source.price.margin) / 100
      : source.price.min;
  } else {
    console.log(source);
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
    console.log("Market rate", marketRate);
    const activeSources = await sources.find({ active: true }).toArray();
    const offers = activeSources.map((source) => getOffer(source, marketRate));
    return await Promise.all(offers);
  } catch (err) {
    console.error(err);
    return [];
  }
}
