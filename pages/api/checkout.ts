import { NextApiRequest, NextApiResponse } from "next";
import { getOffer } from "../../utils/offer";
import { nanoid } from "nanoid";
import stripeJs from "stripe";
import axios from "axios";
import { getExchangeRate, getRateEUR, getRateUSD } from "../../utils/banano";
import { WithId } from "mongodb";
import { CustodialSource, ManualSource } from "../../types";
import getDB, { Database } from "../../utils/db";

interface Redirect {
  url: string;
}

interface Error {
  message: string;
}
const URL = process.env.DEV ? "https://dev.acctive.digital" : "https://ban.app";
export default async function handler(req: NextApiRequest, res: NextApiResponse<Redirect | Error>) {
  const db = await getDB();
  try {
    const authByBearer = !!req.headers.authorization;
    const authenticated =
      authByBearer && typeof req.headers.authorization === "string"
        ? await authenticateSource(db, req.headers.authorization)
        : await authenticateHuman(req.body["g-recaptcha-response"]);
    if (authenticated.status !== 200) {
      console.log("Authentication failed");
      res.status(authenticated.status).json({
        message: authenticated.message,
      });
      return;
    }
    const amount = Number(req.body.amount);
    const test = req.body.test || false;
    const stripeSecret = test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
    const recipient_address = req.body.address;
    const currency = req.body.currency === "usd" ? "usd" : "eur";
    const sourceId = authenticated.source ? authenticated.source.id : req.body.source;
    if (
      !recipient_address ||
      typeof recipient_address !== "string" ||
      !recipient_address.match("ban_.{60}")
    ) {
      res.status(400).json({ message: "Invalid address. Please provide a valid ban address" });
      return;
    }
    if (!sourceId || typeof sourceId !== "string") {
      res.status(400).json({ message: "No source id provided" });
      return;
    }
    if (!sourceId.includes("sid_")) {
      res.status(400).json({ message: "Invalid source id" });
      return;
    }

    const [eurRate, usdRate, source] = await Promise.all([
      getRateEUR(),
      getRateUSD(),
      authByBearer ? Promise.resolve(authenticated.source) : db.getSource(sourceId),
    ]);
    if (!source) {
      res.status(400).json({ message: "Source does not exist" });
      return;
    }
    const offer = await getOffer(source, eurRate);
    if (!offer) {
      res.status(400).json({ message: "Offer does not exist" });
      return;
    }
    if (!amount || amount === NaN || amount < 100 || amount > offer.balance) {
      res.status(400).json({
        message: "Invalid amount. Amount must be a number between 100 and " + offer.balance,
      });

      return;
    }
    const exchangeRate = currency === "eur" ? 1 : usdRate / eurRate;
    const price = Math.ceil(amount * offer.rate * 100 * exchangeRate) + 25;
    const fee = price * 0.02 > 15 ? Math.floor(price * 0.02) : 15;
    const transferGroup = "tid_" + nanoid();
    const stripe = new stripeJs(stripeSecret, {
      apiVersion: "2020-08-27",
    });
    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: amount + " Bananos",
                description: test
                  ? "Test the system with the card 4242 4242 4242 4242, any date in the future and any 3-digit code."
                  : "Price is the amount of bananos times the current exchange rate.",
              },

              unit_amount: price,
            },

            quantity: 1,
          },
        ],
        payment_intent_data: {
          application_fee_amount: fee,
        },

        mode: "payment",
        success_url: URL + "/",
        cancel_url: URL + "/",
      },
      { stripeAccount: source.account }
    );
    const paymentIntent = session.payment_intent as string;
    const id = await db.addOrder(
      paymentIntent,
      source,
      offer,
      transferGroup,
      recipient_address,
      amount,
      price,
      !!test
    );
    console.log(
      "Payment intent registered: ",
      paymentIntent,
      "saved as order: " + id + "\nFee: " + fee
    );

    res.status(200).json({ message: session.url! });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong, please try again later" });
  }
}

async function authenticateSource(
  db: Database,
  auth: string
): Promise<
  | { status: 401 | 500; message: string }
  | { status: 200; source: WithId<CustodialSource | ManualSource> }
> {
  try {
    if (!auth.startsWith("Bearer ")) {
      return { status: 401, message: "Please provide a Bearer token" };
    }
    const sources = await db.getActiveSources(true);
    const source = sources.find((source) => source.secret === auth.substring(7));
    if (!source) return { status: 401, message: "Invalid token" };
    return { status: 200, source: source };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Internal server error." };
  }
}
async function authenticateHuman(
  captcha: string
): Promise<{ status: 401 | 500; message: string } | { status: 200; source: null }> {
  try {
    if (process.env.DEV) return { status: 200, source: null };
    if (captcha === undefined || captcha === "" || captcha === null) {
      console.log("Not captcha header, aborting");
      return { status: 401, message: "captcha missing" };
    }
    const verificationURL =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      process.env.CAPTCHA +
      "&response=" +
      captcha;
    const approval = await axios.post(verificationURL);
    if (!approval.data.success) {
      console.log(
        "Invalid captcha header, aborting",
        approval.data.success,
        approval.data["error-codes"]
      );
      return { status: 401, message: "captcha error" };
    }
    return { status: 200, source: null };
  } catch (e) {
    console.log(e);
    return { status: 500, message: "Internal server error." };
  }
}
