import Layout from "../components/Layout";
import { Purchase, Recurring } from "../types";
import getDB from "../utils/db";
import { getSession, withPageAuthRequired } from "@auth0/nextjs-auth0";
import { useEffect, useState } from "react";
import { BackspaceIcon } from "@heroicons/react/outline";

import toast, { Toaster } from "react-hot-toast";
import { purchaseHistory } from "./api/user";
import { getRateEUR, getRateUSD } from "../utils/banano";
import { useRouter } from "next/router";

export const getServerSideProps = withPageAuthRequired({
  async getServerSideProps(ctx) {
    const session = getSession(ctx.req, ctx.res);
    const db = await getDB();
    const id: string = session?.user?.sub;
    if (!session || !id) {
      return { redirect: { destination: "/api/auth/login", permanent: false } };
    }
    const userAddresses = await db.getUserAdresses(id);
    if (userAddresses.length < 1 && !(await db.getUser(id))) {
      db.createUser(id, session.user.email, session.user.name, []);
    }
    const [history, exchangeRateUSD, exchangeRateEUR] = await Promise.all([
      purchaseHistory(userAddresses),
      getRateUSD(),
      getRateEUR(),
    ]);

    return {
      props: {
        addresses: userAddresses,
        ...history,
        exchangeRateUSD,
        exchangeRateEUR,
      },
    };
  },
});

interface Dashboard {
  name: string;
  exchangeRateUSD: number;
  exchangeRateEUR: number;
  addresses: string[];
  total: {
    ban: number;
    eur: number;
    usd: number;
  };

  purchases: Purchase[];
  recurring: Recurring;
}

