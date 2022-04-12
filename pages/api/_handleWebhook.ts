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
        sendMail(
          "Successfully payed! Now sending " +
            order.amount +
            " bananos to " +
            order.address +
            " with hash " +
            hash
        );

        await updateStatus(paymentId, "succeeded");
        console.log("Order fulfilled");
        return 200;
      } catch (err) {
        sendMail("An error occured while fulfilling an order:" + err);
        console.log(err);
        // @ts-expect-error
        updateStatus(event.data.object.id, "failed");
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
  const stripe = new stripeJs(
    test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!,
    {
      apiVersion: "2020-08-27",
    }
  );
  let event;
  const webhookSecret = process.env.TEST
    ? process.env.LOCAL_ENDPOINT!
    : test
    ? process.env.TEST_ENDPOINT!
    : process.env.ENDPOINT!;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch {
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STAGING_ENDPOINT!
    );
  }
  return event;
}
