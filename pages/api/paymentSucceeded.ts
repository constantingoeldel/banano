import { sendBanano, verifyTransaction } from "../../utils/banano";
import axios, { AxiosResponse } from "axios";
import { transfer } from "../../utils/stripe";
import { getOrder, patchOrder, updateStatus } from "../../utils/db";
import { sendMail } from "../../utils/mail";
import { Order } from "../../types";

const URL = process.env.DEV ? "dev.acctive.digital" : "https://banano.acctive.digital";

export default async function paymentSucceeded(paymentIntent: string): Promise<number> {
  try {
    const order = await getOrder(paymentIntent);
    if (order.origin !== URL) return 200;
    const hash = order.hash || (await pay(order));
    return await veryifyAndProcess(hash, order);
  } catch (err) {
    paymentIntent && updateStatus(paymentIntent, "failed");
    const mail = await sendMail(
      "An error occured while fulfilling an order:" +
        err +
        "\n" +
        "The request was: " +
        paymentIntent
    );
    console.log(err);
    console.log("Order failed", mail);
    return 500;
  }
}
async function veryifyAndProcess(hash: string, order: Order) {
  const valid = await verifyTransaction(hash, order.address, order.amount);
  if (valid) {
    const price_after_fees = order.test ? 1 : order.price - 25 - order.price * 0.05;
    patchOrder(order.paymentIntent, { hash: hash });
    if (order.test) {
      await updateStatus(order.paymentIntent, "succeeded");
      console.log("Not post-processing payment because test mode is on");
      sendMail("Test mode is on, not transfering payment.", order.source.email);
      return 200;
    }
    return await postPayment(order, price_after_fees, order.paymentIntent, hash);
  } else {
    await updateStatus(order.paymentIntent, "invalid hash");
    const msg =
      "Payment hash is invalid. Not post-processing this payment. Please contact banano@acctive.digital";
    console.log(msg);
    await sendMail(msg);
    await sendMail(msg, order.source.email);
    return 500;
  }
}

async function pay(order: Order) {
  let hash: string;
  if (order.source.custodial) {
    hash = await sendBanano(order.amount, order.address, order.source.seed);
    console.log(
      "Successfully payed! Now sending " +
        order.amount +
        " bananos to " +
        order.address +
        " with hash " +
        hash
    );
  } else {
    const response: AxiosResponse<{ hash: string }> = await axios.post(
      order.source.webhook,
      {
        amount: order.amount,
        address: order.address,
        test: order.test,
      },
      { headers: { Authorization: order.source.secret } }
    );
    hash = response.data.hash;
  }
  return hash;
}

async function postPayment(
  order: Order,
  price_after_fees: number,
  paymentIntent: string,
  hash: string
) {
  console.log(
    "Transaction is valid and confirmed! Charging " +
      (order.price - price_after_fees) +
      " ct. for this order. " +
      price_after_fees +
      " will be payed out to source " +
      order.source.id
  );
  const result = order.transferId
    ? { id: order.transferId, amount: order.transferAmount }
    : await transfer(
        Math.floor(price_after_fees),
        order.source.account,
        order.transferGroup,
        process.env.DEV_MODE == "true"
      );
  await patchOrder(paymentIntent, { transferId: result.id, transferAmount: price_after_fees });
  await updateStatus(paymentIntent, "succeeded");
  const msg =
    "Successfully payed! Now sending " +
    order.amount +
    " bananos to " +
    order.address +
    " with hash " +
    hash;
  await sendMail(msg);
  await sendMail(
    "Merchant Update: \n The order has been fulfilled. You will receive " +
      price_after_fees / 100 +
      "€ for the " +
      order.amount +
      " BAN you provided. See all the details in your dashboard at banano.acctive.digital/dash",
    order.source.email
  );
  console.log("Order fulfilled");

  return 200;
}
