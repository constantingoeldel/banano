// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { getBalance, getOrders, getRate } from "./_utils";

type Data = {
  total: number;
  status: string;
  customers: number;
  rate: number;
  max: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  console.log("New visitor");
  const data = await status();
  res.json(data);
}

export async function status(): Promise<Data> {
  try {
    const balance = await getBalance();
    const exchangeRate = await getRate();
    const data = await getOrders();
    const customers = data.filter((order) => order.status === "successful");
    const total = customers.reduce((sum, order) => sum + order.price, 0);
    return {
      total,
      status: "good",
      customers: customers.length,
      rate: exchangeRate,
      max: balance,
    };
  } catch (err) {
    console.log(err);
    return {
      total: 0,
      status: "bad",
      customers: 0,
      rate: 0,
      max: 0,
    };
  }
}
