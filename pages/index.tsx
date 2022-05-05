import { NextApiRequest, NextApiResponse } from "next";
import Link from "next/link";
import Form from "../components/Form";
import Layout from "../components/Layout";
import { Status } from "../types";
import { getExchangeRate } from "../utils/banano";
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
  const rate = await getExchangeRate();

  return {
    props: {
      ...props,
      DEV_MODE: !!process.env.DEV,
      exchangeRate_USD_EUR: rate,
    },
  };
}

export default function Home({
  offers,
  total,
  customers,
  max,
  exchangeRate_USD_EUR,
  DEV_MODE,
}: Status & { DEV_MODE: boolean }) {
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
        </div>
      </div>
      <Form
        customers={customers}
        offers={offers}
        total={total}
        max={max}
        DEV_MODE={DEV_MODE}
        exchangeRate_USD_EUR={exchangeRate_USD_EUR}
      />
      <Link href="/test">
        <a>I want to try it out first</a>
      </Link>
    </Layout>
  );
}
