import { getOrder,  sendMail, updateStatus } from "./_utils";
import stripeJs from "stripe";
import { sendBanano } from "./_banano";

export default async function handleWebhook(event: stripeJs.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const paymentIntent = event.data.object;
        const findOrderAddressAndAmountByPaymentIntent = async (pi: string) => {
          let order = await getOrder(pi);
          return order
            ? { address: order.address, amount: order.amount }
            : { address: null, amount: null };
        };

        // @ts-expect-error
        const paymentId: string = paymentIntent.id;
        const { address, amount } = await findOrderAddressAndAmountByPaymentIntent(paymentId);
        if (address && amount) {
          console.log("Successfully payed! Now sending " + amount + " bananos to " + address);
          sendMail("Successfully payed! Now sending " + amount + " bananos to " + address);

          sendBanano(amount, address);
          updateStatus(paymentId, "succeeded");
          console.log("Order fulfilled");
          return 200;
        } else {
          console.error("Could not find order with payment intent: " + paymentId);
          sendMail("Could not find order with payment intent: " + paymentId);
          return 500;
        }
      } catch (err) {
        console.log(err);
        return 500;
      }
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
      return 200;
  }
}

export async function constructEvent(buf: Buffer, sig: string, test: boolean): Promise<stripeJs.Event> {
  const stripe = new stripeJs(test ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!, {
    apiVersion: "2020-08-27",
  });
  let event;
  const webhookSecret = process.env.TEST
    ? process.env.LOCAL_ENDPOINT!
    : test
    ? process.env.TEST_ENDPOINT!
    : process.env.ENDPOINT!;
  try {
  event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STAGING_ENDPOINT!);
  }
  return event;
}