import Stripe from "stripe";
import { generateNewAccount } from "../../utils/banano";
import { nanoid } from "nanoid";
import { CustodialSource, ManualSource, Price, Source } from "../../types";
import { addSource, createUser } from "../../utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import validator from "validator";
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log("Received request", req.query);
    if (
      typeof req.query.email === "string" &&
      validator.isEmail(req.query.email) &&
      typeof req.query.name === "string"
    ) {
      if (req.query.method === "custodial") {
        if (
          typeof req.query.min === "string" &&
          validator.isNumeric(req.query.min) &&
          typeof req.query.margin === "string" &&
          validator.isNumeric(req.query.margin)
        ) {
          const redirectURL = await create(true, req.query.name, req.query.email, undefined, {
            min: Number(req.query.min),
            margin: Number(req.query.margin),
            market: req.query.market === "on",
          });
          res.redirect(redirectURL);
          return;
        }
      } else if (req.query.method === "manual") {
        console.log("Creating manual source");
        if (
          typeof req.query.webhook === "string" &&
          validator.isURL(req.query.webhook, { require_tld: false })
        ) {
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
    res.status(400).json({ error: e });
  }
}

async function create(
  custodial: boolean,
  name: string,
  email: string,
  webhook?: string,
  price?: Price
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET!, { apiVersion: "2020-08-27" });
  const createAccount = async (source: CustodialSource | ManualSource) => {
    await addSource(source);
    source.custodial && (await createUser(source.address, source.id));
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: "https://banano.acctive.digital/create",
      return_url: "https://banano.acctive.digital/dashboard/",
      type: "account_onboarding",
    });
    return accountLink.url;
  };
  const id = nanoid();
  const account = await stripe.accounts.create({
    type: "express",
    email: email,
    business_type: "individual",
    business_profile: {
      url: "https://banano.acctive.digital/source/" + id,
    },
  });

  const baseSource: Source = {
    id: "sid_" + id,
    secret: "secret_" + nanoid(),
    email,
    name,
    account: account.id,
    active: false,
  };
  console.log("Adding new source with baseSource", baseSource);
  console.log(price);
  if (
    price?.margin &&
    price?.margin > 0 &&
    price?.min &&
    price?.min > 0 &&
    typeof price?.market === "boolean"
  ) {
    const { seed, address } = await generateNewAccount();
    const source: CustodialSource = {
      ...baseSource,
      custodial: true,
      address,
      seed,
      price: {
        min: price.min,
        margin: price.margin / 100,
        market: price.market,
      },
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
