import Link from "next/link";
import Layout from "../components/Layout";
import { Price, Purchase } from "../types";
import { getBalance } from "../utils/banano";
import { withIronSessionSsr } from "iron-session/next";
import { ironOptions } from "../utils/auth";
import { NextPageContext } from "next";
import { getUserVisibleSource } from "./api/source";
import getDB from "../utils/db";

export const getServerSideProps = withIronSessionSsr(
  async ({ req }: { req: NextPageContext["req"] }) => {
    const db = await getDB();
    if (!req || !req.session.user) {
      return { redirect: { permanent: false, destination: "/login" } };
    }
    const user = req.session.user;
    const orders = await db.getUserOrders(user.address);
    const purchase: Purchase[] = orders
      .filter((order) => order.status !== "open" || order.hash)
      .map((order) => {
        return {
          id: order.paymentIntent,
          timestamp: order.timestamp,
          address: order.address,
          amount: order.amount,
          price: order.price,
          currency: order.currency || "eur",
          chain: order.chain || "banano",
          status: order.status,
          hash: order.hash || "No hash yet",
          test: order.test || false,
        };
      });
    const sourceId = user.sourceId || (await db.getSourceIdByAddress(user.address));
    let userVisibleSource = sourceId ? await getUserVisibleSource(sourceId) : null;
    console.log(user, sourceId, userVisibleSource, purchase);
    return {
      props: {
        address: user.address,
        total: {
          ban: orders.reduce((sum, order) => (sum += order.amount), 0),
          eur:
            orders.reduce((sum, order) => (sum += order.amount !== 0.01 ? order.price : 0), 0) /
            100,
        },
        purchases: purchase,
        source: userVisibleSource,
      },
    };
  },
  ironOptions
);

interface Dashboard {
  address: string;
  total: {
    ban: number;
    eur: number;
  };
  source?:
    | {
        custodial: true;
        active: boolean;
        name: string;
        address: string;
        balance: number;
        price: Price;
        chain: "banano" | "nano";
      }
    | {
        custodial: false;
        active: boolean;
        name: string;
        chain: "banano" | "nano";
        webhook: string;
        secret: string;
      };
  purchases: Purchase[];
}

export default function Dashboard({ address, total, purchases, source }: Dashboard) {
  return (
    <Layout>
      <main className=" text-lg text-dark mt-10 md:grid mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <>
          <h1 className="mb-10  text-4xl tracking-tight font-extrabold  sm:text-5xl md:text-6xl">
            Dashboard
          </h1>
          <p>Hello, human! Here you can see your account details and past purchases</p>

          <p className="my-6">
            The address associated to your account is: <b>{address}</b>
          </p>
          <p className="mb-6">
            So far, you have purchased {total.ban.toFixed(2)} BAN for {total.eur}€
          </p>
          {source ? (
            <>
              <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
                Source
              </h2>
              <p className="my-2">
                Your account is currently <b>{source.active ? "active" : "inactive"}</b>
              </p>
              {source.custodial ? (
                <p>
                  There are {source.balance} {} in your account which you offer for at least{" "}
                  {source.price.min} ct./{source.chain === "banano" ? "BAN" : "XNO"}. Because you{" "}
                  {source.price.market
                    ? `follow the market, this price will be updated frequently and adjusted by your margin of ${(
                        (source.price.margin - 1) *
                        100
                      ).toFixed(1)}%`
                    : "Don't follow the market, this price will always stay the same."}
                  . Send more {source.chain === "banano" ? "BAN" : "XNO"} to the address on top if
                  you want to top up. If you want to change these parameters, just contact me @
                  constantingoeldel@gmail.com.
                </p>
              ) : (
                <p>
                  You manage your funds yourself. When we receive a purchase request, we will send a
                  webhook to {source.webhook}. To verify the integrity of the request, validate it
                  against this secret: {source.secret}
                </p>
              )}
            </>
          ) : (
            <p>
              You don&#39;t currently offer any BAN to others.{" "}
              <Link href="/source">
                <a className="text-light  mt-4">Sign up here</a>
              </Link>{" "}
            </p>
          )}

          <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
            Purchase history
          </h2>
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className={`${
                purchase.status === "open" ||
                purchase.status === "succeeded" ||
                purchase.status === "refunded"
                  ? "bg-dark"
                  : "bg-contrast"
              } p-3 my-2 rounded text-white`}
            >
              <p>On {new Date(purchase.timestamp).toDateString()} you bought:</p>
              <p>
                {purchase.amount} BAN for{" "}
                {purchase.test
                  ? "free"
                  : purchase.price / 100 + (purchase.currency === "eur" ? "€" : "$")}
              </p>
              <p>Status: {purchase.status}</p>
              <p>Transaction hash: {purchase.hash}</p>
            </div>
          ))}
        </>
      </main>
    </Layout>
  );
}
