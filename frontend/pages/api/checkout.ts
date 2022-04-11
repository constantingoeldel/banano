import { NextApiRequest, NextApiResponse } from "next";
import { addOrder, getBalance, getRate } from "./_utils";
import stripeJs from "stripe";
import axios from "axios";

interface Redirect {
  url: string;
  status: number;
}

interface Error {
  status: number;
  message: string;
}
const URL = "https://banano.acctive.digital";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Redirect | Error>) {
  console.log("Received new checkout request");
  try {
    if (!process.env.TEST || req.headers.authorization !== "Bearer " + process.env.BEARER_TOKEN!) {
      if (
        req.body["g-recaptcha-response"] === undefined ||
        req.body["g-recaptcha-response"] === "" ||
        req.body["g-recaptcha-response"] === null
      ) {
        console.log("Not captcha header, aborting");
        return res.json({ status: 401, message: "captcha missing" });
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
        return res.json({ status: 401, message: "captcha error" });
      }
    }
    console.log("Request is valid");
    const amount = Number(req.body.amount);
    const test = req.body.test || false;
    test && console.log("Test payment requested");
    const stripeSecret = test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
    const address = req.body.address;
    const balance = await getBalance();
    if (!amount || amount < 100 || amount > balance) {
      res.json({
        status: 400,
        message: "Invalid amount entered",
      });

      return;
    }
    if (!address.match("ban_.{60}")) {
      res.json({ status: 400, message: "invalid address. Please provide a valid ban address" });
      return;
    }

    const exchangeRate = await getRate();
    const price = Math.ceil(amount * exchangeRate * 100) + 25;
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
      mode: "payment",
      allow_promotion_codes: true,
      success_url: URL + "/",
      cancel_url: URL + "/",
    });
    const paymentIntent = session.payment_intent as string;

    res.redirect(303, session.url!);
    const id = await addOrder(paymentIntent, address, amount, price, !!test);
    console.log("Payment intent registered: ", paymentIntent, "saved as order: " + id);
  } catch (error) {
    console.log(error);
    res.redirect(500, "/");
  }
}
