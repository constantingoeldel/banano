import app from "express";
import { buffer, json } from "micro";
import { body, validationResult } from "express-validator";
import { getBalance, getRate, sendBanano } from "../../utils/banano";
import create from "./create";
import { constructEvent, handleWebhook } from "./webhook";

const server = app();

server.get("/", async (req, res) => {
  if (req.headers["authorization"] !== process.env.API_KEY) {
    res.status(401).send("Unauthorized");
    return;
  }
  const address = process.env.ADDRESS!;
  const margin = 1.02;
  const balance = await getBalance(address);
  let rate = (await getRate()) * margin;
  res.json({ balance, rate });
});

server.post("/", async (req, res) => {
  //@ts-ignore
  const requestIsValid = ({ payment, amount, address }) => {
    // implementation left up to the user
    return true;
  };
  if (req.headers["authorization"] !== process.env.API_KEY) {
    res.status(401).send("Unauthorized");
    return;
  }
  if (!requestIsValid(req.body)) {
    res.status(400).send("Invalid request");
    return;
  }
  const hash = await sendBanano(req.body.amount, req.body.address, process.env.SEED!);
  res.json({ hash });
});

server.get("webhook", async (req, res) => {
  const buf = (await buffer(req)) as Buffer;
  const body = await json(req);
  const livemode = body.data.object.livemode;
  const sig = req.headers["stripe-signature"] as string;
  const event = await constructEvent(buf, sig, !livemode);
  const response = await handleWebhook(event);
  console.log("Webhook handled with exit code:", response);

  res.status(response).json({ received: true, success: response === 200 });
});
server.post(
  "/create",
  body("custodial").isBoolean(),
  body("price"),
  body("webhook").optional().isURL(),
  body("price").optional().isObject(),
  body("email").isEmail().normalizeEmail(),
  body("address").matches("ban_.{60}"),
  body("name").isString().trim().escape(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      //@ts-ignore
      const redirectURL = await create(...req.body);
      res.redirect(redirectURL);
    } catch (e) {
      console.error(e);
      res.status(400).send(String(e));
    }
  }
);

server.listen(3003, () => {
  console.log("Server listening on port 3003");
});
