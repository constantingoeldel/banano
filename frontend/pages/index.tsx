import { NextApiRequest, NextApiResponse } from "next";
import Link from "next/link";
import { useState } from "react";
import Form from "../components/Form";
import Layout from "../components/Layout";
import { status } from "./api/status";

export async function getServerSideProps({
  req,
  res,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
}) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=86400");

  const props = await status();
  return {
    props,
  };
}
interface Props {
  rate: number;
  total: number;
  max: number;
  customers: number;
}

export default function Home({ rate, total, customers, max }: Props) {
  const [price, setPrice] = useState(0);
  function updatePrice(amount: string) {
    setPrice(Number(amount) * rate);
  }

  return (
    <Layout>
      <div className="product">
        <div className="description">
          <h1>Buy Banano with fiat directly</h1>
          <p>
            I want to make it easier to get you your well-deserved bananos, so I made this website
            to easily buy it via stripe. Just enter your wallet address and the amount of BAN you
            want to purchase and stripe will handle the rest. I am selling my own BAN, this is not
            an exchange.
          </p>
          <br />

          <p>
            This is an early prototype, so thank you for your trust and if there are any issues, you
            can write me on Discord: Consti#9536.{" "}
            <Link href="/video">
              <a>Check this video to see how it works</a>
            </Link>
          </p>
          <br />
          <p className="total">
            So far, {total} BAN have been purchased by {customers} people.
          </p>
          <b className="rate">The current rate is: {rate.toFixed(2)} BAN/EUR </b>
        </div>
      </div>
      <Form updatePrice={updatePrice} price={price} max={max} />
      <Link href="/test">
        <a>I want to try it out first</a>
      </Link>
    </Layout>
  );
}
