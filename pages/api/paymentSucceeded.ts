import stripeJs from "stripe";
import { sendBanano, verifyTransaction } from "../../utils/banano";
import axios, { AxiosResponse } from "axios";
import { transfer } from "../../utils/stripe";
import { getOrder, patchOrder, updateStatus } from "../../utils/db";
import { sendMail } from "../../utils/mail";
import { Order } from "../../types";

export default async function paymentSucceeded(event: stripeJs.Event): Promise<number> {
  try {
    const paymentIntent = event.data.object;
    // @ts-expect-error
    const paymentId: string = paymentIntent.id;
    const order = await getOrder(paymentId);
    const hash = order.hash || (await pay(order));
    return await veryifyAndProcess(hash, order);
  } catch (err) {
    // @ts-expect-error
    event?.data?.object?.id && updateStatus(event.data.object.id, "failed");
    const mail = await sendMail(
      "An error occured while fulfilling an order:" +
        err +
        "\n" +
        "The request was: " +
        JSON.stringify(event.data.object)
    );
    console.log(err);
    console.log("Order failed", mail);
    return 500;
  }
}
async function veryifyAndProcess(hash: string, order: Order) {
  const valid = await verifyTransaction(hash, order);
  if (valid) {
    const price_after_fees = order.test ? 1 : order.price - 25 - order.price * 0.05;
    patchOrder(order.paymentIntent, { hash: hash });
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
  paymentId: string,
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
        price_after_fees,
        order.source.account,
        order.transferGroup,
        process.env.DEV_MODE == "true"
      );
  await patchOrder(paymentId, { transferId: result.id, transferAmount: price_after_fees });
  await updateStatus(paymentId, "succeeded");
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