export default function Dashboard({
  name,
  addresses,
  total,
  purchases,
  exchangeRateUSD,
  exchangeRateEUR,
  recurring,
}: Dashboard) {
  const [filter, setFilter] = useState("all");
  const [totalState, setTotal] = useState(total);
  const [purchasesState, setPurchases] = useState(purchases);
  const [address, setAddress] = useState("");
  const [addrs, setAddrs] = useState<string[] | null>(null);
  const [recurringAddress, setRecurringAddress] = useState(addresses[0]);
  const [recurringFrequency, setRecurringFrequency] = useState("weekly");
  const [recurringCurrency, setRecurringCurrency] = useState("usd");
  const [recurringAmount, setRecurringAmount] = useState("20.00");
  const router = useRouter();

  function addAddress() {
    if (
      addrs &&
      (address.match(/^ban_[A-Za-z0-9]{60}$/g) || address.match(/^nano_[A-Za-z0-9]{60}$/g))
    ) {
      if (addrs.includes(address)) {
        toast.error("Address already added");
        return;
      }
      setAddrs([...addrs, address]);
      setAddress("");
    } else {
      toast.error("Please enter a valid BAN or NANO address");
    }
  }
  function removeAddress(addr: string) {
    setAddrs(addrs ? addrs.filter((a) => a !== addr) : []);
  }
  useEffect(() => {
    if (addrs && addresses !== addrs) {
      const promise = fetch("/api/user", {
        method: "PATCH",
        body: JSON.stringify({ addresses: addrs }),
      });
      toast.promise(promise, {
        loading: "Updating addresses...",
        success: "Successful.",
        error: "Error when updating addresses",
      });
      promise
        .then((res) => res.json())
        .then((data) => {
          setTotal(data.total);
          setPurchases(data.purchases);
        });
    }
  }, [addrs, addresses]);

  useEffect(() => {
    setAddrs(addresses);
  }, [addresses]);

  function requestCheckout() {
    if (recurringAddress && recurringAmount && recurringCurrency && recurringFrequency) {
      const promise = fetch("/api/recurring", {
        method: "POST",
        redirect: "follow",
        body: JSON.stringify({
          address: recurringAddress,
          amount: recurringAmount,
          currency: recurringCurrency,
          frequency: recurringFrequency,
        }),
      })
        .then((res) => res.json())
        .then((body: { message: string }) => {
          body.message.includes("https://checkout.stripe.com/pay/")
            ? router.push(body.message!)
            : toast.error(body.message);
        })
        .catch((e) => console.error(e));
      toast.promise(promise, {
        loading: "Checking out...",
        success: "Successful.",
        error: "Error when checking out",
      });
    } else {
      toast.error("Please fill out all the fields");
    }
  }
  function requestPortal() {
    const promise = fetch("/api/recurring", {
      method: "GET",
      redirect: "follow",
    })
      .then((res) => res.json())
      .then((body: { message: string }) => {
        body.message.includes("stripe") ? router.push(body.message!) : toast.error(body.message);
      })
      .catch((e) => console.error(e));
    toast.promise(promise, {
      loading: "Checking out...",
      success: "Successful.",
      error: "Error when checking out",
    });
  }
  return (
    <Layout>
      <main className=" text-lg text-dark mt-10 md:grid mx-auto max-w-4xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <Toaster position="top-right" />
        <h1 className="mb-10  text-4xl tracking-tight font-extrabold  sm:text-5xl md:text-6xl">
          Dashboard
        </h1>
        <p>Hello, {name || "human"}! Here you can see your account details and past purchases</p>
        {addresses.length > 0 ? (
          <p className="my-6">The addresses associated to your account are:</p>
        ) : (
          <p className="my-6">Add addresses to track your purchases and profits:</p>
        )}
        <ul className=" mb-10 ">
          {addrs &&
            addrs.map((address, index) => (
              <li key={address + index} className="flex gap-2 mb-2">
                <b className="">{address}</b>

                <BackspaceIcon width={"20px"} onClick={() => removeAddress(address)} />
              </li>
            ))}
        </ul>
        <div className="flex gap-2 ">
          <input
            type="text"
            placeholder="ban_abcde..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-3/4 border border-dark rounded-md px-4 py-2"
          />

          <button
            onClick={addAddress}
            className="inline   items-center justify-center px-8 py-3 border-2 border-dark text-base font-medium rounded-md text-banano-700  md:py-4 md:text-lg md:px-10"
          >
            Add Address
          </button>
        </div>
        <p className="my-6">
          So far, you have purchased {totalState.ban.toFixed(2)} BAN for {totalState.eur}€ and{" "}
          {totalState.usd}$ which are now worth {(totalState.ban * exchangeRateUSD).toFixed(2)} USD
          or {(totalState.ban * exchangeRateEUR).toFixed(2)}€.
        </p>
        <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
          Recurring Purchases
        </h2>
        <p>
          To get the benefit of averaging out the price of your purchases, you can set up recurring
          purchases. We will notify you the the day before your next purchase and you can cancel at
          any time. Recurring purchases will be done at market price + 1% fee.
        </p>

        {recurring?.active ? (
          <>
            {" "}
            <p>
              You already have a recurring purchase set up. You are currently paying{" "}
              {recurringAmount} every {recurringFrequency.split("ly")[0]}.
            </p>
            <button
              onClick={requestPortal}
              className="mt-5 w-1/3  items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10"
            >
              Manage subscription
            </button>
          </>
        ) : (
          <>
            <label className="my-2 font-bold" htmlFor="recurringAddress">
              Select the address to receive the funds on
            </label>
            <br />
            <select
              id="reccuringAddress"
              className="rounded"
              value={recurringAddress}
              onChange={(e) => setRecurringAddress(e.target.value)}
            >
              <option value="">Select an address</option>
              {addrs &&
                addrs.map((address) => (
                  <option key={address} value={address}>
                    {address}
                  </option>
                ))}
            </select>
            <br />
            <label htmlFor="amount" className=" block my-2 font-bold">
              How much do you want to spend?
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {recurringCurrency === "usd" ? "$" : "€"}
                </span>
              </div>
              <input
                type="text"
                name="amount"
                id="amount"
                value={recurringAmount}
                onChange={(e) => setRecurringAmount(e.target.value)}
                className=" block w-full pl-7 pr-12 rounded"
                placeholder="20.00"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <label htmlFor="currency" className="sr-only">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={recurringCurrency}
                  onChange={(e) => setRecurringCurrency(e.target.value)}
                  className=" h-full py-0 pl-2 pr-7 border-transparent bg-transparent  rounded"
                >
                  <option value="usd">USD</option>

                  <option value="eur">EUR</option>
                </select>
              </div>
            </div>

            <br />
            <label className="my-2 font-bold" htmlFor="frequency">
              How frequently do you want to purchase?
            </label>
            <br />
            <select
              id="frequency"
              className="rounded"
              value={recurringFrequency}
              onChange={(e) => setRecurringFrequency(e.target.value)}
            >
              <option value="daily">daily</option>
              <option value="weekly">weekly</option>
              <option value="monthly">monthly</option>
            </select>
            <button
              onClick={requestCheckout}
              className="mt-5 w-1/3  items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-dark bg-banano-600 hover:bg-banano-700 md:py-4 md:text-lg md:px-10"
            >
              Proceed to Stripe
            </button>
          </>
        )}
        {/* {source ? (
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
          )} */}
        <h2 className="my-5 text-2xl tracking-tight font-extrabold  sm:text-2xl md:text-3xl">
          Purchase history
        </h2>
        <select className="rounded" onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="succeeded">Successful</option>
          <option value="refunded">Refunded</option>
          <option value="error">Error</option>
          <option value="open">Cancelled</option>
        </select>
        {purchasesState
          .sort((p1, p2) => p2.timestamp - p1.timestamp)
          .filter(
            (purchase) =>
              filter === "all" ||
              purchase.status === filter ||
              (filter === "error" &&
                [
                  "invalid hash",
                  "transaction error",
                  "transfer error",
                  "refund error",
                  "failed",
                ].includes(purchase.status))
          )
          .map((purchase) => (
            <div
              key={purchase.id}
              className={`${
                purchase.status === "succeeded" || purchase.status === "refunded"
                  ? "bg-dark"
                  : purchase.status === "open"
                  ? "bg-teal-700"
                  : "bg-contrast"
              } p-3 my-2 rounded text-white`}
            >
              <p>
                On {new Date(purchase.timestamp).toDateString()} you{" "}
                {purchase.status === "open" ? "stopped before buying" : "bought"}:
              </p>
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
      </main>
    </Layout>
  );
}
