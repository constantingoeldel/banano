import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import stripeJs from "stripe";
import getDB from "../../utils/db";

export default withApiAuthRequired(async (req, res) => {
  const TEST = true;
  const URL = process.env.DEV ? "https://dev.acctive.digital" : "https://ban.app";

  const session = getSession(req, res);
  let { amount, currency, address, frequency } = JSON.parse(req.body);
  amount = Math.floor(Number(amount) * 100); // from now on in cents
  currency = currency === "eur" ? "eur" : "usd";

  if (!amount || amount === NaN || amount < 100) {
    res.status(400).json({
      message: "Invalid amount. Amount must be a number larger than 1",
    });
    return;
  }
  if (
    !address ||
    typeof address !== "string" ||
    !(address.match(/^ban_[A-Za-z0-9]{60}$/g) || address.match(/^nano_[A-Za-z0-9]{60}$/g))
  ) {
    res.status(400).json({
      message: "Invalid address. Please provide a valid  address",
    });
    return;
  }
  if (!["daily", "weekly", "monthly"].includes(frequency)) {
    res.status(400).json({
      message: "Invalid frequency. Please provide a valid frequency",
    });
    return;
  }
  const chain = address.startsWith("ban_") ? "banano" : "nano";

  const stripeSecret = TEST ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
  const stripe = new stripeJs(stripeSecret, {
    apiVersion: "2020-08-27",
  });
  const checkout = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    customer_email: session?.user.email,
    line_items: [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: "your " + frequency + " " + chain + " refill",
            description:
              "You will be charged " + amount / 100 + " " + currency === "eur"
                ? "€"
                : "€" + " " + frequency,
          },

          unit_amount: amount,
          recurring: {
            interval: frequency.split("ly")[0],
          },
        },

        quantity: 1,
      },
    ],
    metadata: {
      address: address,
      amount: amount,
      currency: currency,
      frequency: frequency,
      chain: chain,
      user: session?.user.sub,
    },
    mode: "subscription",
    success_url: `${URL}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${URL}?canceled=true`,
  });

  res.status(200).json({ message: checkout.url! });
  const db = await getDB();
  await db.updateUser(session?.user.sub, {
    // @ts-ignore why?
    customerId: checkout.customer,
    recurring: {
      // @ts-ignore why?
      subscriptionId: checkout.subscription,
      // @ts-ignore
      paymentIntent: checkout.payment_intent,
      address,
      amount,
      currency,
      frequency,
      active: false,
    },
  });
});
