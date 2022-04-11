import { readFileSync, writeFileSync } from "fs";
import { Order } from "./_types";
import stripeJs from "stripe";
import { getOrder, sendBanano, sendMail, updateStatus } from "./_utils";

export default async function handleWebhook(event: stripeJs.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const paymentIntent = event.data.object;
        const findOrderAddressAndAmountByPaymentIntent = async (pi: string) => {
          let order = await getOrder(pi);
          if (!order) {
            console.error("Could not find order with payment intent: " + pi);
            sendMail("Could not find order with payment intent: " + pi);
          }
          return order
            ? { address: order.address, amount: order.amount }
            : { address: process.env.ADDRESS!, amount: 0 };
        };

        // @ts-expect-error
        const paymentId: string = paymentIntent.id;
        const { address, amount } = await findOrderAddressAndAmountByPaymentIntent(paymentId);
        console.log("Successfully payed! Now sending " + amount + " bananos to " + address);
        sendMail("Successfully payed! Now sending " + amount + " bananos to " + address);

        address && amount && sendBanano(amount, address);
        updateStatus(paymentId, "succeeded");

        console.log("Order fulfilled");
      } catch (err) {
        console.log(err);
      }
      break;
    case "payment_method.attached":
      const paymentMethod = event.data.object;
      console.log("PaymentMethod was attached to a Customer!");
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}
