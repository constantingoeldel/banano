import stripeJs from "stripe";
export async function transfer(
  amount: number,
  destination: string,
  transfer_group: string,
  dev: boolean
) {
  const stripeSecret = dev ? process.env.STRIPE_TEST_SECRET! : process.env.STRIPE_SECRET!;
  const stripe = new stripeJs(stripeSecret, { apiVersion: "2020-08-27" });
  const transfer = await stripe.transfers.create({
    amount: amount,
    currency: "eur",
    destination,
    transfer_group,
  });
  console.log(transfer);
  return transfer;
}
