import { NextApiRequest, NextApiResponse } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import Form from "../components/Form";
import Layout from "../components/Layout";
import { Status } from "../types";
import { useStore } from "../utils/state";

export async function getStaticProps() {
  return {
    props: {
      DEV_MODE: !!process.env.DEV,
    },
  };
}

export default function Home({
  DEV_MODE,
}: Status & { DEV_MODE: boolean; exchangeRate_USD_EUR: number }) {
  const [status, setStatus] = useState<Status | null>(null);
  const currency = useStore((state) => state.currency);
  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((status) => setStatus(status));
  }, []);

  return (
    <Layout>
      <main className=" items-center grid-cols-2 gap-10 mt-10 md:grid mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <section>
          <div className="sm:text-center  md:text-left">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block  text-dark">Buy Banano</span>
              <span className="block text-banano-600 ">with credit card</span>
            </h1>
            <p className="mt-3 text-base  sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
              Just enter your wallet address and the amount of BAN you want to purchase and Stripe
              will handle the rest. <br />
              <Link href="/video">
                <a className=" text-light block mt-4">Check this video to see how it works</a>
              </Link>
            </p>
            <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"></div>
          </div>
          {/* <div className="product">
            <div className="description">
              <h1>Buy Banano with fiat directly</h1>
              <p>
                I want to make it easier to get you your well-deserved bananos, so I made this
                website to easily buy it via stripe. Just enter your wallet address and the amount
                of BAN you want to purchase and stripe will handle the rest. I am selling my own
                BAN, this is not an exchange.
              </p>
              <br />

              <p>
                This is an early prototype, so thank you for your trust and if there are any issues,
                you can write me on Discord: Consti#9536.{" "}
                <Link href="/video">
                  <a>Check this video to see how it works</a>
                </Link>
              </p>
              <br />
              {status && status.status === "good" && (
                <div>
                  <p className="total">
                    So far, {status.total} BAN have been purchased by {status.customers} people.{" "}
                    {status.max} BAN are available.{" "}
                    <b className="rate">
                      The current best rate is:{" "}
                      {(
                        status.offers.reduce(
                          (lowest, source) =>
                            (lowest = source.rate < lowest ? source.rate : lowest),
                          status.offers[0].rate
                        ) * (currency !== "eur" ? status.exchangeRate : 1)
                      ).toFixed(4)}{" "}
                      {currency.toUpperCase()}/BAN{" "}
                    </b>
                  </p>
                </div>
              )}
            </div>
          </div> */}
        </section>
        <section>
          <Form offers={status?.offers} exchangeRate_USD_EUR={status?.exchangeRate} />)
        </section>
      </main>
    </Layout>
  );
}
