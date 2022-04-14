import { getOrder, sendMail, updateStatus } from "./_utils";
import stripeJs from "stripe";
import { sendBanano } from "./_banano";

export default async function handleWebhook(event: stripeJs.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const paymentIntent = event.data.object;
        // @ts-expect-error
        const paymentId: string = paymentIntent.id;
        const order = await getOrder(paymentId);
        const hash = await sendBanano(order.amount, order.address);
        console.log(
          "Successfully payed! Now sending " +
            order.amount +
            " bananos to " +
            order.address +
            " with hash " +
            hash
        );

        await updateStatus(paymentId, "succeeded");
        const mail = await sendMail(
          "Successfully payed! Now sending " +
            order.amount +
            " bananos to " +
            order.address +
            " with hash " +
            hash
        );
        console.log("Order fulfilled", mail);
        return 200;
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
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
      return 200;
  }
}

export async function constructEvent(
  buf: Buffer,
  sig: string,
  test: boolean
): Promise<stripeJs.Event> {
  const stripe = new stripeJs(test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!, {
    apiVersion: "2020-08-27",
  });
  let event;
  const DEV_MODE = process.env.DEV;
  const local = process.env.LOCAL_ENDPOINT!;
  const test_payment = process.env.TEST_ENDPOINT!;
  const normal_payment = process.env.ENDPOINT!;
  const staging = process.env.STAGING_ENDPOINT!;
  const webhookSecret = DEV_MODE ? local : test ? test_payment : normal_payment;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch {
    try {
      event = stripe.webhooks.constructEvent(buf, sig, staging);
    } catch {
      throw new Error("Could not construct event");
    }
  }
  return event;
}
