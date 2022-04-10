import { readFileSync, writeFileSync } from "fs";
import { Order } from "./_types";
import stripeJs from "stripe";
import { sendBanano } from "./_utils";

export default function handleWebhook(event: stripeJs.Event) {
  switch (event.type) {
    case "payment_intent.succeeded":
      try {
        const paymentIntent = event.data.object;
        const findOrderAddressAndAmountByPaymentIntent = (pi: string) => {
          let data = JSON.parse(readFileSync("orders.json", { encoding: "utf-8" })) as Order[];
          const order = data.find((order) => order.paymentIntent == pi);
          return order
            ? { address: order.address, amount: order.amount }
            : { address: process.env.SERVER_ADDR!, amount: 0 };
        };
        const updateStatus = (pi: string) => {
          let data = JSON.parse(readFileSync("orders.json", { encoding: "utf-8" })) as Order[];
          const updated = data.map((order) => {
            if (order.paymentIntent == pi) {
              order.status = "successful";
            }
            return order;
          });
          writeFileSync("orders.json", JSON.stringify(updated, null, 2));
        };
        // @ts-expect-error
        const paymentId: string = paymentIntent.id;
        const { address, amount } = findOrderAddressAndAmountByPaymentIntent(paymentId);
        console.log("Successfully payed! Now sending " + amount + " bananos to " + address);

        address && amount && sendBanano(amount, address);
        updateStatus(paymentId);

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
