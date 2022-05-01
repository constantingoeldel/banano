import { NextApiRequest, NextApiResponse } from "next";
import { getOffer } from "../../utils/offer";
import { nanoid } from "nanoid";
import stripeJs from "stripe";
import axios from "axios";
import { addOrder, getActiveSources, getSource } from "../../utils/db";
import { getRate } from "../../utils/banano";
import { WithId } from "mongodb";
import { CustodialSource, ManualSource } from "../../types";

interface Redirect {
  url: string;
  status: number;
}

interface Error {
  status: number;
  message: string;
}
const URL = process.env.DEV ? "https://dev.acctive.digital" : "https://banano.acctive.digital";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Redirect | Error>) {
  try {
    console.log("Received new checkout request");
    const authByBearer = await authenticateSource(req, res);
    console.log("Authenticated by bearer", authByBearer);

    if (!authByBearer && !(await authenticateHuman(req, res))) {
      console.log("Authentication failed");

      return;
    }
    console.log("Request is valid");
    const amount = Number(req.body.amount);
    const test = req.body.test || false;
    test && console.log("Test payment requested");
    const stripeSecret = test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
    const recipient_address = req.body.address;
    const sourceId = authByBearer ? authByBearer.id : req.body.source;
    if (!recipient_address.match("ban_.{60}")) {
      res.json({ status: 400, message: "invalid address. Please provide a valid ban address" });
      return;
    }
    if (!sourceId || typeof sourceId !== "string") {
      res.json({ status: 400, message: "No source id provided" });
      return;
    }
    if (!sourceId.includes("sid_")) {
      res.json({ status: 400, message: "Invalid source id" });
      return;
    }
    const marketRate = await getRate();
    const source = await getSource(sourceId);
    if (!source) {
      res.json({ status: 400, message: "Source does not exist" });
      return;
    }
    const offer = await getOffer(source, marketRate);
    if (!offer) {
      res.json({ status: 400, message: "Offer does not exist" });
      return;
    }
    if (!amount || amount < 100 || amount > offer.balance) {
      res.json({
        status: 400,
        message: "Invalid amount entered",
      });

      return;
    }
    const price = Math.ceil(amount * offer.rate * 100) + 25;
    const transferGroup = "tid_" + nanoid();
    const stripe = new stripeJs(stripeSecret, { apiVersion: "2020-08-27" });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "eur",
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
        transfer_group: transferGroup,
        // on_behalf_of: source?.account,
      },
      mode: "payment",
      allow_promotion_codes: true,
      success_url: URL + "/",
      cancel_url: URL + "/",
    });
    const paymentIntent = session.payment_intent as string;
    const id = await addOrder(
      paymentIntent,
      source,
      offer,
      transferGroup,
      recipient_address,
      amount,
      price,
      !!test
    );
    console.log("Payment intent registered: ", paymentIntent, "saved as order: " + id);
    authByBearer
      ? res.json({ status: 200, message: session.url! })
      : res.redirect(303, session.url!);
  } catch (error) {
    console.log(error);
    res.json({ status: 500, message: "Something went wrong, please try again later" });
  }
}

async function authenticateSource(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<false | WithId<ManualSource | CustodialSource>> {
  try {
    // Auth via Bearer token
    if (!!req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      const sources = await getActiveSources();
      const source = sources.find(
        (source) => source.secret === req.headers.authorization?.substring(7)
      );
      if (source) return source;
      else {
        res.json({ status: 401, message: "Invalid token" });
        return false;
      }
    } else {
      return false;
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({
      status: 500,
      message: "Internal server error.",
    });
    return false;
  }
}
async function authenticateHuman(req: NextApiRequest, res: NextApiResponse) {
  // Auth via captcha
  try {
    if (process.env.DEV) return true;
    if (
      req.body["g-recaptcha-response"] === undefined ||
      req.body["g-recaptcha-response"] === "" ||
      req.body["g-recaptcha-response"] === null
    ) {
      console.log("Not captcha header, aborting");
      res.json({ status: 401, message: "captcha missing" });
      return false;
    }
    const verificationURL =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      process.env.CAPTCHA +
      "&response=" +
      req.body["g-recaptcha-response"];
    const approval = await axios.post(verificationURL);
    if (!approval.data.success) {
      console.log(
        "Invalid captcha header, aborting",
        approval.data.success,
        approval.data["error-codes"]
      );
      res.json({ status: 401, message: "captcha error" });
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
    res.json({ status: 500, message: "Internal server error." });
    return false;
  }
}
