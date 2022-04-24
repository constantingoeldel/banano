import stripeJs from "stripe";
import { sendBanano, verifyTransaction } from "../../utils/banano";
import axios, { AxiosResponse } from "axios";
import { transfer } from "../../utils/stripe";
import { getOrder, updateStatus } from "../../utils/db";
import { sendMail } from "../../utils/mail";

export default async function paymentSucceeded(event: stripeJs.Event) {
  try {
    const paymentIntent = event.data.object;
    // @ts-expect-error
    const paymentId: string = paymentIntent.id;
    const order = await getOrder(paymentId);
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

    const valid = await verifyTransaction(hash, order);
    const price_after_fees = order.test ? 1 : order.price - 25 - order.price * 0.05;

    if (valid) {
      console.log(
        "Transaction is valid and confirmed! Charging " +
          (order.price - price_after_fees) +
          " ct. for this order. " +
          price_after_fees +
          " will be payed out to source " +
          order.source.id
      );
      const result = await transfer(
        price_after_fees,
        order.source.account,
        order.transferGroup,
        process.env.DEV_MODE == "true"
      );
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
    } else {
      await updateStatus(paymentId, "invalid hash");
      const msg = "Payment hash is invalid. Please contact banano@acctive.digital";
      console.log(msg);
      await sendMail(msg);
      await sendMail(msg, order.source.email);
      return 500;
    }
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
