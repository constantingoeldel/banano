import Link from "next/link";
import Layout from "../components/Layout";
import { Price } from "../types";
import { getBalance } from "../utils/banano";
import { getSource, getUserOrders } from "../utils/db";
import { withIronSessionSsr } from "iron-session/next";
import { ironOptions } from "../utils/auth";
import { NextPageContext } from "next";
import { getUserVisibleSource } from "./api/source";

export const getServerSideProps = withIronSessionSsr(
  async ({ req }: { req: NextPageContext["req"] }) => {
    if (!req || !req.session.user) {
      return { redirect: { permanent: false, destination: "/login" } };
    }
    const user = req.session.user;
    const orders = await getUserOrders(user.address);
    let userVisibleSource = user.sourceId ? await getUserVisibleSource(user.sourceId) : null;

    return {
      props: {
        address: user.address,
        total: {
          ban: orders.reduce((sum, order) => (sum += order.amount), 0),
          eur: orders.reduce((sum, order) => (sum += order.price), 0),
        },
        purchases: orders,
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
      }
    | {
        custodial: false;
        active: boolean;
        name: string;
        webhook: string;
        secret: string;
      };
  purchases: {
    amount: number;
    price: number;
    timestamp: number;
    id: string;
    hash: string;
    status: string;
  }[];
}

export default function Dashboard({ address, total, purchases, source }: Dashboard) {
  return (
    <Layout>
      <main>
        <>
          <h1>Dashboard</h1>
          <p>Hello, human! Here you can see your account details and past purchases</p>
          <p>
            The address associated to your account is: <b>{address}</b>
          </p>
          <p>
            So far, you have purchased {total.ban} BAN for {total.eur}€
          </p>
          {source ? (
            <>
              <h2>Source</h2>
              <p>Your account is currently {source.active ? "active" : "inactive"}</p>
              {source.custodial ? (
                <p>
                  There are {source.balance} BAN in your account which you offer for at least{" "}
                  {source.price.min} EUR/BAN. Because you{" "}
                  {source.price.market
                    ? `Follow the market, this price will be updated frequently and adjusted by your margin of ${
                        source.price.margin - 100
                      }%`
                    : "Don't follow the market, this price will always stay the same."}
                  . Send more BAN to this address if you want to top up.
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
              <Link href="/source">Sign up here</Link>{" "}
            </p>
          )}
          <br />
          <h2>Purchase history</h2>
          {purchases.map((purchase) => {
            <div key={purchase.id} className="bg-green-300 p-3 m-5 rounded">
              <p>On {new Date(purchase.timestamp).toLocaleDateString()}:</p>
              <p>
                {purchase.amount} BAN for {purchase.price} EUR
              </p>
              <p>Status: {purchase.status}</p>
              <p>Transaction hash: {purchase.hash}</p>
            </div>;
          })}
        </>
      </main>
    </Layout>
  );
}
