import axios, { AxiosResponse } from "axios";
import { CustodialSource, ManualSource, Offer, Order } from "../types";
import { getBalance, getRate, receivePending } from "./banano";
import { nanoid } from "nanoid";
import { sources } from "./db";

export async function fetchOffer(url: string, secret: string) {
  const response: AxiosResponse<{ rate: number; balance: number }> = await axios.get(url, {
    headers: { Authorization: secret },
  });
  return response.data;
}

export async function getOffer(
  source: CustodialSource | ManualSource,
  marketRate: number
): Promise<Offer | null> {
  try {
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
      const offer = await fetchOffer(source.webhook, source.secret);
      balance = offer.balance;
      rate = offer.rate;
    }
    if (!balance || !rate) return null;

    return {
      source_id: source.id,
      offer_id: "oid_" + nanoid(),
      balance,
      rate,
      name: source.name,
    };
  } catch {
    return null;
  }
}

export async function getOffers() {
  try {
    const marketRate = await getRate();
    console.log("Market rate", marketRate);
    const activeSources = await sources.find({ active: true }).toArray();
    console.log("Active sources", activeSources);
    const offers = activeSources.map((source) => getOffer(source, marketRate));
    const offersWithData = await Promise.all(offers);
    // Why won't typescipt allow a filter here?
    const offersWithDataFiltered = offersWithData.flatMap((offer) => (offer ? [offer] : []));
    return offersWithDataFiltered;
  } catch (err) {
    console.error(err);
    return [];
  }
}
