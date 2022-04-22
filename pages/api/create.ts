// send custodials seed phrase
// adjust margin

import Stripe from "stripe";
import { generateNewAccount } from "../../utils/banano";
import { nanoid } from "nanoid";
import { CustodialSource, ManualSource, Price, Source } from "../../types";
import { addSource } from "../../utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import validator from "validator";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (validator.isEmail(req.query.email) && typeof req.query.name === "string") {
      if (req.query.method === "custodial") {
        if (validator.isNumeric(req.query.min) && validator.isNumeric(req.query.margin)) {
          const redirectURL = await create(true, req.query.name, req.query.email, null, {
            min: req.query.min,
            margin: req.query.margin,
            market: req.query.market === "on",
          });
          res.redirect(redirectURL);
          return;
        }
      } else if (req.query.method === "manual") {
        if (req.query.webhook && validator.isURL(req.query.webhook)) {
          const redirectURL = await create(
            false,
            req.query.name,
            req.query.email,
            req.query.webhook
          );
          res.redirect(redirectURL);
          return;
        }
      }
    }
    res.status(400).json({ error: "Invalid request" });
  } catch (e) {
    console.log(e);
    res.status(400).json({ error: e.message });
  }
}

async function create(
  custodial: boolean,
  name: string,
  email: string,
  webhook?: string,
  price?: Price
) {
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET!, { apiVersion: "2020-08-27" });
  const createAccount = async (source: CustodialSource | ManualSource) => {
    const account = await stripe.accounts.create({
      type: "express",
      email: source.email,
      business_type: "individual",
      business_profile: {
        url: "https://banano.acctive.digital/source/" + source.id.replace("sid_", ""),
      },
    });
    source.account = account.id;
    await addSource(source);
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://banano.acctive.digital/create",
      return_url: "https://banano.acctive.digital/dashboard/" + source.id.replace("sid_", ""),
      type: "account_onboarding",
    });
    return accountLink.url;
  };

  const baseSource: Source = {
    id: "sid_" + nanoid(),
    secret: "secret_" + nanoid(),
    email,
    name,
    active: false,
  };
  console.log("Adding new source with baseSource", baseSource);
  if (
    custodial &&
    price?.margin &&
    price?.margin > 0 &&
    price?.min &&
    price?.min > 0 &&
    price?.market &&
    typeof price?.market === "boolean"
  ) {
    const { seed, address } = await generateNewAccount();
    const source: CustodialSource = {
      ...baseSource,
      custodial: true,
      address,
      seed,
      price,
    };
    console.log("Adding new custodial source", source);
    return await createAccount(source);
  } else if (!custodial && webhook) {
    const source: ManualSource = {
      ...baseSource,
      custodial: false,
      webhook,
    };
    return await createAccount(source);
  } else {
    throw new Error("Invalid request");
  }
}
